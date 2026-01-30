# Multi-Router Panel Architecture — Research & Design

> Status: **RESEARCH / OPEN QUESTIONS**
> Date: 2025-01-30
> Context: splitstate-router project — dual-panel navigation

---

## 1. Hypothesis

Использовать **несколько экземпляров TanStack Router** для типобезопасной двухпанельной навигации:

- Единое дерево роутов с ветками `leftPanel/...` и `rightPanel/...`
- Несколько `RouterProvider` — один для основного контента, по одному на панель
- Панельные роуты меняют query params (`?left=...&right=...`), обычные — pathname
- Режимы взаимоисключающие: **или** панели, **или** основной контент

### Goals (по приоритету)

1. **Типобезопасность** — роуты панелей типизированы как обычные TanStack Router маршруты
2. **Масштабируемость** — вложенные роуты панелей без ручного реестра
3. **Единообразие API** (nice-to-have) — панельные роуты пишутся так же, как обычные

---

## 2. Findings: TanStack Router Internals

### 2.1 Custom History — ПОДДЕРЖИВАЕТСЯ

`createRouter({ history })` принимает любой объект, реализующий `RouterHistory` interface:

```typescript
interface RouterHistory {
  location: HistoryLocation
  push: (path: string, state?: any) => void
  replace: (path: string, state?: any) => void
  subscribe: (cb: (opts: SubscriberArgs) => void) => () => void
  // ... остальные методы
}
```

Доступные реализации:
- `createBrowserHistory()` — стандартная (pathname)
- `createHashHistory()` — hash-based
- `createMemoryHistory()` — in-memory, без URL
- **Custom** — любой объект по интерфейсу

**Source**: [history/src/index.ts#L18-L34](https://github.com/TanStack/router/blob/5ae6217746965726310e90633a02aeb88aa7c960/packages/history/src/index.ts#L18-L34)

### 2.2 Multiple RouterProvider — ВОЗМОЖНО, С ОГОВОРКАМИ

Можно маунтить несколько `<RouterProvider router={...}>` на одной странице. Каждый принимает свой router instance.

**Проблемы:**
- Два роутера с `createBrowserHistory()` конфликтуют за `window.history` и `popstate`
- Только один URL — если оба пишут, перезаписывают друг друга
- **Решение**: secondary routers используют `createMemoryHistory()`

### 2.3 Outlet — НЕ РАСШИРЯЕТСЯ

`<Outlet />` жёстко рендерит `router.state.matches[index + 1]`:

```typescript
// Match.tsx#L311-L335
export const Outlet = React.memo(function OutletImpl() {
  const matchId = React.useContext(matchContext)
  const childMatchId = useRouterState({
    select: (s) => {
      const index = s.matches.findIndex((d) => d.id === matchId)
      return matches[index + 1]?.id
    },
  })
  return childMatchId ? <Match matchId={childMatchId} /> : null
})
```

**Source**: [Match.tsx#L311-L335](https://github.com/TanStack/router/blob/5ae6217746965726310e90633a02aeb88aa7c960/packages/react-router/src/Match.tsx#L311-L335)

**Нельзя:**
- Иметь два активных branch-а в одном роутере
- Кастомизировать matching logic
- Заменить `<Matches />` внутри `RouterProvider`

### 2.4 Route Matching — ЛИНЕЙНАЯ ЦЕПОЧКА

`router.state.matches` — всегда одна цепочка root → leaf. Для `/users/123/files`:

```typescript
[
  { routeId: '__root__' },
  { routeId: '/users' },
  { routeId: '/users/$userId', params: { userId: '123' } },
  { routeId: '/users/$userId/files' },
]
```

Нет способа иметь два параллельных branch-а в одном matches.

### 2.5 Type Registration — ОДИН НА ПРИЛОЖЕНИЕ

```typescript
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof mainRouter  // только один тип
  }
}
```

Глобальный `useParams()` типизирован по одному роутеру. Для multi-router: использовать `leftRouter.useParams()` вместо глобального импорта.

### 2.6 Доступные точки расширения

| Feature | Customizable? | How |
|---------|:---:|-----|
| History | YES | `createRouter({ history })` |
| Component fallback | YES | `defaultComponent`, per-route `component` |
| Error boundaries | YES | `defaultErrorComponent` |
| Wrappers | YES | `Wrap`, `InnerWrap` options |
| Match logic | NO | Hardcoded |
| Outlet traversal | NO | Always `matches[index + 1]` |
| Multiple branches | NO | Single hierarchical path |
| Custom render | NO | `<Matches />` hardcoded in Provider |

---

## 3. Explored Approaches

### 3.1 Path A: Единый роутер + namespace-префиксы (ОТКЛОНЁН)

**Идея:**
```
rootRoute
  ├── /home
  ├── /settings/billing
  ├── /leftPanel/dash/sub1
  └── /rightPanel/route1
```

Custom history маппит `/leftPanel/...` → `?left=...`, `/rightPanel/...` → `?right=...`.

`<Link to="/rightPanel/route2">` работает из любого места — типизировано.

**Почему отклонён:**
- `Outlet` поддерживает только один активный branch
- `<Link to="/rightPanel/route2">` вызовет обычную навигацию, заменит весь match
- Невозможно рендерить два branch-а одновременно из одного роутера
- Пришлось бы полностью обходить matching/rendering layer

### 3.2 Path B: Три роутера + Memory History + PanelSync (ТЕКУЩИЙ КАНДИДАТ)

**Архитектура:**

```
┌───────────────────────────────────────────────────┐
│  MainRouter (browser history)                      │
│  Владеет URL целиком: pathname + search params     │
│  Дерево: /home, /settings/billing, ...             │
│                                                    │
│  ?left= или ?right= в URL →                       │
│  рендерит <PanelShell> вместо основного контента   │
└──────────┬──────────────────────┬─────────────────┘
           │                      │
     sync ?left=              sync ?right=
           │                      │
┌──────────▼─────────┐  ┌────────▼──────────────┐
│ LeftRouter          │  │ RightRouter            │
│ memory history      │  │ memory history         │
│ /dash, /dash/sub1   │  │ /route1, /route2       │
└─────────────────────┘  └────────────────────────┘
```

**Определение роутов:**

```typescript
// routes/main.ts — browser history (default)
export const mainRouter = createRouter({ routeTree: mainRouteTree })

// routes/left-panel.ts — memory history
export const leftRouter = createRouter({
  routeTree: leftPanelRouteTree,
  history: createMemoryHistory({ initialEntries: ['/dash'] }),
})

// routes/right-panel.ts — memory history
export const rightRouter = createRouter({
  routeTree: rightPanelRouteTree,
  history: createMemoryHistory({ initialEntries: ['/route1'] }),
})
```

**PanelSync — координатор:**

```typescript
function createPanelSync({ mainRouter, leftRouter, rightRouter }) {
  let isSyncing = false

  function syncFromURL() {
    if (isSyncing) return
    isSyncing = true
    const search = mainRouter.state.location.search
    if (search.left) leftRouter.navigate({ to: search.left })
    if (search.right) rightRouter.navigate({ to: search.right })
    isSyncing = false
  }

  function syncToURL(panel: 'left' | 'right', pathname: string) {
    if (isSyncing) return
    isSyncing = true
    mainRouter.navigate({
      search: (prev) => ({ ...prev, [panel]: pathname }),
    })
    isSyncing = false
  }

  const unsubs = [
    mainRouter.subscribe('onResolved', syncFromURL),
    leftRouter.subscribe('onResolved', () =>
      syncToURL('left', leftRouter.state.location.pathname)
    ),
    rightRouter.subscribe('onResolved', () =>
      syncToURL('right', rightRouter.state.location.pathname)
    ),
  ]

  return { destroy: () => unsubs.forEach((fn) => fn()) }
}
```

**Рендеринг:**

```tsx
function PanelShell() {
  useEffect(() => {
    const sync = createPanelSync({ mainRouter, leftRouter, rightRouter })
    return sync.destroy
  }, [])

  return (
    <div className="flex h-screen">
      <RouterProvider router={leftRouter} />
      <RouterProvider router={rightRouter} />
    </div>
  )
}
```

**Переключение режимов:**

MainRouter рендерит `<PanelShell>` если в search есть `left` или `right`, иначе — обычный `<Outlet />`.

**Плюсы:**
- Типобезопасность внутри каждой панели (useParams, useSearch, Link — всё работает)
- Вложенные роуты, loaders, error boundaries — всё из коробки
- Чистое разделение: memory history не конфликтует с browser history
- `isSyncing` флаг предотвращает циклы

**Минусы:**
- Кросс-панельная навигация через хелпер, не через `<Link>`
- Type Register — только один глобальный, остальные через `router.useParams()`
- Дополнительный слой синхронизации (PanelSync)

---

## 4. Open Questions

### Q1: Кросс-панельная навигация

Из левой панели нужно открыть что-то в правой. `<Link>` не работает кросс-роутерно.

**Текущее решение:**

```tsx
const PanelContext = createContext<{
  navigateLeft: (to: string) => void
  navigateRight: (to: string) => void
  navigateMain: (to: string) => void
}>()

// Использование:
const { navigateRight } = usePanelContext()
<button onClick={() => navigateRight('/route2')}>Open right</button>
```

**Открытый вопрос:** можно ли типизировать аргумент `to` через дженерик от дерева соответствующего роутера? Тогда хотя бы автокомплит путей будет.

### Q2: Начальная синхронизация

Порядок:
1. URL: `/?left=/dash/sub1&right=/route2`
2. MainRouter парсит → рендерит PanelShell
3. useEffect создаёт PanelSync → syncFromURL()
4. leftRouter/rightRouter навигируют

**Открытый вопрос:** будет ли flash of wrong content между шагами 2 и 4? Memory history инициализируется с `initialEntries` — если они не совпадают с URL, будет мигание.

**Возможное решение:** инициализировать memory history из текущего URL:

```typescript
const leftInitial = new URLSearchParams(window.location.search).get('left') || '/dash'
export const leftRouter = createRouter({
  history: createMemoryHistory({ initialEntries: [leftInitial] }),
})
```

### Q3: Browser Back/Forward

Когда пользователь нажимает Back в браузере:
1. MainRouter получает popstate
2. PanelSync.syncFromURL() обновляет memory routers

**Открытый вопрос:** memory routers не имеют собственной history stack. Back/Forward не восстановит их предыдущее состояние — только то, что записано в URL через `?left=` и `?right=`. Достаточно ли этого?

### Q4: Deep Linking

URL `/?left=/dash/sub1&right=/route2` — полностью описывает состояние. Можно поделиться ссылкой, и она откроет то же состояние. Это работает из коробки с текущим дизайном.

### Q5: Могут ли панели шарить роуты?

Сейчас leftRouter и rightRouter имеют разные деревья. Что если один и тот же роут нужен в обеих панелях?

**Варианты:**
- Общее дерево для обоих → два роутера с одинаковым routeTree, но разной memory history
- Разные деревья, общие компоненты → view components импортируются в оба дерева

### Q6: Альтернативный подход — один роутер без Outlet

~~Не исследован полностью.~~ → **Развит в Path C** (см. секцию 3.3).

---

## 3.3 Path C: Единый роутер + `<LinkLeft>` / `<LinkRight>` со StripPrefix (ОТКЛОНЁН)

> Эволюция Q6. Развивает идею единого роутера с ручным рендерингом,
> добавляя типобезопасные компоненты навигации.

### Концепция

Одно дерево, один роутер, один Register. Панельные роуты живут в ветках
`/leftPanel/...` и `/rightPanel/...`. Кастомные `<LinkLeft>` и `<LinkRight>`
типизированы по своей ветке, но генерируют query params вместо pathname.

### Дерево роутов

```typescript
// routes.ts
const rootRoute = createRootRoute({ component: AppShell })

// Обычные роуты — стандартный Outlet
const homeRoute = createRoute({ path: '/home', ... })
const settingsRoute = createRoute({ path: '/settings', ... })
const billingRoute = createRoute({ path: '/settings/billing', ... })

// Левая панель
const leftPanelRoot = createRoute({ path: '/leftPanel', ... })
const dashRoute = createRoute({ getParentRoute: () => leftPanelRoot, path: '/dash', ... })
const sub1Route = createRoute({ getParentRoute: () => dashRoute, path: '/sub1', ... })
const sub2Route = createRoute({ getParentRoute: () => dashRoute, path: '/sub2', ... })

// Правая панель
const rightPanelRoot = createRoute({ path: '/rightPanel', ... })
const route1 = createRoute({ getParentRoute: () => rightPanelRoot, path: '/route1', ... })
const route2 = createRoute({ getParentRoute: () => rightPanelRoot, path: '/route2', ... })

export const routeTree = rootRoute.addChildren([
  homeRoute,
  settingsRoute.addChildren([billingRoute]),
  leftPanelRoot.addChildren([dashRoute.addChildren([sub1Route, sub2Route])]),
  rightPanelRoot.addChildren([route1, route2]),
])
```

### Типизация: StripPrefix

```typescript
import { RoutePaths } from '@tanstack/react-router'

type AllPaths = RoutePaths<typeof routeTree>

type StripPrefix<T extends string, P extends string> =
  T extends `${P}${infer Rest}` ? Rest : never

type LeftPanelPaths = StripPrefix<
  Extract<AllPaths, `/leftPanel${string}`>,
  '/leftPanel'
>
// → '/dash' | '/dash/sub1' | '/dash/sub2'

type RightPanelPaths = StripPrefix<
  Extract<AllPaths, `/rightPanel${string}`>,
  '/rightPanel'
>
// → '/route1' | '/route2'
```

### Рендеринг панелей

```tsx
function PanelShell() {
  const router = useRouter()
  const search = useSearch({ from: rootRoute.id })

  const leftPath = `/leftPanel${search.left}` as keyof typeof router.routesByPath
  const rightPath = `/rightPanel${search.right}` as keyof typeof router.routesByPath

  const LeftComponent = router.routesByPath[leftPath]?.options.component
  const RightComponent = router.routesByPath[rightPath]?.options.component

  return (
    <div className="flex h-screen">
      <div className="flex-1">
        {LeftComponent ? <LeftComponent /> : <NotFound />}
      </div>
      <div className="flex-1">
        {RightComponent ? <RightComponent /> : <NotFound />}
      </div>
    </div>
  )
}
```

### Почему отклонён: `<Outlet>` не работает внутри панелей

Панельные компоненты рендерятся вручную через `router.routesByPath` — они
**не находятся в match chain**. У них нет `matchId` в React Context.

Это значит:
- `<Outlet>` внутри панельного layout-а вернёт `null`
- Вложенные роуты (`/dash` → `/dash/sub1`) не рендерятся через Outlet
- `useParams()`, `useSearch()`, `useLoaderData()` не работают
- Панели становятся плоскими — каждый путь = отдельный компонент без layout nesting

**Это убивает масштабируемость** (goal #2) — для любого нетривиального приложения
нужны вложенные layout-ы внутри панелей.

### Что сохраняем из Path C

Типизация через `RoutePaths` + `StripPrefix` **работает** и переносится в Path D.
Концепция `<LinkLeft>` / `<LinkRight>` тоже переносится.

---

## 3.4 Path D: Гибрид B + C — Три роутера + типизированные LinkLeft/LinkRight (ТЕКУЩИЙ КАНДИДАТ)

> Берёт рендеринг из Path B (отдельные RouterProvider с memory history —
> Outlet работает) и типизацию из Path C (StripPrefix + RoutePaths).

### Концепция

Три роутера для **рендеринга** (каждый со своим match chain и Outlet),
но типизация `<LinkLeft>` / `<LinkRight>` строится из реальных route tree.
Кросс-панельная навигация через shared `PanelContext`.

### Архитектура

```
┌───────────────────────────────────────────────────────┐
│  MainRouter (browser history)                          │
│  Дерево: /home, /settings/billing, ...                 │
│  Владеет URL: pathname + search params                 │
│                                                        │
│  ?left= или ?right= → рендерит <PanelShell>           │
│  иначе → стандартный <Outlet>                          │
└──────────┬──────────────────────┬─────────────────────┘
           │                      │
     PanelSync                PanelSync
     sync ?left=              sync ?right=
           │                      │
┌──────────▼─────────┐  ┌────────▼──────────────────┐
│ LeftRouter          │  │ RightRouter                │
│ memory history      │  │ memory history             │
│ /dash               │  │ /route1                    │
│   └── /dash/sub1    │  │ /route2                    │
│   └── /dash/sub2    │  │                            │
│                     │  │                            │
│ ✅ Outlet работает  │  │ ✅ Outlet работает          │
│ ✅ useParams()      │  │ ✅ useParams()              │
│ ✅ useLoaderData()  │  │ ✅ useLoaderData()          │
└─────────────────────┘  └────────────────────────────┘
```

### Определение роутов

```typescript
// routes/left-panel.ts
const leftRoot = createRootRoute({ component: LeftPanelLayout })
const dashRoute = createRoute({
  getParentRoute: () => leftRoot,
  path: '/dash',
  component: DashLayout,  // содержит <Outlet /> — РАБОТАЕТ
})
const sub1Route = createRoute({
  getParentRoute: () => dashRoute,
  path: '/sub1',
  component: Sub1View,
})
const sub2Route = createRoute({
  getParentRoute: () => dashRoute,
  path: '/sub2',
  component: Sub2View,
})

export const leftPanelTree = leftRoot.addChildren([
  dashRoute.addChildren([sub1Route, sub2Route]),
])

export const leftRouter = createRouter({
  routeTree: leftPanelTree,
  history: createMemoryHistory({ initialEntries: ['/dash'] }),
})

// routes/right-panel.ts — аналогично
export const rightRouter = createRouter({
  routeTree: rightPanelTree,
  history: createMemoryHistory({ initialEntries: ['/route1'] }),
})
```

### Типизация: RoutePaths от panel trees

```typescript
import { RoutePaths } from '@tanstack/react-router'

// Типы путей извлекаются из деревьев панельных роутеров
type LeftPanelPaths = RoutePaths<typeof leftPanelTree>
// → '/' | '/dash' | '/dash/sub1' | '/dash/sub2'

type RightPanelPaths = RoutePaths<typeof rightPanelTree>
// → '/' | '/route1' | '/route2'
```

> **Примечание:** StripPrefix здесь НЕ НУЖЕН — панельные деревья
> уже не содержат `/leftPanel` префикс. Пути чистые из коробки.
> StripPrefix понадобился бы только при едином дереве (Path C).

### `<LinkLeft>` / `<LinkRight>` через PanelContext

```tsx
// lib/panel-context.ts
interface PanelNavigators {
  navigateLeft: (to: LeftPanelPaths) => void
  navigateRight: (to: RightPanelPaths) => void
  navigateMain: (to: string) => void
}

const PanelContext = createContext<PanelNavigators | null>(null)

function usePanelNav() {
  const ctx = useContext(PanelContext)
  if (!ctx) throw new Error('usePanelNav must be used within PanelShell')
  return ctx
}
```

```tsx
// components/panel-links.tsx
interface PanelLinkProps<TPaths extends string> {
  to: TPaths
  children: React.ReactNode
  className?: string
}

function LinkLeft({ to, children, ...props }: PanelLinkProps<LeftPanelPaths>) {
  const { navigateLeft } = usePanelNav()
  return (
    <a
      href={`/?left=${encodeURIComponent(to)}`}
      onClick={(e) => {
        e.preventDefault()
        navigateLeft(to)
      }}
      {...props}
    >
      {children}
    </a>
  )
}

function LinkRight({ to, children, ...props }: PanelLinkProps<RightPanelPaths>) {
  const { navigateRight } = usePanelNav()
  return (
    <a
      href={`/?right=${encodeURIComponent(to)}`}
      onClick={(e) => {
        e.preventDefault()
        navigateRight(to)
      }}
      {...props}
    >
      {children}
    </a>
  )
}
```

**DX:**
```tsx
// Внутри левой панели — навигация своей панели
<LinkLeft to="/dash/sub1">Sub1</LinkLeft>         // ✅ autocomplete от leftPanelTree

// Внутри левой панели — навигация ПРАВОЙ панели
<LinkRight to="/route1">Open in right</LinkRight> // ✅ autocomplete от rightPanelTree

// Ошибки типов:
<LinkLeft to="/nonexistent">Nope</LinkLeft>        // ❌ type error
<LinkRight to="/dash/sub1">Nope</LinkRight>        // ❌ type error — это левый путь

// Обычная навигация (выход из панельного режима):
<Link to="/home">Exit panels</Link>               // ✅ standard TanStack Link
```

### PanelShell с PanelContext

```tsx
function PanelShell() {
  const search = useSearch({ from: rootRoute.id })

  // Инициализация memory history из URL
  useEffect(() => {
    if (search.left) leftRouter.navigate({ to: search.left })
    if (search.right) rightRouter.navigate({ to: search.right })
  }, [])

  const navigators: PanelNavigators = useMemo(() => ({
    navigateLeft: (to) => {
      leftRouter.navigate({ to })
      // sync to URL
      mainRouter.navigate({
        search: (prev) => ({ ...prev, left: to }),
      })
    },
    navigateRight: (to) => {
      rightRouter.navigate({ to })
      mainRouter.navigate({
        search: (prev) => ({ ...prev, right: to }),
      })
    },
    navigateMain: (to) => {
      mainRouter.navigate({ to })
    },
  }), [])

  return (
    <PanelContext.Provider value={navigators}>
      <div className="flex h-screen">
        <div className="flex-1">
          <RouterProvider router={leftRouter} />
        </div>
        <div className="flex-1">
          <RouterProvider router={rightRouter} />
        </div>
      </div>
    </PanelContext.Provider>
  )
}
```

### URL-формат

```
Обычный режим:    /settings/billing
Панельный режим:  /?left=/dash/sub1&right=/route2
```

### Что работает (vs Path C)

| Feature | Path C (single router) | Path D (hybrid) |
|---------|:---:|:---:|
| Типизация `<LinkLeft to="...">` | ✅ | ✅ |
| Автокомплит путей | ✅ | ✅ |
| Кросс-панельная навигация | ✅ `<LinkRight>` | ✅ `<LinkRight>` через PanelContext |
| `<Outlet>` внутри панелей | ❌ **не работает** | ✅ работает |
| `useParams()` в панелях | ❌ нет match context | ✅ есть match context |
| `useLoaderData()` в панелях | ❌ нет match context | ✅ есть match context |
| Error boundaries в панелях | ❌ ручной | ✅ из коробки |
| Один роутер | ✅ | ❌ три роутера |
| Без синхронизации | ✅ | ❌ PanelSync нужен |
| Browser Back/Forward | ✅ одна history | ⚠️ нужна проверка |

### Минусы / Открытые вопросы

- **PanelContext должен быть доступен внутри панельных RouterProvider** —
  нужно проверить: `PanelContext.Provider` оборачивает `RouterProvider`,
  значит `usePanelNav()` внутри панельных компонентов должен работать.
  Но React Context проходит через `RouterProvider`?
  Ответ: **ДА** — `RouterProvider` не создаёт boundary для внешних контекстов.

- **Type Register**: глобальный `Register` может быть только один.
  Внутри левой панели `useParams()` типизирован по `leftRouter`,
  внутри правой — по `rightRouter`. Глобальный `useParams()` вне
  панелей типизирован по `mainRouter`. Каждый RouterProvider задаёт свой контекст.
  **Но** `Register` — compile-time, один на проект. Нужно использовать
  `leftRouter.useParams()` вместо глобального импорта?
  → **Требует проверки в POC.**

- **PanelSync**: `navigateLeft` и `navigateRight` вызывают навигацию
  в двух роутерах (panel + main). Нужно убедиться, что нет race condition
  при быстрых последовательных кликах.

- **Инициализация**: memory history создаётся с `initialEntries`,
  но URL может содержать другой путь. `useEffect` синхронизирует,
  но возможен flash of wrong content на первый рендер.
  → Решение: создавать memory history из URL params (lazy init).

---

## 5. Next Steps

- [ ] **POC Path D** — три роутера + PanelContext + типизированные LinkLeft/LinkRight
- [ ] **Validate Outlet** — `<Outlet>` внутри панельных layout-ов работает
- [ ] **Validate PanelContext** — `usePanelNav()` доступен внутри RouterProvider
- [ ] **Validate types** — `RoutePaths<typeof leftPanelTree>` даёт автокомплит
- [ ] **Validate Register** — как работает type registration с тремя роутерами
- [ ] **Validate init** — flash of content при инициализации memory history
- [ ] **Validate Back/Forward** — browser history при панельной навигации

---

## 6. Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-01-30 | Режимы взаимоисключающие (панели XOR основной) | Упрощает архитектуру, не нужно рендерить оба режима |
| 2025-01-30 | Переключение по наличию query params | `?left=` или `?right=` → панели, иначе → обычный роут |
| 2025-01-30 | Path A (единое дерево + Outlet) отклонён | Outlet не поддерживает два активных branch-а |
| 2025-01-30 | Path B (три роутера + memory + sync) исследован | Работает, но кросс-навигация только через хелпер без типизации |
| 2025-01-30 | Path C (единый роутер + StripPrefix) отклонён | Outlet не работает внутри панелей — убивает вложенность layout-ов |
| 2025-01-30 | Path D (гибрид B + C) выбран | Три роутера для Outlet + типизация из RoutePaths panel trees |
| 2025-01-30 | StripPrefix не нужен в Path D | Панельные деревья уже без префиксов — пути чистые |
| 2025-01-30 | PanelContext для кросс-навигации | `<LinkLeft>` / `<LinkRight>` типизированы и работают из любого компонента |

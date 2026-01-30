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

Не исследован полностью. Идея:
- Один роутер с browser history
- Вместо `<Outlet />` — кастомный рендеринг через `router.routesById`
- URL: `/?left=/dash/sub1&right=/route2`
- Root component вручную ресолвит два компонента по search params

Это по сути текущая архитектура (routeMap lookup), но вопрос — можно ли её улучшить, сохранив один роутер, но добавив типизацию через `routesById`?

---

## 5. Next Steps

- [ ] **Prototype Path B** — минимальный POC с тремя роутерами и PanelSync
- [ ] **Validate Q2** — проверить flash of content при инициализации
- [ ] **Validate Q3** — проверить browser Back/Forward behavior
- [ ] **Explore Q1** — типизация кросс-панельной навигации через дженерики
- [ ] **Explore Q6** — single router + manual rendering с лучшей типизацией
- [ ] **Benchmark** — замерить overhead от трёх роутеров vs. одного

---

## 6. Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-01-30 | Режимы взаимоисключающие (панели XOR основной) | Упрощает архитектуру, не нужно рендерить оба режима |
| 2025-01-30 | Переключение по наличию query params | `?left=` или `?right=` → панели, иначе → обычный роут |
| 2025-01-30 | Path A (единое дерево) отклонён | Outlet не поддерживает два активных branch-а |
| 2025-01-30 | Path B (три роутера + memory + sync) — кандидат | Даёт типобезопасность, масштабируемость, чистое разделение |

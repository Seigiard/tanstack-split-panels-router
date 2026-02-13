# Архитектура Panel System

Глубокое погружение в реализацию, паттерны проектирования и технические решения, стоящие за библиотекой panel system.

## Содержание

- [Паттерн двойного роутера](#паттерн-двойного-роутера)
- [Схема кодирования URL](#схема-кодирования-url)
- [Слоёная система контекстов](#слоёная-система-контекстов)
- [Ленивая инициализация роутеров](#ленивая-инициализация-роутеров)
- [Система типов](#система-типов)
- [Поток навигации](#поток-навигации)
- [Синхронизация URL](#синхронизация-url)
- [Обработка ошибок](#обработка-ошибок)

---

## Паттерн двойного роутера

### Обзор архитектуры

Система панелей запускает несколько экземпляров TanStack Router одновременно:

1. **Основной роутер** (Browser History)
   - Владеет URL и историей браузера
   - Управляет обычными маршрутами приложения (`/`, `/users` и т.д.)
   - Хранит состояние панелей в search-параметрах
   - Единственный источник истины для состояния URL

2. **Роутеры панелей** (Memory History)
   - Независимые экземпляры роутера для каждой панели
   - Каждый имеет собственное дерево маршрутов и состояние навигации
   - Используют in-memory history (не взаимодействуют с браузером)
   - Синхронизируются с основным роутером через search-параметры

### Почему этот паттерн?

**Проблема:** Модель одного роутера TanStack Router не поддерживает несколько независимых контекстов навигации в одном UI.

**Рассмотренные альтернативы:**

1. **Вложенные маршруты** — не обеспечивают независимые стеки истории
2. **Менеджер модальных окон** — теряется персистентность URL и возможность добавления в закладки
3. **Управление состоянием** — сложная синхронизация, нет вывода типов

**Решение:** Запускаем отдельные роутеры с memory history, синхронизируем через search-параметры основного роутера.

### Преимущества

- Каждая панель имеет независимый стек навигации
- Полная поддержка фичей TanStack Router для каждой панели (loaders, pending, search params)
- Сохраняемые в закладках/расшариваемые URL через кодирование search-параметров
- Типобезопасная навигация с полным выводом маршрутов
- Не требует модификации внутренностей TanStack Router

### Компромиссы

- Требуется логика синхронизации URL
- Для каждой панели нужно отдельное определение дерева маршрутов
- Memory-роутеры не вызывают «назад/вперёд» в браузере напрямую (обрабатывается через синхронизацию URL)
- Небольшие накладные расходы от нескольких экземпляров роутера

---

## Схема кодирования URL

### Структура search-параметров

Состояние панелей кодируется как search-параметры основного роутера:

```
/?left=/categories/phones&right=/posts/5?sort=desc
```

Разбивка:

```
Основной URL: /
Search-параметры:
  - left = /categories/phones
  - right = /posts/5?sort=desc
```

### Формат значения панели

Значение каждой панели объединяет pathname и search string:

```typescript
type PanelValue = string // Формат: "/path" или "/path?query=params"
```

Примеры:

- `/categories` — простой путь
- `/categories/phones` — путь с параметрами
- `/posts?sort=desc` — путь с search
- `/categories/phones?skip=10&limit=20` — и параметры, и search

### Логика разбора

```typescript
function parsePanelValue(value: string): {
  pathname: string
  searchString: string
} {
  const qIndex = value.indexOf('?')
  if (qIndex === -1) return { pathname: value, searchString: '' }
  return {
    pathname: value.substring(0, qIndex),
    searchString: value.substring(qIndex),
  }
}
```

**Ключевое решение:** Используем строковое кодирование вместо JSON, чтобы:

- URL оставались человекочитаемыми
- Поддерживать историю браузера (без проблем с экранированием)
- Упростить копирование и отладку
- Соответствовать паттернам URL TanStack Router

### Построение значений панелей

```typescript
function buildPanelValue(
  pathname: string,
  search?: Record<string, string>,
): string {
  if (!search || Object.keys(search).length === 0) return pathname

  // Фильтрация пустых строковых значений
  const filtered = Object.fromEntries(
    Object.entries(search).filter(([, v]) => v !== ''),
  )

  if (Object.keys(filtered).length === 0) return pathname

  const qs = new URLSearchParams(filtered).toString()
  return `${pathname}?${qs}`
}
```

**Зачем фильтровать пустые строки?**

- Чистые URL (без `?key=`)
- Консистентное поведение с TanStack Router
- Избежание багов с пустыми параметрами

---

## Слоёная система контекстов

Библиотека использует два вложенных контекста для разных целей:

### Слой 1: PanelSystemContext

Предоставляет общесистемное состояние и методы навигации.

```typescript
interface PanelSystemContextValue {
  panelNames: string[]
  mainRouter: ReturnType<typeof useRouter>
  getRouter: (name: string) => PanelRouter | null
  navigatePanel: (name: string, to: string, opts?: {...}) => void
  closePanel: (name: string) => void
  isPanelOpen: (name: string) => boolean
  navigateMain: (to: string) => void
}
```

**Область видимости:** Всё приложение (монтируется в корне)

**Потребители:**

- `usePanel()` — получение управления всеми панелями
- `Panel.Link` — вычисление href, обработка кликов
- `System.Link` — мультипанельная навигация
- `Panel.Outlet` — получение роутера панели

### Слой 2: PanelIdentityContext

Предоставляет идентификацию конкретной панели для компонентов внутри неё.

```typescript
interface PanelIdentity {
  name: string
  navigate: (to: string, opts?: {...}) => void
  close: () => void
}
```

**Область видимости:** Внутри каждого `<Panel.Outlet />` (для каждой панели)

**Потребители:**

- `useCurrentPanel()` — автоопределение текущей панели
- Хлебные крошки — навигация внутри текущей панели
- Универсальные панельные компоненты

### Диаграмма контекстов

```
<panels.Provider>                     ← PanelSystemContext
  <AppSidebar />                      ← Может использовать usePanel()
  <PanelLayout>
    <div>
      <leftPanel.Outlet>              ← Оборачивает в PanelIdentityContext (name='left')
        <CategoriesView>              ← Может использовать useCurrentPanel()
          <Breadcrumbs />             ← Может использовать useCurrentPanel()
        </CategoriesView>
      </leftPanel.Outlet>
    </div>
    <div>
      <rightPanel.Outlet>             ← Оборачивает в PanelIdentityContext (name='right')
        <PostDetailView>              ← Может использовать useCurrentPanel()
          <Breadcrumbs />             ← Тот же компонент, другая панель
        </PostDetailView>
      </rightPanel.Outlet>
    </div>
  </PanelLayout>
</panels.Provider>
```

### Зачем два контекста?

**Проблема:** Универсальным компонентам (например, хлебным крошкам) нужно знать, в какой панели они находятся, без пробрасывания пропсов через каждый уровень.

**Решение:**

1. `PanelSystemContext` — глобальное состояние панелей (всегда доступно)
2. `PanelIdentityContext` — идентификация конкретной панели (ограничена каждым Outlet)

Это позволяет:

- Использовать один компонент Breadcrumbs в левой и правой панелях
- Автоматически определять контекст текущей панели
- Обходиться без проброса пропсов через компоненты маршрутов

---

## Ленивая инициализация роутеров

### Проблема

Создание всех роутеров панелей сразу:

- Расходует память на неоткрытые панели
- Замедляет начальную загрузку приложения
- Инициализирует роутеры до того, как они понадобятся

### Решение

Роутеры создаются лениво через паттерн фабрики:

```typescript
function createPanelRouterFactory(
  routeTree: AnyRoute,
  pendingComponent?: RouteComponent,
): PanelRouterFactory {
  let instance: PanelRouter | null = null

  return (initialPath?: string) => {
    if (!instance) {
      instance = createRouter({
        routeTree,
        history: createMemoryHistory({
          initialEntries: [initialPath ?? '/'],
        }),
        ...(pendingComponent
          ? { defaultPendingComponent: pendingComponent }
          : {}),
      })
    }
    return instance
  }
}
```

**Ключевые моменты:**

1. **Паттерн Singleton** — `instance` захвачен в замыкании, при последующих вызовах возвращает тот же роутер
2. **Ленивое создание** — роутер создаётся только при первом вызове `getRouter()`
3. **Начальный путь** — роутер стартует со значения URL или `defaultPath`
4. **Без уничтожения** — после создания роутер живёт в течение сессии (панель может закрываться/открываться без потери состояния)

### Интеграция с Provider

```typescript
function PanelSystemProvider({ children }: { children: React.ReactNode }) {
  const search = useSearch({ strict: false }) as Record<
    string,
    string | undefined
  >

  const getRouter = useCallback(
    (name: string): PanelRouter | null => {
      const panel = panels[name]
      if (!panel) return null

      const panelValue = search[name]
      // Ленивая инициализация: роутер создаётся только при первом обращении
      return panel.getRouter(panelValue || panel.defaultPath)
    },
    [search],
  )

  // ...
}
```

**Поведение:**

- Первый вызов `getRouter('left')` создаёт левый роутер
- Последующие вызовы возвращают тот же экземпляр
- Роутер пересоздаётся при размонтировании/перемонтировании Provider (полная перезагрузка страницы)

### Управление памятью

**Панель закрыта:**

- Экземпляр роутера сохраняется в памяти
- Панель может быть переоткрыта с сохранённым состоянием навигации
- Пример: пользователь закрывает правую панель, навигирует в левой, переоткрывает правую → правая панель помнит последнее местоположение

**Перезагрузка страницы:**

- Все роутеры уничтожаются (очистка React context)
- Новые роутеры создаются из состояния URL
- Пример: пользователь добавляет в закладки `/?left=/categories/phones`, перезагружает → левый роутер пересоздаётся на `/categories/phones`

---

## Система типов

### Кастомное извлечение параметров пути

Тип `PathParams` от TanStack Router не работает с нашим фантомным типом роутера. Мы построили собственное извлечение:

```typescript
type ExtractPathParams<T extends string> =
  T extends `${string}$${infer Param}/${infer Rest}`
    ? Param | ExtractPathParams<`/${Rest}`>
    : T extends `${string}$${infer Param}`
      ? Param
      : never

type ParamsRecord<TPath extends string> =
  ExtractPathParams<TPath> extends never
    ? Record<string, never>
    : Record<ExtractPathParams<TPath>, string>
```

**Как это работает:**

1. **Рекурсивное сопоставление шаблонов** — извлекает все сегменты `$param` из пути
2. **Union-тип** — возвращает объединение всех имён параметров
3. **Построение Record** — преобразует объединение в `Record<paramName, string>`
4. **Fallback на never** — пути без параметров возвращают `Record<string, never>` (тип пустого объекта)

**Пример:**

```typescript
type T1 = ExtractPathParams<'/categories'>
// → never

type T2 = ExtractPathParams<'/categories/$category'>
// → 'category'

type T3 = ExtractPathParams<'/categories/$category/$productId'>
// → 'category' | 'productId'

type R3 = ParamsRecord<'/categories/$category/$productId'>
// → Record<'category' | 'productId', string>
// → { category: string; productId: string }
```

### Условный проп params

Типы Panel Link делают проп `params` обязательным только когда путь содержит параметры:

```typescript
export type PanelLinkProps<
  TTree extends AnyRoute,
  TTo extends RoutePaths<TTree>,
> = {
  to: TTo
  children?: React.ReactNode
  className?: string
  search?: Record<string, string>
} & (ExtractPathParams<TTo & string> extends never
  ? { params?: never }
  : { params: Record<ExtractPathParams<TTo & string>, string> })
```

**Поведение типов:**

```typescript
// Путь без параметров: params опционален (и его тип — `never`)
<leftPanel.Link to="/categories" params={undefined} />  // ✓
<leftPanel.Link to="/categories" />                     // ✓

// Путь с параметрами: params обязателен
<leftPanel.Link to="/categories/$category" />           // ✗ Ошибка
<leftPanel.Link
  to="/categories/$category"
  params={{ category: 'phones' }}                       // ✓
/>
```

### Вывод путей маршрутов

Мы используем утилитный тип `RoutePaths` от TanStack Router:

```typescript
import type { RoutePaths } from '@tanstack/router-core'

type LeftPanelPaths = RoutePaths<typeof leftPanelTree>
// → '/' | '/categories' | '/categories/$category' | '/categories/$category/$productId'
```

**Как это работает:**

1. Дерево маршрутов TanStack Router содержит полную информацию о типах
2. `RoutePaths<TTree>` извлекает все возможные пути как объединение строковых литералов
3. Мы ограничиваем проп `to` этим union-типом
4. TypeScript автодополняет допустимые пути

**Проблема:** У нас нет реального экземпляра `Router` (роутеры создаются лениво), поэтому мы не можем использовать `PathParams<Router, Path>`.

**Решение:** Кастомный `ExtractPathParams`, работающий напрямую со строками путей.

### Фантомный тип роутера (не используется)

Изначальный план предполагал создание фантомного типа роутера:

```typescript
type PanelRouterType<TTree extends AnyRoute> = RouterCore<
  TTree,
  'never',
  false,
  RouterHistory,
  Record<string, any>
>
```

**Почему от него отказались:**

- Внутренние типы TanStack Router менялись между версиями
- `RouterCore` не предоставляет утилиты путей стабильным образом
- Кастомное извлечение путей оказалось надёжнее и не зависит от версии

**Текущий подход:**

- Используем `RoutePaths<TTree>` для перечисления путей (стабильный API)
- Используем кастомный `ExtractPathParams<TPath>` для извлечения параметров
- Не зависим от фантомного типа роутера

### Типы мультипанельного Link

System Link использует mapped types для поддержки динамических имён панелей:

```typescript
type SystemLinkProps<TPanels extends PanelMap> = {
  [K in keyof TPanels]?: PanelLinkTarget<TPanels[K]['tree']>
} & { children?: React.ReactNode; className?: string }

type PanelLinkTarget<TTree extends AnyRoute> =
  | RoutePaths<TTree>                                        // Строковое сокращение
  | { to: RoutePaths<TTree>; params?: ...; search?: ... }    // Объект с параметрами
  | false                                                     // Закрыть панель
```

**Пример:**

```typescript
// Для panels = { left: leftPanel, right: rightPanel }
type MySystemLinkProps = {
  left?: RoutePaths<LeftTree> | { to: ..., params?: ..., search?: ... } | false
  right?: RoutePaths<RightTree> | { to: ..., params?: ..., search?: ... } | false
  children?: React.ReactNode
  className?: string
}
```

**Типобезопасность:**

- Каждый проп панели имеет собственный вывод дерева маршрутов
- Пути левой панели не автодополняются для правой (и наоборот)
- TypeScript валидирует параметры на основе шаблона пути

---

## Поток навигации

### Клик по Panel.Link

```
1. Пользователь кликает <leftPanel.Link to="/categories/$cat" params={{ cat: 'phones' }} />

2. Компонент Link:
   ├─> resolvePath('/categories/$cat', { cat: 'phones' })
   │   └─> Возвращает: '/categories/phones'
   │
   ├─> buildPanelValue('/categories/phones', search)
   │   └─> Возвращает: '/categories/phones' (или с ?query, если указан search)
   │
   └─> Проверка modifier-клавиш (ctrl/cmd/shift)
       ├─> Есть модификатор: разрешить дефолтное поведение браузера (новая вкладка)
       └─> Без модификатора:
           ├─> preventDefault()
           └─> navigatePanel('left', '/categories/phones')

3. navigatePanel():
   ├─> getRouter('left')
   │   └─> Возвращает роутер панели (создаёт при первом обращении)
   │
   ├─> panelNavigate(router, '/categories/phones')
   │   ├─> Разбор значения панели: { pathname, searchString }
   │   └─> Вызов router.navigate({ to: pathname, search: searchParams })
   │
   └─> Обновление search-параметров основного роутера:
       navigate({
         to: '/',
         search: {
           left: '/categories/phones',  // Обновлено
           right: search.right,          // Сохранено
         }
       })

4. URL становится: /?left=/categories/phones&right=...

5. Роутер панели навигирует мгновенно (memory history)

6. Компонент панели перерендеривается с новым маршрутом
```

### Клик по System.Link

```
1. Пользователь кликает <panels.Link left="/categories" right={false} />

2. Компонент Link вычисляет href:
   ├─> Для каждого пропса панели (left, right):
   │   ├─> undefined: сохранить текущее значение
   │   ├─> false: установить в undefined (закрыть)
   │   └─> string | object: разрешить и установить
   │
   └─> mainRouter.buildLocation({ to: '/', search: { left: '/categories', right: undefined } })

3. При клике (без модификаторов):
   ├─> preventDefault()
   └─> Для каждой указанной панели:
       ├─> left='/categories': navigatePanel('left', '/categories')
       └─> right=false: closePanel('right')

4. navigatePanel('left', '/categories'):
   ├─> Роутер панели навигирует
   └─> Search основного роутера обновлён: { left: '/categories', right: undefined }

5. closePanel('right'):
   └─> Search основного роутера обновлён: { left: '/categories', right: undefined }

6. URL становится: /?left=/categories
```

### Программная навигация

```
1. Компонент вызывает: panels.usePanel().left.navigate('/categories/phones')

2. usePanel() возвращает:
   {
     left: {
       navigate: (to, opts) => navigatePanel('left', to, opts),
       close: () => closePanel('left'),
       isOpen: search.left !== undefined,
     },
     // ...
   }

3. navigatePanel('left', '/categories/phones') выполняется (аналогично потоку Link)

4. Оба роутера обновляются: панельный и основной

5. URL и UI панели отражают новое состояние
```

---

## Синхронизация URL

### Эффект синхронизации в Provider

Provider синхронизирует URL → роутеры панелей через `useLayoutEffect`:

```typescript
function PanelSystemProvider({ children }: { children: React.ReactNode }) {
  const search = useSearch({ strict: false }) as Record<
    string,
    string | undefined
  >
  const prevRefs = useRef<Record<string, string | undefined>>({})

  useLayoutEffect(() => {
    for (const name of panelNames) {
      const current = search[name]
      const prev = prevRefs.current[name]

      // Синхронизация только при реальном изменении значения
      if (current && current !== prev) {
        const router = getRouter(name)
        if (router) panelNavigate(router, current)
      }

      prevRefs.current[name] = current
    }
  }, [search, getRouter])
}
```

**Ключевые моменты:**

1. **useLayoutEffect** — выполняется синхронно до отрисовки браузером (предотвращает мелькание старого контента)
2. **Обнаружение изменений через Ref** — синхронизация только при реальном изменении URL (избегает бесконечных циклов)
3. **Двунаправленная синхронизация** — работает в обе стороны:
   - Клик по ссылке → обновляет роутер панели + URL
   - Кнопка «назад/вперёд» в браузере → URL меняется → синхронизируется с роутером панели

### Сценарии синхронизации

**Сценарий 1: Клик по ссылке панели**

```
1. Пользователь кликает <leftPanel.Link to="/categories" />
2. navigatePanel() обновляет роутер панели + URL одновременно
3. useLayoutEffect видит изменение search-параметра
4. Но роутер панели уже на /categories (идемпотентно)
5. Дополнительная навигация не нужна
```

**Сценарий 2: Кнопка «назад» в браузере**

```
1. Пользователь на: /?left=/categories/phones
2. Пользователь нажимает «назад» в браузере
3. URL становится: /?left=/categories
4. useLayoutEffect обнаруживает изменение search.left
5. Синхронизирует роутер панели: panelNavigate(router, '/categories')
6. UI панели обновляется в соответствии с URL
```

**Сценарий 3: Прямой ввод URL**

```
1. Пользователь вводит в адресной строке: /?left=/categories/phones&right=/posts/5
2. Страница загружается
3. Provider монтируется, читает search-параметры
4. getRouter() лениво создаёт роутеры на начальных путях
5. Синхронизация не нужна (роутеры уже на правильных путях)
```

**Сценарий 4: Закладка/Расшаривание**

```
1. Пользователь делится ссылкой: /?left=/categories/phones?skip=10&right=/posts/5
2. Получатель открывает URL
3. Provider создаёт роутеры:
   - Левый: /categories/phones с search { skip: '10' }
   - Правый: /posts/5
4. Обе панели рендерятся в сохранённом состоянии
```

### Почему useLayoutEffect?

**Проблема с useEffect:**

```
1. URL меняется на /?left=/categories
2. Компонент рендерится с новыми search-параметрами
3. Outlet панели рендерится (но роутер ещё на старом пути)
4. Мелькание старого контента
5. useEffect выполняется, синхронизирует роутер
6. Панель перерендеривается с правильным контентом
```

**Решение с useLayoutEffect:**

```
1. URL меняется на /?left=/categories
2. useLayoutEffect выполняется (до отрисовки)
3. Синхронизирует роутер панели на /categories
4. Компонент рендерится с корректным состоянием
5. Без мелькания (браузер отрисовывает один раз с правильным контентом)
```

### Обнаружение изменений

```typescript
const prevRefs = useRef<Record<string, string | undefined>>({})

useLayoutEffect(() => {
  for (const name of panelNames) {
    const current = search[name]
    const prev = prevRefs.current[name]

    if (current && current !== prev) {
      // Логика синхронизации
    }

    prevRefs.current[name] = current
  }
}, [search, getRouter])
```

**Почему Ref?**

- React state вызвал бы дополнительные ре-рендеры
- Предыдущие значения нужны для сравнения
- Ref обеспечивает мутабельное хранилище без вызова рендеров

**Почему проверка `current !== prev`?**

- Избежание избыточных вызовов навигации
- Предотвращение бесконечных циклов (navigate → изменение URL → sync → navigate → ...)
- Синхронизация только при реальном изменении URL

---

## Обработка ошибок

### Ошибки отсутствующего контекста

Все хуки выбрасывают описательные ошибки при использовании вне требуемого контекста:

```typescript
export function useCurrentPanel(): PanelIdentity {
  const ctx = useContext(PanelIdentityContext)
  if (!ctx) {
    throw new Error('useCurrentPanel must be used inside a panel Outlet')
  }
  return ctx
}
```

**Когда срабатывает:**

```tsx
// ✗ Ошибка: не внутри Outlet панели
function SomeComponent() {
  const current = panels.useCurrentPanel() // Выбрасывает исключение!
  return <div>...</div>
}

// ✓ Правильно: внутри Outlet панели
;<leftPanel.Outlet>
  <SomeComponent /> {/* Может вызывать useCurrentPanel() */}
</leftPanel.Outlet>
```

### Отсутствующие параметры пути

`resolvePath()` выбрасывает исключение при отсутствии обязательных параметров:

```typescript
export function resolvePath(
  to: string,
  params?: Record<string, string>,
): string {
  if (!params) return to

  return to.replace(/\$([^/]+)/g, (_, key: string) => {
    const value = params[key]
    if (value === undefined) {
      throw new Error(
        `Missing param "${key}" for path "${to}". Got params: ${JSON.stringify(params)}`,
      )
    }
    return encodeURIComponent(value)
  })
}
```

**Пример:**

```typescript
resolvePath('/categories/$category', {})
// → Error: Missing param "category" for path "/categories/$category". Got params: {}

resolvePath('/categories/$category/$productId', { category: 'phones' })
// → Error: Missing param "productId" for path "/categories/$category/$productId".
//           Got params: {"category":"phones"}
```

**Почему выбрасываем исключение вместо тихого fallback?**

- Быстрый отказ во время разработки
- Чёткие сообщения об ошибках облегчают отладку
- TypeScript предотвращает это на этапе компиляции (ошибки возникают в рантайме, только если типы обойдены)

### Graceful degradation

Компоненты панелей корректно обрабатывают отсутствие контекста:

```typescript
function Outlet(): React.ReactElement | null {
  const ctx = useContext(PanelSystemContext)
  if (!ctx) return null  // Тихо: не рендерим, если Provider отсутствует

  const router = ctx.getRouter(name)
  if (!router) return null  // Тихо: не рендерим, если панель не инициализирована

  return (
    <PanelIdentityContext.Provider value={{...}}>
      <RouterProvider router={router} />
    </PanelIdentityContext.Provider>
  )
}
```

**Проектное решение:**

- Навигационные хуки выбрасывают исключения (ошибка разработчика, нужно исправить)
- Компоненты рендеринга возвращают `null` (graceful degradation)

### Ошибки роутера

Роутеры панелей наследуют обработку ошибок TanStack Router:

- `errorComponent` для каждого маршрута
- Error boundaries перехватывают ошибки маршрутов
- Система панелей не перехватывает ошибки роутера

**Пример:**

```typescript
const categoriesRoute = createRoute({
  getParentRoute: () => leftRoot,
  path: '/categories',
  loader: async () => {
    const data = await fetchCategories()
    if (!data) throw new Error('Failed to load categories')
    return data
  },
  errorComponent: ({ error }) => (
    <div>Ошибка: {error.message}</div>
  ),
})
```

Ошибки в loaders, компонентах или хуках beforeLoad обрабатываются системой error boundary TanStack Router.

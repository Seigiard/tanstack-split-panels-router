# Справочник по API Panel System

Полная документация всех экспортируемых функций, типов, компонентов и хуков.

## Содержание

- [Фабрики](#фабрики)
  - [createPanel](#createpanel)
  - [createPanelSystem](#createpanelsystem)
- [Компоненты](#компоненты)
  - [Provider](#provider)
  - [Panel.Outlet](#paneloutlet)
  - [Panel.Link](#panellink)
  - [System.Link](#systemlink)
  - [System.MainLink](#systemmainlink)
- [Хуки](#хуки)
  - [usePanel](#usepanel)
  - [useCurrentPanel](#usecurrentpanel)
  - [Panel.useNav](#panelusenav)
- [Утилиты](#утилиты)
  - [validateSearch](#validatesearch)
  - [parsePanelValue](#parsepanelvalue)
  - [buildPanelValue](#buildpanelvalue)
  - [resolvePath](#resolvepath)
- [Типы](#типы)
  - [PanelConfig](#panelconfig)
  - [PanelInstance](#panelinstance)
  - [PanelSystem](#panelsystem)
  - [PanelControl](#panelcontrol)
  - [PanelIdentity](#panelidentity)
  - [UsePanelReturn](#usepanelreturn)

---

## Фабрики

### createPanel

Создаёт экземпляр панели с собственным деревом маршрутов, навигационными компонентами и хуками.

```tsx
function createPanel<TTree extends AnyRoute>(
  config: PanelConfig<TTree> & { pendingComponent?: RouteComponent },
): PanelInstance<TTree>
```

**Параметры:**

| Имя                       | Тип                            | Описание                                                                 |
| ------------------------- | ------------------------------ | ------------------------------------------------------------------------ |
| `config.name`             | `string`                       | Уникальный идентификатор панели (используется как ключ search-параметра) |
| `config.tree`             | `TTree extends AnyRoute`       | Дерево маршрутов TanStack Router для этой панели                         |
| `config.defaultPath`      | `RoutePaths<TTree>`            | Начальный путь при открытии панели (также при отсутствии значения в URL) |
| `config.pendingComponent` | `RouteComponent` (опционально) | Компонент загрузки, отображаемый при переходах между маршрутами          |

**Возвращает:**

`PanelInstance<TTree>` с полями:

- `Outlet: React.ComponentType` — рендерит RouterProvider панели
- `Link: PanelLinkComponent<TTree>` — типобезопасный компонент Link для этой панели
- `useNav: () => PanelNavReturn` — навигационный хук для этой панели
- `name: string` — идентификатор панели
- `tree: TTree` — ссылка на дерево маршрутов
- `defaultPath: string` — путь по умолчанию
- `getRouter: PanelRouterFactory` — фабрика роутера (ленивая инициализация)

**Пример:**

```tsx
import { createPanel } from '@/lib/panel-system'
import { leftPanelTree } from './tree'

export const leftPanel = createPanel({
  name: 'left',
  tree: leftPanelTree,
  defaultPath: '/categories',
  pendingComponent: LoadingSpinner,
})

// Использование возвращённых компонентов
<leftPanel.Outlet />
<leftPanel.Link to="/categories" />
```

---

### createPanelSystem

Объединяет несколько панелей в координированную систему с кросс-панельной навигацией.

```tsx
function createPanelSystem<TPanels extends PanelMap>(
  options: PanelSystemOptions<TPanels>,
): PanelSystem<TPanels>
```

**Параметры:**

| Имя                  | Тип                                                                                   | Описание                                                      |
| -------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `options.panels`     | `TPanels extends PanelMap`                                                            | Запись экземпляров панелей (имя → PanelInstance)              |
| `options.onNavigate` | `(panel: string, action: 'navigate' \| 'close', path?: string) => void` (опционально) | Колбэк при навигации/закрытии панели (удобно для логирования) |

**Возвращает:**

`PanelSystem<TPanels>` с полями:

- `Provider: React.ComponentType<{ children: React.ReactNode }>` — провайдер системы
- `Link: React.ComponentType<SystemLinkProps<TPanels>>` — мультипанельный Link
- `MainLink: React.ComponentType<{ to: string, ... }>` — Link, очищающий все панели
- `usePanel: () => UsePanelReturn<TPanels>` — хук для управления панелями
- `useCurrentPanel: () => PanelIdentity` — хук для идентификации текущей панели
- `validateSearch: (search: Record<string, unknown>) => Record<string, string | undefined>` — валидатор search-параметров

**Пример:**

```tsx
import { createPanelSystem } from '@/lib/panel-system'
import { leftPanel } from '@/routes/left-panel'
import { rightPanel } from '@/routes/right-panel'

export const panels = createPanelSystem({
  panels: { left: leftPanel, right: rightPanel },
  onNavigate: (panel, action, path) => {
    console.log(`[${panel}] ${action}`, path)
  },
})
```

---

## Компоненты

### Provider

Context-провайдер, управляющий синхронизацией состояния панелей и кодированием URL.

```tsx
<panels.Provider>{children}</panels.Provider>
```

**Пропсы:**

| Имя        | Тип               | Описание              |
| ---------- | ----------------- | --------------------- |
| `children` | `React.ReactNode` | Содержимое приложения |

**Поведение:**

- Читает search-параметры из основного роутера через `useSearch()`
- Создаёт/получает роутеры панелей лениво (только при необходимости)
- Синхронизирует изменения URL с роутерами панелей через `useLayoutEffect`
- Предоставляет `PanelSystemContext` для всех хуков и компонентов
- Должен оборачивать всё приложение (всегда смонтирован, не рендерится условно)

**Пример:**

```tsx
function RootLayout() {
  return (
    <panels.Provider>
      <AppSidebar />
      <MainContent />
    </panels.Provider>
  )
}
```

---

### Panel.Outlet

Рендерит RouterProvider панели, обёрнутый в контекст идентификации.

```tsx
<leftPanel.Outlet />
```

**Поведение:**

- Получает роутер панели из `PanelSystemContext`
- Оборачивает `RouterProvider` в `PanelIdentityContext` (позволяет использовать `useCurrentPanel()`)
- Возвращает `null`, если контекст недоступен или панель не открыта
- Каждый экземпляр панели имеет собственный Outlet

**Пример:**

```tsx
function PanelLayout() {
  const { left, right } = panels.usePanel()

  return (
    <div className='flex'>
      {left.isOpen && (
        <div className='panel'>
          <leftPanel.Outlet />
        </div>
      )}
      {right.isOpen && (
        <div className='panel'>
          <rightPanel.Outlet />
        </div>
      )}
    </div>
  )
}
```

---

### Panel.Link

Типобезопасный компонент ссылки для навигации внутри конкретной панели. Рендерит кастомный тег `<a>` (не TanStack Link) с вычислением href и обработкой кликов.

```tsx
<leftPanel.Link
  to='/categories/$category'
  params={{ category: 'phones' }}
  search={{ skip: '10' }}
  className='link'
>
  Смотреть телефоны
</leftPanel.Link>
```

**Пропсы:**

| Имя         | Тип                                    | Описание                                                           |
| ----------- | -------------------------------------- | ------------------------------------------------------------------ |
| `to`        | `RoutePaths<TTree>`                    | Путь маршрута (должен существовать в дереве маршрутов панели)      |
| `params`    | `Record<string, string>`               | Параметры пути (обязательны, если путь содержит сегменты `$param`) |
| `search`    | `Record<string, string>` (опционально) | Query-параметры для панели                                         |
| `className` | `string` (опционально)                 | CSS-класс                                                          |
| `children`  | `React.ReactNode` (опционально)        | Содержимое ссылки                                                  |

**Типобезопасность:**

TypeScript обеспечивает:

- `to` должен быть допустимым путём из дерева маршрутов панели
- `params` обязателен, если путь содержит динамические сегменты
- Ключи `params` должны совпадать с именами параметров в пути

**Поведение:**

- Вычисляет `href` через `mainRouter.buildLocation()` (поддержка modifier-клавиш)
- Разрешает параметры пути: `/categories/$cat` + `{ cat: 'phones' }` → `/categories/phones`
- Кодирует значение панели в search-параметрах основного роутера
- При клике (без модификаторов): предотвращает дефолтное действие, вызывает `navigatePanel()`
- При клике с модификатором (ctrl/cmd): позволяет дефолтное поведение браузера (новая вкладка/окно)

**Пример:**

```tsx
// Статический путь
<leftPanel.Link to="/categories">Категории</leftPanel.Link>

// Динамический путь с параметрами
<leftPanel.Link
  to="/categories/$category"
  params={{ category: 'phones' }}
>
  Телефоны
</leftPanel.Link>

// С search-параметрами
<leftPanel.Link
  to="/categories/$category"
  params={{ category: 'phones' }}
  search={{ skip: '10', limit: '20' }}
>
  Телефоны (страница 2)
</leftPanel.Link>
```

---

### System.Link

Мультипанельная ссылка, позволяющая навигировать несколько панелей одновременно.

```tsx
<panels.Link
  left='/categories'
  right={{ to: '/posts/$id', params: { id: '5' } }}
  className='link'
>
  Открыть категорию и пост
</panels.Link>
```

**Пропсы:**

Динамические пропсы на основе имён панелей, плюс:

| Имя           | Тип                                                         | Описание                         |
| ------------- | ----------------------------------------------------------- | -------------------------------- |
| `[panelName]` | `string \| { to, params?, search? } \| false` (опционально) | Цель навигации для каждой панели |
| `className`   | `string` (опционально)                                      | CSS-класс                        |
| `children`    | `React.ReactNode` (опционально)                             | Содержимое ссылки                |

**Типы целей панелей:**

- `string` — путь без параметров (например, `left="/categories"`)
- `{ to, params?, search? }` — путь с параметрами и/или search (например, `right={{ to: '/posts/$id', params: { id: '5' } }}`)
- `false` — закрыть панель (например, `right={false}`)
- `undefined` — без изменений состояния панели (пропс не указан)

**Поведение:**

- Вычисляет комбинированный href со всеми состояниями панелей
- При клике: обновляет каждую указанную панель
- Сохраняет состояние неуказанных панелей
- Поддерживает modifier-клавиши (ctrl+клик для новой вкладки)

**Пример:**

```tsx
// Открыть левую панель, закрыть правую
<panels.Link left="/categories" right={false}>
  Только категории
</panels.Link>

// Навигация обеих панелей
<panels.Link
  left={{ to: '/categories/$cat', params: { cat: 'phones' } }}
  right={{ to: '/posts/$id', params: { id: '5' } }}
>
  Телефоны и пост
</panels.Link>

// Оставить левую панель без изменений, открыть правую
<panels.Link right="/posts">
  Смотреть посты
</panels.Link>
```

---

### System.MainLink

Компонент ссылки, который очищает все панели и навигирует основной роутер.

```tsx
<panels.MainLink to='/users' className='link'>
  Пользователи (обычный режим)
</panels.MainLink>
```

**Пропсы:**

| Имя         | Тип                             | Описание               |
| ----------- | ------------------------------- | ---------------------- |
| `to`        | `string`                        | Путь основного роутера |
| `className` | `string` (опционально)          | CSS-класс              |
| `children`  | `React.ReactNode` (опционально) | Содержимое ссылки      |

**Поведение:**

- Использует компонент TanStack `Link` внутри
- Устанавливает все search-параметры панелей в `undefined`
- Навигирует по пути `to` в основном роутере
- Выходит из режима панелей (если был в нём)

**Пример:**

```tsx
// Выйти из режима панелей и перейти на главную
<panels.MainLink to="/">Главная</panels.MainLink>

// Выйти из режима панелей и перейти к пользователям
<panels.MainLink to="/users">Пользователи</panels.MainLink>
```

---

## Хуки

### usePanel

Возвращает элементы управления навигацией для всех панелей и глобальное состояние.

```tsx
const { left, right, isPanelMode, navigateMain } = panels.usePanel()
```

**Возвращает:**

`UsePanelReturn<TPanels>` с полями:

| Свойство       | Тип                    | Описание                                            |
| -------------- | ---------------------- | --------------------------------------------------- |
| `[panelName]`  | `PanelControl`         | Управление каждой панелью (navigate, close, isOpen) |
| `isPanelMode`  | `boolean`              | `true`, если хотя бы одна панель открыта            |
| `navigateMain` | `(to: string) => void` | Навигация основного роутера с очисткой всех панелей |

**Свойства PanelControl:**

| Свойство   | Тип                                                                | Описание                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| `navigate` | `(to: string, opts?: { search?: Record<string, string> }) => void` | Навигация внутри панели (открывает, если закрыта)      |
| `close`    | `() => void`                                                       | Закрыть панель и удалить из URL                        |
| `isOpen`   | `boolean`                                                          | `true`, если панель имеет значение в search-параметрах |

**Пример:**

```tsx
function PanelControls() {
  const { left, right, isPanelMode, navigateMain } = panels.usePanel()

  return (
    <div>
      <button onClick={() => left.navigate('/categories')}>
        Открыть левую панель
      </button>

      <button
        onClick={() => right.navigate('/posts', { search: { page: '1' } })}
      >
        Открыть правую панель (стр. 1)
      </button>

      <button onClick={right.close} disabled={!right.isOpen}>
        Закрыть правую панель
      </button>

      <button onClick={() => navigateMain('/users')} disabled={!isPanelMode}>
        Выйти из режима панелей
      </button>

      <p>Режим панелей: {isPanelMode ? 'Да' : 'Нет'}</p>
    </div>
  )
}
```

---

### useCurrentPanel

Возвращает идентификацию и методы навигации текущей панели. Должен вызываться внутри компонента панели (ниже `<Panel.Outlet />`).

```tsx
const current = panels.useCurrentPanel()
```

**Возвращает:**

`PanelIdentity` с полями:

| Свойство   | Тип                                                                | Описание                                         |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------ |
| `name`     | `string`                                                           | Идентификатор панели (например, 'left', 'right') |
| `navigate` | `(to: string, opts?: { search?: Record<string, string> }) => void` | Навигация внутри этой панели                     |
| `close`    | `() => void`                                                       | Закрыть эту панель                               |

**Выбрасывает:**

Ошибку при вызове вне панели (не внутри `PanelIdentityContext`)

**Сценарии использования:**

- Универсальные панельные компоненты, работающие в любой панели
- Хлебные крошки, автоматически определяющие текущую панель
- Панель-зависимые элементы управления навигацией

**Пример:**

```tsx
// В компоненте хлебных крошек, рендерящемся внутри левой или правой панели
function Breadcrumbs() {
  const current = panels.useCurrentPanel()
  const matches = useMatches()

  return (
    <nav>
      {matches.map((match, i) => (
        <a
          key={match.id}
          onClick={(e) => {
            e.preventDefault()
            current.navigate(match.pathname)
          }}
        >
          {match.staticData.breadcrumb}
        </a>
      ))}
    </nav>
  )
}
```

---

### Panel.useNav

Возвращает элементы управления навигацией для конкретной панели. Удобный хук, привязанный к панели.

```tsx
const { navigate, close, isOpen } = leftPanel.useNav()
```

**Возвращает:**

`PanelNavReturn` с полями:

| Свойство   | Тип                                                                | Описание                     |
| ---------- | ------------------------------------------------------------------ | ---------------------------- |
| `navigate` | `(to: string, opts?: { search?: Record<string, string> }) => void` | Навигация внутри этой панели |
| `close`    | `() => void`                                                       | Закрыть эту панель           |
| `isOpen`   | `boolean`                                                          | `true`, если панель открыта  |

**Выбрасывает:**

Ошибку при вызове вне `panels.Provider`

**Пример:**

```tsx
import { leftPanel } from '@/routes/left-panel'

function CategorySidebar() {
  const { navigate, close, isOpen } = leftPanel.useNav()

  return (
    <div>
      <button onClick={() => navigate('/categories/phones')}>
        Смотреть телефоны
      </button>
      <button onClick={close} disabled={!isOpen}>
        Закрыть панель
      </button>
    </div>
  )
}
```

---

## Утилиты

### validateSearch

Извлекает панельные search-параметры из объекта search TanStack Router.

```tsx
const panelParams = panels.validateSearch(search)
```

**Параметры:**

| Имя      | Тип                       | Описание                                    |
| -------- | ------------------------- | ------------------------------------------- |
| `search` | `Record<string, unknown>` | Объект search-параметров из TanStack Router |

**Возвращает:**

`Record<string, string | undefined>` — объект с именами панелей как ключами, значениями панелей как значениями

**Поведение:**

- Возвращает только ключи, специфичные для панелей (например, `{ left: string, right: string }`)
- Потребитель объединяет со своими search-параметрами
- Используется в функции `validateSearch` корневого маршрута

**Пример:**

```tsx
import { panels } from '@/lib/panels'

export const rootRoute = createRootRoute({
  validateSearch: (search: Record<string, unknown>) => {
    const panelParams = panels.validateSearch(search)

    // Объединить с собственными search-параметрами
    return {
      ...panelParams,
      theme: search.theme === 'dark' ? 'dark' : 'light',
    }
  },
})
```

---

### parsePanelValue

Разбирает строку значения панели на компоненты pathname и search string.

```tsx
const { pathname, searchString } = parsePanelValue(panelValue)
```

**Параметры:**

| Имя          | Тип      | Описание                                                 |
| ------------ | -------- | -------------------------------------------------------- |
| `panelValue` | `string` | Значение панели из URL (например, `/categories?skip=10`) |

**Возвращает:**

```typescript
{
  pathname: string // например, '/categories'
  searchString: string // например, '?skip=10' или ''
}
```

**Пример:**

```tsx
parsePanelValue('/categories')
// → { pathname: '/categories', searchString: '' }

parsePanelValue('/categories?skip=10&limit=5')
// → { pathname: '/categories', searchString: '?skip=10&limit=5' }

parsePanelValue('/')
// → { pathname: '/', searchString: '' }
```

---

### buildPanelValue

Собирает строку значения панели из pathname и search-параметров.

```tsx
const panelValue = buildPanelValue(pathname, search)
```

**Параметры:**

| Имя        | Тип                                    | Описание                                |
| ---------- | -------------------------------------- | --------------------------------------- |
| `pathname` | `string`                               | Путь маршрута (например, `/categories`) |
| `search`   | `Record<string, string>` (опционально) | Query-параметры                         |

**Возвращает:**

`string` — значение панели (например, `/categories?skip=10`)

**Поведение:**

- Отфильтровывает пустые строковые значения из search-параметров
- Возвращает только pathname, если search-параметров нет
- Кодирует search-параметры как query string

**Пример:**

```tsx
buildPanelValue('/categories')
// → '/categories'

buildPanelValue('/categories', { skip: '10', limit: '5' })
// → '/categories?skip=10&limit=5'

buildPanelValue('/categories', {})
// → '/categories'

buildPanelValue('/categories', { skip: '10', limit: '' })
// → '/categories?skip=10' (пустая строка отфильтрована)
```

---

### resolvePath

Разрешает параметры пути в шаблоне пути TanStack Router.

```tsx
const resolvedPath = resolvePath(to, params)
```

**Параметры:**

| Имя      | Тип                                    | Описание                          |
| -------- | -------------------------------------- | --------------------------------- |
| `to`     | `string`                               | Шаблон пути с сегментами `$param` |
| `params` | `Record<string, string>` (опционально) | Значения параметров               |

**Возвращает:**

`string` — разрешённый путь с подставленными параметрами

**Выбрасывает:**

Ошибку, если обязательный параметр отсутствует

**Поведение:**

- Заменяет `$paramName` соответствующим значением из params
- URL-кодирует значения параметров
- Поддерживает несколько параметров в одном пути
- Выбрасывает описательную ошибку при отсутствии параметра

**Пример:**

```tsx
resolvePath('/categories')
// → '/categories'

resolvePath('/categories/$category', { category: 'phones' })
// → '/categories/phones'

resolvePath('/categories/$category/$productId', {
  category: 'phones',
  productId: '42',
})
// → '/categories/phones/42'

resolvePath('/categories/$category', { category: 'a b' })
// → '/categories/a%20b'

resolvePath('/categories/$category', {})
// → Error: Missing param "category" for path "/categories/$category"
```

---

## Типы

### PanelConfig

Объект конфигурации для создания панели.

```typescript
interface PanelConfig<TTree extends AnyRoute = AnyRoute> {
  name: string
  tree: TTree
  defaultPath: RoutePaths<TTree> | (string & {})
}
```

**Свойства:**

| Свойство      | Тип                      | Описание                                                |
| ------------- | ------------------------ | ------------------------------------------------------- |
| `name`        | `string`                 | Уникальный идентификатор панели (ключ search-параметра) |
| `tree`        | `TTree extends AnyRoute` | Дерево маршрутов TanStack Router                        |
| `defaultPath` | `RoutePaths<TTree>`      | Начальный путь при открытии панели                      |

---

### PanelInstance

Объект, возвращаемый `createPanel()`.

```typescript
interface PanelInstance<TTree extends AnyRoute = AnyRoute> {
  name: string
  tree: TTree
  defaultPath: string
  getRouter: PanelRouterFactory
  Outlet: React.ComponentType
  Link: PanelLinkComponent<TTree>
  useNav: () => PanelNavReturn
}
```

**Свойства:**

| Свойство      | Тип                         | Описание                   |
| ------------- | --------------------------- | -------------------------- |
| `name`        | `string`                    | Идентификатор панели       |
| `tree`        | `TTree`                     | Ссылка на дерево маршрутов |
| `defaultPath` | `string`                    | Путь по умолчанию          |
| `getRouter`   | `PanelRouterFactory`        | Фабрика ленивого роутера   |
| `Outlet`      | `React.ComponentType`       | Компонент вывода панели    |
| `Link`        | `PanelLinkComponent<TTree>` | Типобезопасный Link        |
| `useNav`      | `() => PanelNavReturn`      | Навигационный хук          |

---

### PanelSystem

Объект, возвращаемый `createPanelSystem()`.

```typescript
interface PanelSystem<TPanels extends PanelMap> {
  Provider: React.ComponentType<{ children: React.ReactNode }>
  Link: React.ComponentType<SystemLinkProps<TPanels>>
  MainLink: React.ComponentType<{
    to: string
    children?: React.ReactNode
    className?: string
  }>
  usePanel: () => UsePanelReturn<TPanels>
  useCurrentPanel: () => PanelIdentity
  validateSearch: (
    search: Record<string, unknown>,
  ) => Record<string, string | undefined>
}
```

**Свойства:**

| Свойство          | Тип                    | Описание                                |
| ----------------- | ---------------------- | --------------------------------------- |
| `Provider`        | `React.ComponentType`  | Компонент провайдера системы            |
| `Link`            | `React.ComponentType`  | Мультипанельный компонент Link          |
| `MainLink`        | `React.ComponentType`  | Link основного роутера (очищает панели) |
| `usePanel`        | `() => UsePanelReturn` | Хук для управления панелями             |
| `useCurrentPanel` | `() => PanelIdentity`  | Хук для текущей панели                  |
| `validateSearch`  | Function               | Валидатор search-параметров             |

---

### PanelControl

Интерфейс управления отдельной панелью.

```typescript
interface PanelControl {
  navigate: (to: string, opts?: { search?: Record<string, string> }) => void
  close: () => void
  isOpen: boolean
}
```

---

### PanelIdentity

Идентификация и методы навигации текущей панели.

```typescript
interface PanelIdentity {
  name: string
  navigate: (to: string, opts?: { search?: Record<string, string> }) => void
  close: () => void
}
```

---

### UsePanelReturn

Тип возвращаемого значения хука `usePanel()`.

```typescript
type UsePanelReturn<TPanels extends PanelMap> = {
  [K in keyof TPanels]: PanelControl
} & {
  isPanelMode: boolean
  navigateMain: (to: string) => void
}
```

**Пример:**

```typescript
// Для panels = { left: leftPanel, right: rightPanel }
type MyPanelReturn = {
  left: PanelControl
  right: PanelControl
  isPanelMode: boolean
  navigateMain: (to: string) => void
}
```

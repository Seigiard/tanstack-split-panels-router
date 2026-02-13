# Библиотека Panel System

Универсальная типобезопасная React-библиотека для построения систем навигации с двойным роутером на базе TanStack Router v1. Обеспечивает независимые вьюпорты с memory history и синхронизацией состояния через URL search-параметры.

## Что делает библиотека

Panel System позволяет запускать несколько независимых экземпляров TanStack Router (панелей) параллельно с основным роутером. Каждая панель имеет собственное состояние навигации и memory history, а основной роутер управляет URL браузера. Состояние панелей кодируется в query-параметрах (`?left=/categories&right=/posts/1`), что обеспечивает сохраняемые в закладках и расшариваемые URL для сложных многовьюпортных интерфейсов.

## Ключевые концепции

### Панели (Panels)

Независимые экземпляры роутера со своими деревьями маршрутов и memory history. Каждая панель создаётся через `createPanel()` и включает собственное дерево маршрутов, путь по умолчанию и навигационные компоненты.

### Система (System)

Коллекция панелей, управляемых совместно. Создаётся через `createPanelSystem()`, предоставляет Provider, компоненты кросс-панельной навигации и хуки для координации состояния панелей.

### Провайдер (Provider)

React context provider, который должен оборачивать всё приложение. Управляет синхронизацией URL, ленивой инициализацией роутеров и предоставляет состояние навигации всем компонентам.

### Кодирование URL

Состояние панелей кодируется в search-параметрах основного роутера. Каждая панель получает именованный query-параметр (например, `?left=/categories/phones&right=/posts/5`), который хранит текущий путь и search-параметры панели.

## Быстрый старт

### 1. Определите дерево маршрутов панели

```tsx
// routes/left-panel/index.tsx
import { createRootRoute, createRoute, Outlet } from '@tanstack/react-router'
import { createPanel } from '@/lib/panel-system'

const leftRoot = createRootRoute({
  component: () => <Outlet />,
})

const categoriesRoute = createRoute({
  getParentRoute: () => leftRoot,
  path: '/categories',
  component: CategoriesView,
})

const leftPanelTree = leftRoot.addChildren([categoriesRoute])

export const leftPanel = createPanel({
  name: 'left',
  tree: leftPanelTree,
  defaultPath: '/categories',
})
```

### 2. Создайте систему панелей

```tsx
// lib/panels.ts
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

### 3. Подключите Provider

```tsx
// routes/route.tsx
import { panels } from '@/lib/panels'

function RootLayout() {
  return (
    <panels.Provider>
      <AppShell />
    </panels.Provider>
  )
}
```

### 4. Отрендерите панели

```tsx
// components/PanelLayout.tsx
import { panels } from '@/lib/panels'
import { leftPanel, rightPanel } from '@/lib/panels'

function PanelLayout() {
  const { left, right } = panels.usePanel()

  return (
    <div className='flex'>
      {left.isOpen && (
        <div>
          <leftPanel.Outlet />
        </div>
      )}
      {right.isOpen && (
        <div>
          <rightPanel.Outlet />
        </div>
      )}
    </div>
  )
}
```

### 5. Навигация между панелями

```tsx
// Типизированная навигация конкретной панели
<leftPanel.Link to="/categories/$cat" params={{ cat: 'phones' }} />

// Мультипанельная навигация
<panels.Link left="/categories" right={{ to: '/posts/$id', params: { id: '5' } }} />

// Программная навигация
const { left, right } = panels.usePanel()
left.navigate('/categories/phones')
right.close()
```

## Диаграмма архитектуры

```
┌─────────────────────────────────────────────────────────────┐
│  URL браузера: /?left=/categories/phones&right=/posts/5      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│             Основной роутер (TanStack Router)                 │
│       - Владеет историей браузера и URL-строкой               │
│       - Управляет search-параметрами (left, right)            │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────┐
│           panels.Provider (PanelSystemContext)                │
│    - Читает search-параметры из основного роутера             │
│    - Создаёт/получает роутеры панелей (лениво)                │
│    - Синхронизирует URL → роутеры панелей (useLayoutEffect)   │
│    - Предоставляет методы навигации                           │
└─────┬────────────────────────────────────────────────┬───────┘
      │                                                 │
      ▼                                                 ▼
┌─────────────────────────┐               ┌─────────────────────────┐
│  Роутер левой панели    │               │  Роутер правой панели   │
│  (Memory History)       │               │  (Memory History)       │
│  - Независимое состояние│               │  - Независимое состояние│
│  - Дерево маршрутов     │               │  - Дерево маршрутов     │
│  - Стек навигации       │               │  - Стек навигации       │
└────────┬────────────────┘               └────────┬────────────────┘
         │                                         │
         ▼                                         ▼
┌─────────────────────────┐               ┌─────────────────────────┐
│  <leftPanel.Outlet />   │               │  <rightPanel.Outlet />  │
│  - Рендерит RouterProvider│              │  - Рендерит RouterProvider│
│  - PanelIdentityContext │               │  - PanelIdentityContext │
│  - Error boundary       │               │  - Error boundary       │
└─────────────────────────┘               └─────────────────────────┘
```

## Поток навигации

```
1. Пользователь кликает <leftPanel.Link to="/categories/phones" />
   │
   ├─> Вычисляет href через mainRouter.buildLocation()
   │   (для поддержки modifier-клавиш: ctrl+клик открывает новую вкладку)
   │
   └─> При клике (без модификаторов):
       │
       ├─> Разрешает параметры: /categories/$cat → /categories/phones
       │
       ├─> navigatePanel('left', '/categories/phones')
       │   │
       │   ├─> Обновляет роутер левой панели (memory history)
       │   │
       │   └─> Обновляет search-параметры основного роутера:
       │       navigate({ to: '/', search: { left: '/categories/phones', right: '...' } })
       │
       └─> URL становится: /?left=/categories/phones&right=...

2. URL изменяется (например, кнопка «назад» в браузере)
   │
   └─> panels.Provider через useLayoutEffect обнаруживает изменение search-параметра
       │
       └─> Синхронизирует с роутером панели: panelNavigate(router, panelValue)
```

## Типобезопасность

Библиотека обеспечивает полный вывод типов TypeScript для маршрутов панелей:

```tsx
// Ошибка типа: несуществующий путь
<leftPanel.Link to="/nonexistent" />

// Ошибка типа: отсутствуют обязательные параметры
<leftPanel.Link to="/categories/$category" />

// Правильно: все параметры указаны
<leftPanel.Link to="/categories/$category" params={{ category: 'phones' }} />
```

## Когда использовать

**Используйте эту библиотеку, когда:**

- Вам нужны несколько независимых контекстов навигации в одном UI
- Вы хотите сохраняемые/расшариваемые URL для сложных мультивьюпортных состояний
- Вам нужна типобезопасная навигация между отдельными деревьями маршрутов
- Вы строите master-detail, split-pane или мультипанельные интерфейсы

**Не используйте эту библиотеку, когда:**

- Вам нужен только один роутер (используйте TanStack Router напрямую)
- Панели должны разделять историю навигации (используйте вложенные маршруты)
- Не нужно сохранение состояния в URL (используйте локальный стейт)

## Дальнейшее чтение

- [Справочник по API](./api-reference.ru.md) — полная документация API
- [Глубокое погружение в архитектуру](./architecture.ru.md) — детали реализации
- [Руководства по использованию](./guides.ru.md) — пошаговые инструкции

# Руководства по использованию Panel System

Пошаговые руководства для типичных задач и паттернов использования.

## Содержание

- [Добавление новой панели](#добавление-новой-панели)
- [Навигация внутри панели](#навигация-внутри-панели)
- [Мультипанельная навигация](#мультипанельная-навигация)
- [Панель-зависимые компоненты](#панель-зависимые-компоненты)
- [Search-параметры в панелях](#search-параметры-в-панелях)
- [Интеграция с основным роутером](#интеграция-с-основным-роутером)
- [Тестирование панельных компонентов](#тестирование-панельных-компонентов)

---

## Добавление новой панели

### Шаг 1: Определите дерево маршрутов

Создайте новый файл маршрута для панели с деревом маршрутов:

```tsx
// routes/settings-panel/index.tsx
import { createRootRoute, createRoute, Outlet } from '@tanstack/react-router'
import { createPanel } from '@/lib/panel-system'

// Корневой маршрут панели
const settingsRoot = createRootRoute({
  component: () => <Outlet />,
})

// Индексный маршрут
const settingsIndexRoute = createRoute({
  getParentRoute: () => settingsRoot,
  path: '/',
  component: function SettingsIndex() {
    return <div>Главная настроек</div>
  },
})

// Маршрут профиля
const profileRoute = createRoute({
  getParentRoute: () => settingsRoot,
  path: '/profile',
  component: function ProfileSettings() {
    return <div>Настройки профиля</div>
  },
})

// Сборка дерева
const settingsPanelTree = settingsRoot.addChildren([
  settingsIndexRoute,
  profileRoute,
])

// Создание экземпляра панели
export const settingsPanel = createPanel({
  name: 'settings',
  tree: settingsPanelTree,
  defaultPath: '/',
  pendingComponent: LoadingSpinner, // Опционально
})
```

### Шаг 2: Добавьте в систему панелей

Обновите систему панелей, включив новую панель:

```tsx
// lib/panels.ts
import { createPanelSystem } from '@/lib/panel-system'
import { leftPanel } from '@/routes/left-panel'
import { rightPanel } from '@/routes/right-panel'
import { settingsPanel } from '@/routes/settings-panel' // Добавляем импорт

export const panels = createPanelSystem({
  panels: {
    left: leftPanel,
    right: rightPanel,
    settings: settingsPanel, // Добавляем в систему
  },
  onNavigate: (panel, action, path) => {
    console.log(`[${panel}] ${action}`, path)
  },
})
```

### Шаг 3: Обновите валидацию search корневого маршрута

Добавьте новую панель в валидацию search корневого маршрута:

```tsx
// routes/route.tsx
import { panels } from '@/lib/panels'

export const rootRoute = createRootRoute({
  validateSearch: (search: Record<string, unknown>) => {
    const panelParams = panels.validateSearch(search) // Получает { left, right, settings }

    return {
      ...panelParams,
      // Ваши остальные search-параметры
    }
  },
  component: RootLayout,
})
```

### Шаг 4: Отрендерите Outlet панели

Добавьте панель в ваш лейаут:

```tsx
// components/PanelLayout.tsx
function PanelLayout() {
  const { left, right, settings } = panels.usePanel()

  return (
    <div className='grid grid-cols-3'>
      {/* Левая панель */}
      {left.isOpen && (
        <div className='panel'>
          <button onClick={left.close}>Закрыть</button>
          <leftPanel.Outlet />
        </div>
      )}

      {/* Правая панель */}
      {right.isOpen && (
        <div className='panel'>
          <button onClick={right.close}>Закрыть</button>
          <rightPanel.Outlet />
        </div>
      )}

      {/* Новая панель настроек */}
      {settings.isOpen && (
        <div className='panel'>
          <button onClick={settings.close}>Закрыть</button>
          <settingsPanel.Outlet />
        </div>
      )}
    </div>
  )
}
```

### Шаг 5: Добавьте навигационные ссылки

Создайте ссылки для открытия новой панели:

```tsx
// Сайдбар или навигационный компонент
import { settingsPanel } from '@/routes/settings-panel'

function Sidebar() {
  return (
    <nav>
      <settingsPanel.Link to='/profile'>Настройки</settingsPanel.Link>
    </nav>
  )
}
```

---

## Навигация внутри панели

### Использование компонента Panel Link

Каждая панель имеет типобезопасный компонент Link:

```tsx
import { leftPanel } from '@/routes/left-panel'

function CategoryNav() {
  return (
    <nav>
      {/* Статический путь */}
      <leftPanel.Link to='/categories'>Все категории</leftPanel.Link>

      {/* Динамический путь с параметрами */}
      <leftPanel.Link
        to='/categories/$category'
        params={{ category: 'phones' }}
      >
        Телефоны
      </leftPanel.Link>

      {/* С search-параметрами */}
      <leftPanel.Link
        to='/categories/$category'
        params={{ category: 'phones' }}
        search={{ sort: 'price', order: 'asc' }}
      >
        Телефоны (по цене)
      </leftPanel.Link>

      {/* С className */}
      <leftPanel.Link to='/categories' className='nav-link active'>
        Категории
      </leftPanel.Link>
    </nav>
  )
}
```

### Использование хука Panel useNav

Для программной навигации внутри панели:

```tsx
import { leftPanel } from '@/routes/left-panel'

function CategoryFilters() {
  const { navigate, close, isOpen } = leftPanel.useNav()

  const handleCategoryChange = (category: string) => {
    navigate(`/categories/${category}`)
  }

  const handleSortChange = (sort: string) => {
    navigate('/categories', {
      search: { sort, order: 'asc' },
    })
  }

  return (
    <div>
      <select onChange={(e) => handleCategoryChange(e.target.value)}>
        <option value='phones'>Телефоны</option>
        <option value='laptops'>Ноутбуки</option>
      </select>

      <select onChange={(e) => handleSortChange(e.target.value)}>
        <option value='price'>Цена</option>
        <option value='name'>Название</option>
      </select>

      <button onClick={close} disabled={!isOpen}>
        Закрыть панель
      </button>
    </div>
  )
}
```

### Разрешение путей с параметрами

Библиотека обрабатывает интерполяцию параметров пути:

```tsx
// Шаблон пути: '/categories/$category/$productId'
// Параметры: { category: 'phones', productId: '42' }
// Результат: '/categories/phones/42'

<leftPanel.Link
  to='/categories/$category/$productId'
  params={{ category: 'phones', productId: '42' }}
/>

// URL становится: /?left=/categories/phones/42
```

### Поддержка modifier-клавиш

Ссылки учитывают modifier-клавиши браузера:

```tsx
<leftPanel.Link to='/categories'>Категории</leftPanel.Link>

// Клик: навигация в панели
// Ctrl+клик (Windows/Linux) или Cmd+клик (Mac): открывает в новой вкладке
// Shift+клик: открывает в новом окне
```

Библиотека вычисляет корректные href через `mainRouter.buildLocation()`, поэтому нативное поведение браузера работает правильно.

---

## Мультипанельная навигация

### Использование System Link

Навигация нескольких панелей одной ссылкой:

```tsx
import { panels } from '@/lib/panels'

function ProductList() {
  return (
    <ul>
      {products.map((product) => (
        <li key={product.id}>
          {/* Открыть категорию слева, детали товара справа */}
          <panels.Link
            left={{ to: '/categories/$cat', params: { cat: product.category } }}
            right={{ to: '/posts/$id', params: { id: product.id } }}
          >
            {product.name}
          </panels.Link>
        </li>
      ))}
    </ul>
  )
}
```

### Закрытие панелей

Установите `false` для панели, чтобы закрыть её:

```tsx
// Закрыть правую панель, оставить левую без изменений
<panels.Link right={false}>
  Закрыть детали
</panels.Link>

// Закрыть обе панели
<panels.Link left={false} right={false}>
  Закрыть все панели
</panels.Link>

// Открыть левую, закрыть правую
<panels.Link left="/categories" right={false}>
  Только категории
</panels.Link>
```

### Строковое сокращение

Используйте строку для путей без параметров:

```tsx
// Строковое сокращение (без параметров)
<panels.Link left="/categories" right="/posts">
  Смотреть всё
</panels.Link>

// Объектный синтаксис (с параметрами)
<panels.Link
  left={{ to: '/categories/$cat', params: { cat: 'phones' } }}
  right={{ to: '/posts/$id', params: { id: '5' } }}
>
  Конкретные элементы
</panels.Link>

// Смешанный
<panels.Link
  left="/categories"  // Строковое сокращение
  right={{ to: '/posts/$id', params: { id: '5' } }}  // Объект с параметрами
>
  Смешанный пример
</panels.Link>
```

### Сохранение состояния панели

Опустите проп панели, чтобы сохранить её текущее состояние:

```tsx
const { right } = panels.usePanel()

// Обновить только левую панель, сохранить состояние правой
<panels.Link left="/categories">
  Смотреть категории
</panels.Link>

// Правая панель остаётся на текущем месте (если открыта) или остаётся закрытой
```

### Использование MainLink

Выход из режима панелей и навигация основного роутера:

```tsx
import { panels } from '@/lib/panels'

function ExitPanelMode() {
  return (
    <div>
      {/* Перейти на главную, закрыть все панели */}
      <panels.MainLink to='/'>Главная</panels.MainLink>

      {/* Перейти к пользователям, закрыть все панели */}
      <panels.MainLink to='/users'>Пользователи</panels.MainLink>
    </div>
  )
}
```

### Программная мультипанельная навигация

Используйте хук `usePanel()` для программного управления:

```tsx
function ProductActions() {
  const { left, right, navigateMain } = panels.usePanel()

  const viewProduct = (categoryId: string, productId: string) => {
    left.navigate(`/categories/${categoryId}`)
    right.navigate(`/products/${productId}`)
  }

  const closeAll = () => {
    left.close()
    right.close()
  }

  const exitToHome = () => {
    navigateMain('/') // Закрывает все панели и навигирует на /
  }

  return (
    <div>
      <button onClick={() => viewProduct('phones', '42')}>
        Смотреть телефон #42
      </button>
      <button onClick={closeAll}>Закрыть все панели</button>
      <button onClick={exitToHome}>На главную</button>
    </div>
  )
}
```

---

## Панель-зависимые компоненты

### Использование useCurrentPanel

Создавайте компоненты, работающие в любой панели:

```tsx
import { panels } from '@/lib/panels'
import { useMatches } from '@tanstack/react-router'

function Breadcrumbs() {
  const matches = useMatches()

  // Автоопределение текущей панели
  let currentPanel = null
  try {
    currentPanel = panels.useCurrentPanel()
  } catch {
    // Не в панели, используем ссылки основного роутера
  }

  const crumbs = matches
    .filter((m) => m.staticData?.breadcrumb)
    .map((m) => ({
      path: m.pathname,
      label: m.staticData.breadcrumb,
    }))

  return (
    <nav>
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1

        if (isLast) {
          return <span key={crumb.path}>{crumb.label}</span>
        }

        // Внутри панели: навигация внутри панели
        if (currentPanel) {
          return (
            <a
              key={crumb.path}
              onClick={(e) => {
                e.preventDefault()
                currentPanel.navigate(crumb.path)
              }}
            >
              {crumb.label}
            </a>
          )
        }

        // Вне панели: навигация основного роутера
        return (
          <Link key={crumb.path} to={crumb.path as '/'}>
            {crumb.label}
          </Link>
        )
      })}
    </nav>
  )
}
```

### Контекст идентификации панели

Каждый `<Panel.Outlet />` предоставляет `PanelIdentityContext`:

```tsx
function GenericPanelHeader() {
  const current = panels.useCurrentPanel()

  return (
    <header>
      <h2>Панель: {current.name}</h2>
      <button onClick={current.close}>Закрыть</button>
    </header>
  )
}

// Работает в любой панели
<leftPanel.Outlet>
  <GenericPanelHeader />  {/* Показывает "Панель: left" */}
  <Content />
</leftPanel.Outlet>

<rightPanel.Outlet>
  <GenericPanelHeader />  {/* Показывает "Панель: right" */}
  <Content />
</rightPanel.Outlet>
```

### Условный рендеринг в зависимости от панели

```tsx
function SearchBar() {
  let panelName = null
  try {
    panelName = panels.useCurrentPanel().name
  } catch {
    // Не в панели
  }

  return (
    <div>
      <input
        type='search'
        placeholder={
          panelName === 'left'
            ? 'Поиск по категориям...'
            : panelName === 'right'
              ? 'Поиск по постам...'
              : 'Поиск...'
        }
      />
    </div>
  )
}
```

### Панельные хлебные крошки с метками

```tsx
// В определении маршрута
const categoryRoute = createRoute({
  getParentRoute: () => leftRoot,
  path: '/categories/$category',
  staticData: {
    breadcrumb: (match) => match.params.category,
  },
  component: CategoryView,
})

// Компонент хлебных крошек автоматически определяет панель и навигирует корректно
function Breadcrumbs() {
  const current = panels.useCurrentPanel()
  const matches = useMatches()

  return (
    <nav>
      {matches.map((match) => {
        const label =
          typeof match.staticData.breadcrumb === 'function'
            ? match.staticData.breadcrumb(match)
            : match.staticData.breadcrumb

        return <a onClick={() => current.navigate(match.pathname)}>{label}</a>
      })}
    </nav>
  )
}
```

---

## Search-параметры в панелях

### Локальные search-параметры панели

Каждая панель может иметь собственные search-параметры:

```tsx
// Маршрут панели с валидацией search
const categoriesRoute = createRoute({
  getParentRoute: () => leftRoot,
  path: '/categories',
  validateSearch: (search: Record<string, unknown>) => ({
    skip: Number(search.skip) || 0,
    limit: Number(search.limit) || 20,
    sort: search.sort === 'name' ? 'name' : 'price',
  }),
  component: CategoriesView,
})

function CategoriesView() {
  const search = useSearch({ from: categoriesRoute.id })
  // search.skip, search.limit, search.sort типизированы и провалидированы

  return (
    <div>
      Показано {search.limit} элементов начиная с {search.skip}
    </div>
  )
}
```

### Навигация с search-параметрами

```tsx
// Через компонент Link
;<leftPanel.Link
  to='/categories'
  search={{ skip: '10', limit: '20', sort: 'name' }}
>
  Страница 2
</leftPanel.Link>

// URL становится: /?left=/categories?skip=10&limit=20&sort=name

// Через хук useNav
function Pagination() {
  const { navigate } = leftPanel.useNav()

  const goToPage = (page: number) => {
    navigate('/categories', {
      search: {
        skip: String(page * 20),
        limit: '20',
      },
    })
  }

  return <button onClick={() => goToPage(2)}>Страница 2</button>
}
```

### Кодирование в URL

Search-параметры панели кодируются в значении панели:

```
Основной URL: /
Search-параметры:
  left = /categories?skip=10&limit=20
  right = /posts/5?sort=desc
```

Полный URL: `/?left=/categories?skip=10&limit=20&right=/posts/5?sort=desc`

### Чтение search-параметров в панели

```tsx
import { useSearch } from '@tanstack/react-router'

function CategoryFilters() {
  const search = useSearch({ from: categoriesRoute.id })

  return (
    <div>
      <p>Текущий skip: {search.skip}</p>
      <p>Текущий limit: {search.limit}</p>
      <p>Текущая сортировка: {search.sort}</p>
    </div>
  )
}
```

### Обновление search-параметров

```tsx
function SortControls() {
  const { navigate } = leftPanel.useNav()
  const search = useSearch({ from: categoriesRoute.id })

  const updateSort = (newSort: string) => {
    navigate('/categories', {
      search: {
        ...search, // Сохранить остальные параметры
        sort: newSort,
      },
    })
  }

  return (
    <select value={search.sort} onChange={(e) => updateSort(e.target.value)}>
      <option value='price'>Цена</option>
      <option value='name'>Название</option>
    </select>
  )
}
```

---

## Интеграция с основным роутером

### Настройка корневого маршрута

Сконфигурируйте корневой маршрут для валидации search-параметров панелей:

```tsx
// routes/route.tsx
import { createRootRoute } from '@tanstack/react-router'
import { panels } from '@/lib/panels'
import { AppShell } from './components/AppShell'

export const rootRoute = createRootRoute({
  validateSearch: (search: Record<string, unknown>) => {
    // Извлечение параметров панелей (left, right)
    const panelParams = panels.validateSearch(search)

    // Объединение с собственными search-параметрами
    return {
      ...panelParams,
      theme: search.theme === 'dark' ? 'dark' : 'light',
      debug: search.debug === 'true',
    }
  },
  component: AppShell,
})
```

### Размещение Provider

Provider должен оборачивать всё приложение:

```tsx
// routes/components/AppShell.tsx
import { Outlet } from '@tanstack/react-router'
import { panels } from '@/lib/panels'

export function AppShell() {
  return (
    <panels.Provider>
      <div className='app-layout'>
        <Sidebar />
        <MainContent />
      </div>
    </panels.Provider>
  )
}

function MainContent() {
  const { isPanelMode } = panels.usePanel()

  return (
    <div>
      {isPanelMode ? (
        <PanelLayout />
      ) : (
        <div className='normal-content'>
          <Outlet />
        </div>
      )}
    </div>
  )
}
```

### Определение режима панелей

Используйте `isPanelMode` для условного рендеринга UI:

```tsx
function Header() {
  const { isPanelMode, navigateMain } = panels.usePanel()

  return (
    <header>
      <h1>Моё приложение</h1>
      {isPanelMode && (
        <button onClick={() => navigateMain('/')}>
          Выйти из режима панелей
        </button>
      )}
    </header>
  )
}
```

### Навигация основного роутера

Навигация основного роутера в режиме панелей:

```tsx
import { panels } from '@/lib/panels'

function Navigation() {
  const { isPanelMode, navigateMain } = panels.usePanel()

  return (
    <nav>
      {/* Способ 1: компонент MainLink */}
      <panels.MainLink to='/'>Главная</panels.MainLink>
      <panels.MainLink to='/users'>Пользователи</panels.MainLink>

      {/* Способ 2: хук navigateMain */}
      <button onClick={() => navigateMain('/settings')}>Настройки</button>

      {/* Способ 3: обычный Link (сохраняет состояние панелей) */}
      <Link to='/about' search={{ left: undefined, right: undefined }}>
        О нас (закрыть панели)
      </Link>
    </nav>
  )
}
```

### Разделение пространств search-параметров

Основной роутер и панели имеют раздельные пространства имён search-параметров:

```tsx
// Search-параметры основного роутера
type MainSearch = {
  left?: string // Значение панели (управляется системой панелей)
  right?: string // Значение панели (управляется системой панелей)
  theme: 'light' | 'dark'
  debug: boolean
}

// Search-параметры левой панели (закодированы в значении левой панели)
type LeftPanelSearch = {
  skip: number
  limit: number
  sort: 'price' | 'name'
}

// Пример URL:
// /?left=/categories?skip=10&limit=20&theme=dark&debug=false
//
// Основной роутер видит: { left: '/categories?skip=10&limit=20', theme: 'dark', debug: false }
// Левая панель видит: { skip: 10, limit: 20 }
```

---

## Тестирование панельных компонентов

### Тестирование Panel Link

```tsx
import { render, screen } from '@testing-library/react'
import { leftPanel } from '@/routes/left-panel'
import { panels } from '@/lib/panels'

describe('CategoryNav', () => {
  it('рендерит панельную ссылку с правильным href', () => {
    render(
      <panels.Provider>
        <leftPanel.Link to='/categories'>Категории</leftPanel.Link>
      </panels.Provider>,
    )

    const link = screen.getByText('Категории')
    expect(link).toHaveAttribute('href', '/?left=/categories')
  })

  it('разрешает параметры пути в href', () => {
    render(
      <panels.Provider>
        <leftPanel.Link
          to='/categories/$category'
          params={{ category: 'phones' }}
        >
          Телефоны
        </leftPanel.Link>
      </panels.Provider>,
    )

    const link = screen.getByText('Телефоны')
    expect(link).toHaveAttribute('href', '/?left=/categories/phones')
  })
})
```

### Тестирование хука usePanel

```tsx
import { renderHook } from '@testing-library/react'
import { panels } from '@/lib/panels'

describe('usePanel', () => {
  it('возвращает элементы управления панелями', () => {
    const wrapper = ({ children }) => (
      <panels.Provider>{children}</panels.Provider>
    )

    const { result } = renderHook(() => panels.usePanel(), { wrapper })

    expect(result.current).toHaveProperty('left')
    expect(result.current).toHaveProperty('right')
    expect(result.current).toHaveProperty('isPanelMode')
    expect(result.current).toHaveProperty('navigateMain')
  })

  it('определяет режим панелей при открытой панели', () => {
    const wrapper = ({ children }) => (
      <panels.Provider>{children}</panels.Provider>
    )

    const { result } = renderHook(() => panels.usePanel(), { wrapper })

    // Изначально панели не открыты
    expect(result.current.isPanelMode).toBe(false)

    // Открываем левую панель
    act(() => {
      result.current.left.navigate('/categories')
    })

    // Режим панелей должен быть true
    expect(result.current.isPanelMode).toBe(true)
  })
})
```

### Тестирование useCurrentPanel

```tsx
import { render, screen } from '@testing-library/react'
import { leftPanel } from '@/routes/left-panel'
import { panels } from '@/lib/panels'

function TestComponent() {
  const current = panels.useCurrentPanel()
  return <div>Панель: {current.name}</div>
}

describe('useCurrentPanel', () => {
  it('возвращает идентификацию текущей панели', () => {
    render(
      <panels.Provider>
        <leftPanel.Outlet>
          <TestComponent />
        </leftPanel.Outlet>
      </panels.Provider>,
    )

    expect(screen.getByText('Панель: left')).toBeInTheDocument()
  })

  it('выбрасывает исключение при использовании вне панели', () => {
    expect(() => {
      render(
        <panels.Provider>
          <TestComponent />
        </panels.Provider>,
      )
    }).toThrow('useCurrentPanel must be used inside a panel Outlet')
  })
})
```

### Интеграционное тестирование

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { createMemoryHistory } from '@tanstack/react-router'
import { panels } from '@/lib/panels'
import { leftPanel } from '@/routes/left-panel'

describe('Интеграция навигации панелей', () => {
  it('открывает панель при клике по ссылке', async () => {
    const history = createMemoryHistory({ initialEntries: ['/'] })

    render(
      <Router history={history}>
        <panels.Provider>
          <leftPanel.Link to='/categories'>Открыть</leftPanel.Link>
          <leftPanel.Outlet />
        </panels.Provider>
      </Router>,
    )

    // Изначально панель закрыта
    expect(history.location.search).toBe('')

    // Клик по ссылке
    fireEvent.click(screen.getByText('Открыть'))

    // Панель открывается, URL обновлён
    expect(history.location.search).toBe('?left=/categories')
  })

  it('синхронизирует URL с роутером панели', async () => {
    const history = createMemoryHistory({
      initialEntries: ['/?left=/categories/phones'],
    })

    render(
      <Router history={history}>
        <panels.Provider>
          <leftPanel.Outlet />
        </panels.Provider>
      </Router>,
    )

    // Роутер панели должен инициализироваться на /categories/phones
    // (проверяем по отрендеренному контенту)
    expect(await screen.findByText('Phones')).toBeInTheDocument()
  })
})
```

### Мокирование системы панелей

```tsx
// test-utils.tsx
import { createPanelSystem } from '@/lib/panel-system'
import { leftPanel } from '@/routes/left-panel'
import { rightPanel } from '@/routes/right-panel'

export const mockPanels = createPanelSystem({
  panels: { left: leftPanel, right: rightPanel },
  onNavigate: vi.fn(), // Мок логгера
})

// В тестах
import { mockPanels } from './test-utils'

test('навигация вызывает onNavigate', () => {
  const onNavigate = vi.fn()
  const testPanels = createPanelSystem({
    panels: { left: leftPanel },
    onNavigate,
  })

  // ... рендер с testPanels.Provider
  // ... вызов навигации

  expect(onNavigate).toHaveBeenCalledWith('left', 'navigate', '/categories')
})
```

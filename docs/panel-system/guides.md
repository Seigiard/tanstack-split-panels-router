# Panel System Usage Guides

Step-by-step guides for common tasks and usage patterns.

## Table of Contents

- [Adding a New Panel](#adding-a-new-panel)
- [Nested Layouts in Panels](#nested-layouts-in-panels)
- [beforeLoad in Panel Routes](#beforeload-in-panel-routes)
- [Handling Loading States](#handling-loading-states)
- [Per-Panel Navigation](#per-panel-navigation)
- [Multi-Panel Navigation](#multi-panel-navigation)
- [Panel-Aware Components](#panel-aware-components)
- [Search Params in Panels](#search-params-in-panels)
- [Integrating with Main Router](#integrating-with-main-router)
- [Testing Panel Components](#testing-panel-components)

---

## Adding a New Panel

### Step 1: Define Route Tree

Create a new route file for your panel with its route tree:

```tsx
// routes/settings-panel/index.tsx
import { createRootRoute, createRoute, Outlet } from '@tanstack/react-router'
import { createPanel } from '@/lib/panel-system'

// Root route for the panel
const settingsRoot = createRootRoute({
  component: () => <Outlet />,
})

// Index route
const settingsIndexRoute = createRoute({
  getParentRoute: () => settingsRoot,
  path: '/',
  component: function SettingsIndex() {
    return <div>Settings Home</div>
  },
})

// Profile route
const profileRoute = createRoute({
  getParentRoute: () => settingsRoot,
  path: '/profile',
  component: function ProfileSettings() {
    return <div>Profile Settings</div>
  },
})

// Assemble tree
const settingsPanelTree = settingsRoot.addChildren([
  settingsIndexRoute,
  profileRoute,
])

// Create panel instance
export const settingsPanel = createPanel({
  name: 'settings',
  tree: settingsPanelTree,
  defaultPath: '/',
  pendingComponent: LoadingSpinner, // Optional
})
```

### Step 2: Add to Panel System

Update your panel system to include the new panel:

```tsx
// lib/panels.ts
import { createPanelSystem } from '@/lib/panel-system'
import { leftPanel } from '@/routes/left-panel'
import { rightPanel } from '@/routes/right-panel'
import { settingsPanel } from '@/routes/settings-panel' // Add import

export const panels = createPanelSystem({
  panels: {
    left: leftPanel,
    right: rightPanel,
    settings: settingsPanel, // Add to system
  },
  onNavigate: (panel, action, path) => {
    console.log(`[${panel}] ${action}`, path)
  },
})
```

### Step 3: Update Root Route Search Validation

Add the new panel to your root route's search validation:

```tsx
// routes/route.tsx
import { panels } from '@/lib/panels'

export const rootRoute = createRootRoute({
  validateSearch: (search: Record<string, unknown>) => {
    const panelParams = panels.validateSearch(search) // Gets { left, right, settings }

    return {
      ...panelParams,
      // Your other search params
    }
  },
  component: RootLayout,
})
```

### Step 4: Render Panel Outlet

Add the panel to your layout:

```tsx
// components/PanelLayout.tsx
function PanelLayout() {
  const { left, right, settings } = panels.usePanel()

  return (
    <div className='grid grid-cols-3'>
      {/* Left panel */}
      {left.isOpen && (
        <div className='panel'>
          <button onClick={left.close}>Close</button>
          <leftPanel.Outlet />
        </div>
      )}

      {/* Right panel */}
      {right.isOpen && (
        <div className='panel'>
          <button onClick={right.close}>Close</button>
          <rightPanel.Outlet />
        </div>
      )}

      {/* New settings panel */}
      {settings.isOpen && (
        <div className='panel'>
          <button onClick={settings.close}>Close</button>
          <settingsPanel.Outlet />
        </div>
      )}
    </div>
  )
}
```

### Step 5: Add Navigation Links

Create links to open the new panel:

```tsx
// Sidebar or navigation component
import { settingsPanel } from '@/routes/settings-panel'

function Sidebar() {
  return (
    <nav>
      <settingsPanel.Link to='/profile'>Settings</settingsPanel.Link>
    </nav>
  )
}
```

---

## Nested Layouts in Panels

Panel route trees support nested layouts the same way TanStack Router does — layout routes render `<Outlet />` and child routes render inside them.

### Creating a Layout Route

A layout route defines shared UI (wrapper, header, sidebar) for a group of child routes:

```tsx
// routes/categories/route.tsx — layout
import { createRoute, Outlet } from '@tanstack/react-router'

export const categoriesRoute = createRoute({
  getParentRoute: () => leftRoot,
  path: '/categories',
  staticData: { breadcrumb: 'Categories' },
  component: () => <Outlet />,
})
```

The layout route itself renders nothing but `<Outlet />`. Child routes fill the outlet:

```tsx
// routes/categories/index.tsx — child
export const categoriesIndexRoute = createRoute({
  getParentRoute: () => categoriesRoute,
  path: '/',
  loader: async () => {
    /* ... */
  },
  component: CategoriesView,
})
```

### Multi-Level Nesting

Routes can nest several levels deep. Each level adds its own layout:

```
leftRoot
  └── /categories          → <Outlet />
        ├── /              → CategoriesView (list)
        └── /$category     → <Outlet />
              ├── /        → CategoryProductsView (products)
              └── /$productId → ProductDetailView
```

The route tree mirrors this structure:

```tsx
const leftPanelTree = leftRoot.addChildren([
  categoriesRoute.addChildren([
    categoriesIndexRoute,
    categoryProductsRoute.addChildren([
      categoryProductsIndexRoute,
      productDetailRoute,
    ]),
  ]),
])
```

Each layout route can wrap shared UI around its children — headers, sidebars, breadcrumbs — and `<Outlet />` renders the active child.

---

## beforeLoad in Panel Routes

`beforeLoad` runs before the route's loader and component. It's used for guards, redirects, and injecting context. Works identically in panel routes and main routes.

### Injecting Route Context

Return an object from `beforeLoad` to make it available via `useRouteContext()`:

```tsx
export const categoriesIndexRoute = createRoute({
  getParentRoute: () => categoriesRoute,
  path: '/',
  beforeLoad: ({ cause }) => {
    beforeLoadLog(cause, 'left:/categories')
    return {
      label: 'Categories',
      description: 'Browse product categories',
    }
  },
  component: CategoriesView,
})

function CategoriesView() {
  const ctx = categoriesIndexRoute.useRouteContext()
  // ctx.label === 'Categories'
}
```

### Access to Params and Search

`beforeLoad` receives the same context as `loader` — params, search, cause:

```tsx
beforeLoad: ({ cause, params, search }) => {
  beforeLoadLog(cause, `left:/categories/${params.category}`)
  return { category: params.category }
},
```

### Guards and Redirects

Use `beforeLoad` to prevent access or redirect:

```tsx
beforeLoad: ({ context }) => {
  if (!context.auth.isLoggedIn) {
    throw redirect({ to: '/login' })
  }
},
```

This works the same in panels — the redirect happens within the panel's memory router.

---

## Handling Loading States

Panel routers support pending components that show while loaders are running — the same `pendingComponent` / `pendingMs` pattern from TanStack Router.

### Global Pending Component

Set a default pending component when creating the panel. It applies to all routes in the panel:

```tsx
export const leftPanel = createPanel({
  name: 'left',
  tree: leftPanelTree,
  defaultPath: '/categories',
  pendingComponent: RoutePending,
})
```

The `pendingComponent` is passed to the panel's internal `createRouter` and works as `defaultPendingComponent`.

### How It Works

When a panel route has a slow loader, the panel shows the pending component automatically:

```tsx
// This loader takes 1 second — pending component shows after pendingMs
export const postsRoute = createRoute({
  getParentRoute: () => rightRoot,
  path: '/',
  loader: async () => {
    await wait(1000)
    const res = await fetch('https://dummyjson.com/posts?limit=30')
    return res.json()
  },
})
```

The `pendingMs` threshold (default 200ms) is configured on the router level, not per-route. Short loaders won't flash the pending component.

### Route-Level Pending Component

Individual routes can override the default:

```tsx
export const heavyRoute = createRoute({
  getParentRoute: () => leftRoot,
  path: '/heavy',
  pendingComponent: () => <div>Loading heavy data...</div>,
  loader: async () => {
    /* slow fetch */
  },
})
```

---

## Per-Panel Navigation

### Using Panel Link Component

Each panel has a type-safe Link component:

```tsx
import { leftPanel } from '@/routes/left-panel'

function CategoryNav() {
  return (
    <nav>
      {/* Static path */}
      <leftPanel.Link to='/categories'>All Categories</leftPanel.Link>

      {/* Dynamic path with params */}
      <leftPanel.Link
        to='/categories/$category'
        params={{ category: 'phones' }}
      >
        Phones
      </leftPanel.Link>

      {/* With search params */}
      <leftPanel.Link
        to='/categories/$category'
        params={{ category: 'phones' }}
        search={{ sort: 'price', order: 'asc' }}
      >
        Phones (sorted by price)
      </leftPanel.Link>

      {/* With className */}
      <leftPanel.Link to='/categories' className='nav-link active'>
        Categories
      </leftPanel.Link>
    </nav>
  )
}
```

### Using Panel useNav Hook

For programmatic navigation within a panel:

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
        <option value='phones'>Phones</option>
        <option value='laptops'>Laptops</option>
      </select>

      <select onChange={(e) => handleSortChange(e.target.value)}>
        <option value='price'>Price</option>
        <option value='name'>Name</option>
      </select>

      <button onClick={close} disabled={!isOpen}>
        Close Panel
      </button>
    </div>
  )
}
```

### Path Resolution with Params

The library handles path parameter interpolation:

```tsx
// Template path: '/categories/$category/$productId'
// Params: { category: 'phones', productId: '42' }
// Result: '/categories/phones/42'

<leftPanel.Link
  to='/categories/$category/$productId'
  params={{ category: 'phones', productId: '42' }}
/>

// URL becomes: /?left=/categories/phones/42
```

### Modifier Key Support

Links respect browser modifier keys:

```tsx
<leftPanel.Link to='/categories'>Categories</leftPanel.Link>

// Click: Navigates in panel
// Ctrl+Click (Windows/Linux) or Cmd+Click (Mac): Opens in new tab
// Shift+Click: Opens in new window
```

The library computes proper hrefs via `mainRouter.buildLocation()`, so the browser's native behavior works correctly.

---

## Multi-Panel Navigation

### Using System Link

Navigate multiple panels with a single link:

```tsx
import { panels } from '@/lib/panels'

function ProductList() {
  return (
    <ul>
      {products.map((product) => (
        <li key={product.id}>
          {/* Open category in left, product detail in right */}
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

### Closing Panels

Set panel to `false` to close it:

```tsx
// Close right panel, keep left panel unchanged
<panels.Link right={false}>
  Close Details
</panels.Link>

// Close both panels
<panels.Link left={false} right={false}>
  Close All Panels
</panels.Link>

// Open left, close right
<panels.Link left="/categories" right={false}>
  View Categories Only
</panels.Link>
```

### String Shorthand

Use string for param-free paths:

```tsx
// String shorthand (no params)
<panels.Link left="/categories" right="/posts">
  View All
</panels.Link>

// Object syntax (with params)
<panels.Link
  left={{ to: '/categories/$cat', params: { cat: 'phones' } }}
  right={{ to: '/posts/$id', params: { id: '5' } }}
>
  View Specific
</panels.Link>

// Mixed
<panels.Link
  left="/categories"  // String shorthand
  right={{ to: '/posts/$id', params: { id: '5' } }}  // Object with params
>
  Mixed Example
</panels.Link>
```

### Preserving Panel State

Omit a panel prop to preserve its current state:

```tsx
const { right } = panels.usePanel()

// Only update left panel, preserve right panel state
<panels.Link left="/categories">
  View Categories
</panels.Link>

// Right panel stays at current location (if open) or stays closed
```

### Using MainLink

Exit panel mode and navigate the main router:

```tsx
import { panels } from '@/lib/panels'

function ExitPanelMode() {
  return (
    <div>
      {/* Navigate to home, close all panels */}
      <panels.MainLink to='/'>Home</panels.MainLink>

      {/* Navigate to users, close all panels */}
      <panels.MainLink to='/users'>Users</panels.MainLink>
    </div>
  )
}
```

### Programmatic Multi-Panel Navigation

Use `usePanel()` hook for programmatic control:

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
    navigateMain('/') // Closes all panels and navigates to /
  }

  return (
    <div>
      <button onClick={() => viewProduct('phones', '42')}>
        View Phone #42
      </button>
      <button onClick={closeAll}>Close All Panels</button>
      <button onClick={exitToHome}>Exit to Home</button>
    </div>
  )
}
```

---

## Panel-Aware Components

### Using useCurrentPanel

Create components that work in any panel:

```tsx
import { panels } from '@/lib/panels'
import { useMatches } from '@tanstack/react-router'

function Breadcrumbs() {
  const matches = useMatches()

  // Auto-detect which panel we're in
  let currentPanel = null
  try {
    currentPanel = panels.useCurrentPanel()
  } catch {
    // Not in a panel, use main router links
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

        // Inside panel: navigate within panel
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

        // Outside panel: navigate main router
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

### Panel Identity Context

Each `<Panel.Outlet />` provides `PanelIdentityContext`:

```tsx
function GenericPanelHeader() {
  const current = panels.useCurrentPanel()

  return (
    <header>
      <h2>{current.name} Panel</h2>
      <button onClick={current.close}>Close</button>
    </header>
  )
}

// Works in any panel
<leftPanel.Outlet>
  <GenericPanelHeader />  {/* Shows "left Panel" */}
  <Content />
</leftPanel.Outlet>

<rightPanel.Outlet>
  <GenericPanelHeader />  {/* Shows "right Panel" */}
  <Content />
</rightPanel.Outlet>
```

### Conditional Rendering Based on Panel

```tsx
function SearchBar() {
  let panelName = null
  try {
    panelName = panels.useCurrentPanel().name
  } catch {
    // Not in a panel
  }

  return (
    <div>
      <input
        type='search'
        placeholder={
          panelName === 'left'
            ? 'Search categories...'
            : panelName === 'right'
              ? 'Search posts...'
              : 'Search...'
        }
      />
    </div>
  )
}
```

### Panel-Specific Breadcrumb Labels

```tsx
// In route definition
const categoryRoute = createRoute({
  getParentRoute: () => leftRoot,
  path: '/categories/$category',
  staticData: {
    breadcrumb: (match) => match.params.category,
  },
  component: CategoryView,
})

// Breadcrumbs component auto-detects panel and navigates correctly
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

## Search Params in Panels

### Panel-Local Search Params

Each panel can have its own search parameters:

```tsx
// Panel route with search validation
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
  // search.skip, search.limit, search.sort are typed and validated

  return (
    <div>
      Showing {search.limit} items starting at {search.skip}
    </div>
  )
}
```

### Navigating with Search Params

```tsx
// Via Link component
;<leftPanel.Link
  to='/categories'
  search={{ skip: '10', limit: '20', sort: 'name' }}
>
  Page 2
</leftPanel.Link>

// URL becomes: /?left=/categories?skip=10&limit=20&sort=name

// Via useNav hook
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

  return <button onClick={() => goToPage(2)}>Page 2</button>
}
```

### URL Encoding

Panel search params are encoded in the panel value:

```
Main URL: /
Search params:
  left = /categories?skip=10&limit=20
  right = /posts/5?sort=desc
```

Full URL: `/?left=/categories?skip=10&limit=20&right=/posts/5?sort=desc`

### Reading Search Params in Panel

```tsx
import { useSearch } from '@tanstack/react-router'

function CategoryFilters() {
  const search = useSearch({ from: categoriesRoute.id })

  return (
    <div>
      <p>Current skip: {search.skip}</p>
      <p>Current limit: {search.limit}</p>
      <p>Current sort: {search.sort}</p>
    </div>
  )
}
```

### Updating Search Params

```tsx
function SortControls() {
  const { navigate } = leftPanel.useNav()
  const search = useSearch({ from: categoriesRoute.id })

  const updateSort = (newSort: string) => {
    navigate('/categories', {
      search: {
        ...search, // Preserve other params
        sort: newSort,
      },
    })
  }

  return (
    <select value={search.sort} onChange={(e) => updateSort(e.target.value)}>
      <option value='price'>Price</option>
      <option value='name'>Name</option>
    </select>
  )
}
```

---

## Integrating with Main Router

### Root Route Setup

Configure the root route to validate panel search params:

```tsx
// routes/route.tsx
import { createRootRoute } from '@tanstack/react-router'
import { panels } from '@/lib/panels'
import { AppShell } from './components/AppShell'

export const rootRoute = createRootRoute({
  validateSearch: (search: Record<string, unknown>) => {
    // Extract panel params (left, right)
    const panelParams = panels.validateSearch(search)

    // Merge with your own search params
    return {
      ...panelParams,
      theme: search.theme === 'dark' ? 'dark' : 'light',
      debug: search.debug === 'true',
    }
  },
  component: AppShell,
})
```

### Provider Placement

The Provider must wrap your entire application:

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

### Detecting Panel Mode

Use `isPanelMode` to conditionally render UI:

```tsx
function Header() {
  const { isPanelMode, navigateMain } = panels.usePanel()

  return (
    <header>
      <h1>My App</h1>
      {isPanelMode && (
        <button onClick={() => navigateMain('/')}>Exit Panel Mode</button>
      )}
    </header>
  )
}
```

### Main Router Navigation

Navigate the main router while in panel mode:

```tsx
import { panels } from '@/lib/panels'

function Navigation() {
  const { isPanelMode, navigateMain } = panels.usePanel()

  return (
    <nav>
      {/* Method 1: MainLink component */}
      <panels.MainLink to='/'>Home</panels.MainLink>
      <panels.MainLink to='/users'>Users</panels.MainLink>

      {/* Method 2: navigateMain hook */}
      <button onClick={() => navigateMain('/settings')}>Settings</button>

      {/* Method 3: Regular Link (preserves panel state) */}
      <Link to='/about' search={{ left: undefined, right: undefined }}>
        About (close panels)
      </Link>
    </nav>
  )
}
```

### Sharing Search Params

Main router and panels have separate search param namespaces:

```tsx
// Main router search params
type MainSearch = {
  left?: string // Panel value (managed by panel system)
  right?: string // Panel value (managed by panel system)
  theme: 'light' | 'dark'
  debug: boolean
}

// Left panel search params (encoded in left panel value)
type LeftPanelSearch = {
  skip: number
  limit: number
  sort: 'price' | 'name'
}

// URL example:
// /?left=/categories?skip=10&limit=20&theme=dark&debug=false
//
// Main router sees: { left: '/categories?skip=10&limit=20', theme: 'dark', debug: false }
// Left panel sees: { skip: 10, limit: 20 }
```

---

## Testing Panel Components

### Testing Panel Links

```tsx
import { render, screen } from '@testing-library/react'
import { leftPanel } from '@/routes/left-panel'
import { panels } from '@/lib/panels'

describe('CategoryNav', () => {
  it('renders panel link with correct href', () => {
    render(
      <panels.Provider>
        <leftPanel.Link to='/categories'>Categories</leftPanel.Link>
      </panels.Provider>,
    )

    const link = screen.getByText('Categories')
    expect(link).toHaveAttribute('href', '/?left=/categories')
  })

  it('resolves path params in href', () => {
    render(
      <panels.Provider>
        <leftPanel.Link
          to='/categories/$category'
          params={{ category: 'phones' }}
        >
          Phones
        </leftPanel.Link>
      </panels.Provider>,
    )

    const link = screen.getByText('Phones')
    expect(link).toHaveAttribute('href', '/?left=/categories/phones')
  })
})
```

### Testing usePanel Hook

```tsx
import { renderHook } from '@testing-library/react'
import { panels } from '@/lib/panels'

describe('usePanel', () => {
  it('returns panel controls', () => {
    const wrapper = ({ children }) => (
      <panels.Provider>{children}</panels.Provider>
    )

    const { result } = renderHook(() => panels.usePanel(), { wrapper })

    expect(result.current).toHaveProperty('left')
    expect(result.current).toHaveProperty('right')
    expect(result.current).toHaveProperty('isPanelMode')
    expect(result.current).toHaveProperty('navigateMain')
  })

  it('detects panel mode when panel open', () => {
    // Mock search params with panel value
    const wrapper = ({ children }) => (
      <panels.Provider>{children}</panels.Provider>
    )

    const { result } = renderHook(() => panels.usePanel(), { wrapper })

    // Initially no panels open
    expect(result.current.isPanelMode).toBe(false)

    // Open left panel
    act(() => {
      result.current.left.navigate('/categories')
    })

    // Panel mode should be true
    expect(result.current.isPanelMode).toBe(true)
  })
})
```

### Testing useCurrentPanel

```tsx
import { render, screen } from '@testing-library/react'
import { leftPanel } from '@/routes/left-panel'
import { panels } from '@/lib/panels'

function TestComponent() {
  const current = panels.useCurrentPanel()
  return <div>Panel: {current.name}</div>
}

describe('useCurrentPanel', () => {
  it('returns current panel identity', () => {
    render(
      <panels.Provider>
        <leftPanel.Outlet>
          <TestComponent />
        </leftPanel.Outlet>
      </panels.Provider>,
    )

    expect(screen.getByText('Panel: left')).toBeInTheDocument()
  })

  it('throws when used outside panel', () => {
    // Should throw error
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

### Integration Testing

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { createMemoryHistory } from '@tanstack/react-router'
import { panels } from '@/lib/panels'
import { leftPanel } from '@/routes/left-panel'

describe('Panel Navigation Integration', () => {
  it('opens panel on link click', async () => {
    const history = createMemoryHistory({ initialEntries: ['/'] })

    render(
      <Router history={history}>
        <panels.Provider>
          <leftPanel.Link to='/categories'>Open</leftPanel.Link>
          <leftPanel.Outlet />
        </panels.Provider>
      </Router>,
    )

    // Initially panel closed
    expect(history.location.search).toBe('')

    // Click link
    fireEvent.click(screen.getByText('Open'))

    // Panel opens, URL updated
    expect(history.location.search).toBe('?left=/categories')
  })

  it('syncs URL to panel router', async () => {
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

    // Panel router should initialize at /categories/phones
    // (verify by checking rendered content)
    expect(await screen.findByText('Phones')).toBeInTheDocument()
  })
})
```

### Mocking Panel System

```tsx
// test-utils.tsx
import { createPanelSystem } from '@/lib/panel-system'
import { leftPanel } from '@/routes/left-panel'
import { rightPanel } from '@/routes/right-panel'

export const mockPanels = createPanelSystem({
  panels: { left: leftPanel, right: rightPanel },
  onNavigate: vi.fn(), // Mock logger
})

// In tests
import { mockPanels } from './test-utils'

test('navigation calls onNavigate', () => {
  const onNavigate = vi.fn()
  const testPanels = createPanelSystem({
    panels: { left: leftPanel },
    onNavigate,
  })

  // ... render with testPanels.Provider
  // ... trigger navigation

  expect(onNavigate).toHaveBeenCalledWith('left', 'navigate', '/categories')
})
```

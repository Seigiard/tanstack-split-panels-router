# Panel System API Reference

Complete reference for all exported functions, types, components, and hooks.

## Table of Contents

- [Factories](#factories)
  - [createPanel](#createpanel)
  - [createPanelSystem](#createpanelsystem)
- [Components](#components)
  - [Provider](#provider)
  - [Panel.Outlet](#paneloutlet)
  - [Panel.Link](#panellink)
  - [System.Link](#systemlink)
  - [System.MainLink](#systemmainlink)
- [Hooks](#hooks)
  - [usePanel](#usepanel)
  - [useCurrentPanel](#usecurrentpanel)
  - [Panel.useNav](#panelusenav)
- [Utilities](#utilities)
  - [validateSearch](#validatesearch)
  - [parsePanelValue](#parsepanelvalue)
  - [buildPanelValue](#buildpanelvalue)
  - [resolvePath](#resolvepath)
- [Types](#types)
  - [PanelConfig](#panelconfig)
  - [PanelInstance](#panelinstance)
  - [PanelSystem](#panelsystem)
  - [PanelControl](#panelcontrol)
  - [PanelIdentity](#panelidentity)
  - [UsePanelReturn](#usepanelreturn)

---

## Factories

### createPanel

Creates a panel instance with its own route tree, navigation components, and hooks.

```tsx
function createPanel<TTree extends AnyRoute>(
  config: PanelConfig<TTree> & { pendingComponent?: RouteComponent },
): PanelInstance<TTree>
```

**Parameters:**

| Name                      | Type                        | Description                                                        |
| ------------------------- | --------------------------- | ------------------------------------------------------------------ |
| `config.name`             | `string`                    | Unique identifier for the panel (used as search param key)         |
| `config.tree`             | `TTree extends AnyRoute`    | TanStack Router route tree for this panel                          |
| `config.defaultPath`      | `RoutePaths<TTree>`         | Initial path when panel opens (also used when no URL value exists) |
| `config.pendingComponent` | `RouteComponent` (optional) | Loading component displayed during route transitions               |

**Returns:**

`PanelInstance<TTree>` with:

- `Outlet: React.ComponentType` — Renders the panel's RouterProvider
- `Link: PanelLinkComponent<TTree>` — Type-safe Link component for this panel
- `useNav: () => PanelNavReturn` — Navigation hook for this panel
- `name: string` — Panel identifier
- `tree: TTree` — Route tree reference
- `defaultPath: string` — Default path
- `getRouter: PanelRouterFactory` — Router factory (lazy initialization)

**Example:**

```tsx
import { createPanel } from '@/lib/panel-system'
import { leftPanelTree } from './tree'

export const leftPanel = createPanel({
  name: 'left',
  tree: leftPanelTree,
  defaultPath: '/categories',
  pendingComponent: LoadingSpinner,
})

// Use the returned components
<leftPanel.Outlet />
<leftPanel.Link to="/categories" />
```

---

### createPanelSystem

Combines multiple panels into a coordinated system with cross-panel navigation.

```tsx
function createPanelSystem<TPanels extends PanelMap>(
  options: PanelSystemOptions<TPanels>,
): PanelSystem<TPanels>
```

**Parameters:**

| Name                 | Type                                                                               | Description                                                   |
| -------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `options.panels`     | `TPanels extends PanelMap`                                                         | Record of panel instances (name → PanelInstance)              |
| `options.onNavigate` | `(panel: string, action: 'navigate' \| 'close', path?: string) => void` (optional) | Callback fired on panel navigation/close (useful for logging) |

**Returns:**

`PanelSystem<TPanels>` with:

- `Provider: React.ComponentType<{ children: React.ReactNode }>` — System provider
- `Link: React.ComponentType<SystemLinkProps<TPanels>>` — Multi-panel Link
- `MainLink: React.ComponentType<{ to: string, ... }>` — Link that clears all panels
- `usePanel: () => UsePanelReturn<TPanels>` — Hook for panel controls
- `useCurrentPanel: () => PanelIdentity` — Hook for current panel identity
- `validateSearch: (search: Record<string, unknown>) => Record<string, string | undefined>` — Search param validator

**Example:**

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

## Components

### Provider

Context provider that manages panel state synchronization and URL encoding.

```tsx
<panels.Provider>{children}</panels.Provider>
```

**Props:**

| Name       | Type              | Description         |
| ---------- | ----------------- | ------------------- |
| `children` | `React.ReactNode` | Application content |

**Behavior:**

- Reads search params from main router via `useSearch()`
- Creates/retrieves panel routers lazily (only when needed)
- Syncs URL changes to panel routers via `useLayoutEffect`
- Provides `PanelSystemContext` for all hooks and components
- Must wrap entire application (always mounted, not conditionally rendered)

**Example:**

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

Renders the panel's RouterProvider wrapped in identity context.

```tsx
<leftPanel.Outlet />
```

**Behavior:**

- Retrieves panel router from `PanelSystemContext`
- Wraps `RouterProvider` in `PanelIdentityContext` (enables `useCurrentPanel()`)
- Returns `null` if context unavailable or panel not open
- Each panel instance has its own Outlet

**Example:**

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

Type-safe link component for per-panel navigation. Renders a custom `<a>` tag (not TanStack Link) with href computation and click handling.

```tsx
<leftPanel.Link
  to='/categories/$category'
  params={{ category: 'phones' }}
  search={{ skip: '10' }}
  className='link'
>
  View Phones
</leftPanel.Link>
```

**Props:**

| Name        | Type                                | Description                                                   |
| ----------- | ----------------------------------- | ------------------------------------------------------------- |
| `to`        | `RoutePaths<TTree>`                 | Route path (must exist in panel's route tree)                 |
| `params`    | `Record<string, string>`            | Path parameters (required if path contains `$param` segments) |
| `search`    | `Record<string, string>` (optional) | Query parameters for the panel                                |
| `className` | `string` (optional)                 | CSS class name                                                |
| `children`  | `React.ReactNode` (optional)        | Link content                                                  |

**Type Safety:**

TypeScript enforces:

- `to` must be a valid path from the panel's route tree
- `params` required when path contains dynamic segments
- `params` keys must match parameter names in path

**Behavior:**

- Computes `href` via `mainRouter.buildLocation()` (enables modifier keys)
- Resolves path params: `/categories/$cat` + `{ cat: 'phones' }` → `/categories/phones`
- Encodes panel value in main router search params
- On click (no modifiers): prevents default, calls `navigatePanel()`
- On modifier click (ctrl/cmd): allows browser default (new tab/window)

**Example:**

```tsx
// Static path
<leftPanel.Link to="/categories">Categories</leftPanel.Link>

// Dynamic path with params
<leftPanel.Link
  to="/categories/$category"
  params={{ category: 'phones' }}
>
  Phones
</leftPanel.Link>

// With search params
<leftPanel.Link
  to="/categories/$category"
  params={{ category: 'phones' }}
  search={{ skip: '10', limit: '20' }}
>
  Phones (page 2)
</leftPanel.Link>
```

---

### System.Link

Multi-panel link that can navigate multiple panels simultaneously.

```tsx
<panels.Link
  left='/categories'
  right={{ to: '/posts/$id', params: { id: '5' } }}
  className='link'
>
  View Category & Post
</panels.Link>
```

**Props:**

Dynamic props based on panel names, plus:

| Name          | Type                                                     | Description                      |
| ------------- | -------------------------------------------------------- | -------------------------------- |
| `[panelName]` | `string \| { to, params?, search? } \| false` (optional) | Navigation target for each panel |
| `className`   | `string` (optional)                                      | CSS class name                   |
| `children`    | `React.ReactNode` (optional)                             | Link content                     |

**Panel Target Types:**

- `string` — Path without params (e.g., `left="/categories"`)
- `{ to, params?, search? }` — Path with params and/or search (e.g., `right={{ to: '/posts/$id', params: { id: '5' } }}`)
- `false` — Close the panel (e.g., `right={false}`)
- `undefined` — No change to panel state (omit the prop)

**Behavior:**

- Computes combined href with all panel states
- On click: updates each specified panel
- Preserves state of unspecified panels
- Supports modifier keys (ctrl+click for new tab)

**Example:**

```tsx
// Open left panel, close right panel
<panels.Link left="/categories" right={false}>
  View Categories Only
</panels.Link>

// Navigate both panels
<panels.Link
  left={{ to: '/categories/$cat', params: { cat: 'phones' } }}
  right={{ to: '/posts/$id', params: { id: '5' } }}
>
  Phones & Post
</panels.Link>

// Keep left panel unchanged, open right panel
<panels.Link right="/posts">
  View Posts
</panels.Link>
```

---

### System.MainLink

Link component that clears all panel state and navigates the main router.

```tsx
<panels.MainLink to='/users' className='link'>
  View Users (Normal Mode)
</panels.MainLink>
```

**Props:**

| Name        | Type                         | Description      |
| ----------- | ---------------------------- | ---------------- |
| `to`        | `string`                     | Main router path |
| `className` | `string` (optional)          | CSS class name   |
| `children`  | `React.ReactNode` (optional) | Link content     |

**Behavior:**

- Uses TanStack `Link` component under the hood
- Sets all panel search params to `undefined`
- Navigates to `to` path in main router
- Exits panel mode (if in panel mode)

**Example:**

```tsx
// Exit panel mode and go to home page
<panels.MainLink to="/">Home</panels.MainLink>

// Exit panel mode and go to users page
<panels.MainLink to="/users">Users</panels.MainLink>
```

---

## Hooks

### usePanel

Returns navigation controls for all panels plus global state.

```tsx
const { left, right, isPanelMode, navigateMain } = panels.usePanel()
```

**Returns:**

`UsePanelReturn<TPanels>` with:

| Property       | Type                   | Description                                       |
| -------------- | ---------------------- | ------------------------------------------------- |
| `[panelName]`  | `PanelControl`         | Controls for each panel (navigate, close, isOpen) |
| `isPanelMode`  | `boolean`              | `true` if any panel is open                       |
| `navigateMain` | `(to: string) => void` | Navigate main router and clear all panels         |

**PanelControl Properties:**

| Property   | Type                                                               | Description                                  |
| ---------- | ------------------------------------------------------------------ | -------------------------------------------- |
| `navigate` | `(to: string, opts?: { search?: Record<string, string> }) => void` | Navigate within panel (opens if closed)      |
| `close`    | `() => void`                                                       | Close panel and clear from URL               |
| `isOpen`   | `boolean`                                                          | `true` if panel has a value in search params |

**Example:**

```tsx
function PanelControls() {
  const { left, right, isPanelMode, navigateMain } = panels.usePanel()

  return (
    <div>
      <button onClick={() => left.navigate('/categories')}>
        Open Left Panel
      </button>

      <button
        onClick={() => right.navigate('/posts', { search: { page: '1' } })}
      >
        Open Right Panel (page 1)
      </button>

      <button onClick={right.close} disabled={!right.isOpen}>
        Close Right Panel
      </button>

      <button onClick={() => navigateMain('/users')} disabled={!isPanelMode}>
        Exit Panel Mode
      </button>

      <p>Panel mode: {isPanelMode ? 'Yes' : 'No'}</p>
    </div>
  )
}
```

---

### useCurrentPanel

Returns identity and navigation methods for the current panel. Must be called inside a panel component (below `<Panel.Outlet />`).

```tsx
const current = panels.useCurrentPanel()
```

**Returns:**

`PanelIdentity` with:

| Property   | Type                                                               | Description                              |
| ---------- | ------------------------------------------------------------------ | ---------------------------------------- |
| `name`     | `string`                                                           | Panel identifier (e.g., 'left', 'right') |
| `navigate` | `(to: string, opts?: { search?: Record<string, string> }) => void` | Navigate within this panel               |
| `close`    | `() => void`                                                       | Close this panel                         |

**Throws:**

Error if called outside a panel (not inside `PanelIdentityContext`)

**Use Cases:**

- Generic panel components that work in any panel
- Breadcrumbs that auto-detect which panel they're in
- Panel-aware navigation controls

**Example:**

```tsx
// In a breadcrumb component rendered inside left or right panel
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

Returns navigation controls for a specific panel. Convenience hook that's panel-specific.

```tsx
const { navigate, close, isOpen } = leftPanel.useNav()
```

**Returns:**

`PanelNavReturn` with:

| Property   | Type                                                               | Description                |
| ---------- | ------------------------------------------------------------------ | -------------------------- |
| `navigate` | `(to: string, opts?: { search?: Record<string, string> }) => void` | Navigate within this panel |
| `close`    | `() => void`                                                       | Close this panel           |
| `isOpen`   | `boolean`                                                          | `true` if panel is open    |

**Throws:**

Error if called outside `panels.Provider`

**Example:**

```tsx
import { leftPanel } from '@/routes/left-panel'

function CategorySidebar() {
  const { navigate, close, isOpen } = leftPanel.useNav()

  return (
    <div>
      <button onClick={() => navigate('/categories/phones')}>
        View Phones
      </button>
      <button onClick={close} disabled={!isOpen}>
        Close Panel
      </button>
    </div>
  )
}
```

---

## Utilities

### validateSearch

Extracts panel-specific search parameters from TanStack Router search object.

```tsx
const panelParams = panels.validateSearch(search)
```

**Parameters:**

| Name     | Type                      | Description                               |
| -------- | ------------------------- | ----------------------------------------- |
| `search` | `Record<string, unknown>` | Search params object from TanStack Router |

**Returns:**

`Record<string, string | undefined>` — Object with panel names as keys, panel values as values

**Behavior:**

- Returns only panel-specific keys (e.g., `{ left: string, right: string }`)
- Consumer merges with their own search params
- Used in root route's `validateSearch` function

**Example:**

```tsx
import { panels } from '@/lib/panels'

export const rootRoute = createRootRoute({
  validateSearch: (search: Record<string, unknown>) => {
    const panelParams = panels.validateSearch(search)

    // Merge with your own search params
    return {
      ...panelParams,
      theme: search.theme === 'dark' ? 'dark' : 'light',
    }
  },
})
```

---

### parsePanelValue

Parses a panel value string into pathname and search string components.

```tsx
const { pathname, searchString } = parsePanelValue(panelValue)
```

**Parameters:**

| Name         | Type     | Description                                        |
| ------------ | -------- | -------------------------------------------------- |
| `panelValue` | `string` | Panel value from URL (e.g., `/categories?skip=10`) |

**Returns:**

```typescript
{
  pathname: string // e.g., '/categories'
  searchString: string // e.g., '?skip=10' or ''
}
```

**Example:**

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

Builds a panel value string from pathname and search params.

```tsx
const panelValue = buildPanelValue(pathname, search)
```

**Parameters:**

| Name       | Type                                | Description                      |
| ---------- | ----------------------------------- | -------------------------------- |
| `pathname` | `string`                            | Route path (e.g., `/categories`) |
| `search`   | `Record<string, string>` (optional) | Query parameters                 |

**Returns:**

`string` — Panel value (e.g., `/categories?skip=10`)

**Behavior:**

- Filters out empty string values from search params
- Returns pathname only if no search params
- Encodes search params as query string

**Example:**

```tsx
buildPanelValue('/categories')
// → '/categories'

buildPanelValue('/categories', { skip: '10', limit: '5' })
// → '/categories?skip=10&limit=5'

buildPanelValue('/categories', {})
// → '/categories'

buildPanelValue('/categories', { skip: '10', limit: '' })
// → '/categories?skip=10' (empty string filtered out)
```

---

### resolvePath

Resolves path parameters in a TanStack Router path template.

```tsx
const resolvedPath = resolvePath(to, params)
```

**Parameters:**

| Name     | Type                                | Description                          |
| -------- | ----------------------------------- | ------------------------------------ |
| `to`     | `string`                            | Path template with `$param` segments |
| `params` | `Record<string, string>` (optional) | Parameter values                     |

**Returns:**

`string` — Resolved path with params interpolated

**Throws:**

Error if required parameter is missing

**Behavior:**

- Replaces `$paramName` with corresponding value from params
- URL-encodes parameter values
- Supports multiple params in one path
- Throws descriptive error if param missing

**Example:**

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

## Types

### PanelConfig

Configuration object for creating a panel.

```typescript
interface PanelConfig<TTree extends AnyRoute = AnyRoute> {
  name: string
  tree: TTree
  defaultPath: RoutePaths<TTree> | (string & {})
}
```

**Properties:**

| Property      | Type                     | Description                                |
| ------------- | ------------------------ | ------------------------------------------ |
| `name`        | `string`                 | Unique panel identifier (search param key) |
| `tree`        | `TTree extends AnyRoute` | TanStack Router route tree                 |
| `defaultPath` | `RoutePaths<TTree>`      | Initial path when panel opens              |

---

### PanelInstance

Object returned by `createPanel()`.

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

**Properties:**

| Property      | Type                        | Description            |
| ------------- | --------------------------- | ---------------------- |
| `name`        | `string`                    | Panel identifier       |
| `tree`        | `TTree`                     | Route tree reference   |
| `defaultPath` | `string`                    | Default path           |
| `getRouter`   | `PanelRouterFactory`        | Lazy router factory    |
| `Outlet`      | `React.ComponentType`       | Panel outlet component |
| `Link`        | `PanelLinkComponent<TTree>` | Type-safe Link         |
| `useNav`      | `() => PanelNavReturn`      | Navigation hook        |

---

### PanelSystem

Object returned by `createPanelSystem()`.

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

**Properties:**

| Property          | Type                   | Description                      |
| ----------------- | ---------------------- | -------------------------------- |
| `Provider`        | `React.ComponentType`  | System provider component        |
| `Link`            | `React.ComponentType`  | Multi-panel Link component       |
| `MainLink`        | `React.ComponentType`  | Main router Link (clears panels) |
| `usePanel`        | `() => UsePanelReturn` | Hook for panel controls          |
| `useCurrentPanel` | `() => PanelIdentity`  | Hook for current panel           |
| `validateSearch`  | Function               | Search param validator           |

---

### PanelControl

Control interface for a single panel.

```typescript
interface PanelControl {
  navigate: (to: string, opts?: { search?: Record<string, string> }) => void
  close: () => void
  isOpen: boolean
}
```

---

### PanelIdentity

Identity and navigation methods for current panel.

```typescript
interface PanelIdentity {
  name: string
  navigate: (to: string, opts?: { search?: Record<string, string> }) => void
  close: () => void
}
```

---

### UsePanelReturn

Return type for `usePanel()` hook.

```typescript
type UsePanelReturn<TPanels extends PanelMap> = {
  [K in keyof TPanels]: PanelControl
} & {
  isPanelMode: boolean
  navigateMain: (to: string) => void
}
```

**Example:**

```typescript
// For panels = { left: leftPanel, right: rightPanel }
type MyPanelReturn = {
  left: PanelControl
  right: PanelControl
  isPanelMode: boolean
  navigateMain: (to: string) => void
}
```

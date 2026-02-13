# Panel System Architecture

Deep dive into the implementation, design patterns, and technical decisions behind the panel system library.

## Table of Contents

- [Dual-Router Pattern](#dual-router-pattern)
- [URL Encoding Scheme](#url-encoding-scheme)
- [Context Layering](#context-layering)
- [Lazy Router Initialization](#lazy-router-initialization)
- [Type System Design](#type-system-design)
- [Navigation Flow](#navigation-flow)
- [URL Synchronization](#url-synchronization)
- [Error Handling](#error-handling)

---

## Dual-Router Pattern

### Architecture Overview

The panel system runs multiple TanStack Router instances simultaneously:

1. **Main Router** (Browser History)
   - Owns the browser URL and history
   - Manages normal application routes (`/`, `/users`, etc.)
   - Stores panel state in search parameters
   - Single source of truth for URL state

2. **Panel Routers** (Memory History)
   - Independent router instances per panel
   - Each has its own route tree and navigation state
   - Use in-memory history (don't interact with browser)
   - Synchronized with main router via search params

### Why This Pattern?

**Problem:** TanStack Router's single-router model doesn't support multiple independent navigation contexts in one UI.

**Alternatives Considered:**

1. **Nested Routes** — Doesn't provide independent history stacks
2. **Modal Manager** — Loses URL persistence and bookmarkability
3. **State Management** — Complex synchronization, no type inference

**Solution:** Run separate routers with memory history, synchronize through main router's search params.

### Benefits

- Each panel has independent navigation stack
- Full TanStack Router feature support per panel (loaders, pending, search params)
- Bookmarkable/shareable URLs via search param encoding
- Type-safe navigation with full route inference
- No modification to TanStack Router internals

### Trade-offs

- Requires URL synchronization logic
- Each panel needs separate route tree definition
- Memory routers don't trigger browser back/forward directly (handled via URL sync)
- Small overhead from multiple router instances

---

## URL Encoding Scheme

### Search Parameter Structure

Panel state is encoded as search parameters on the main router:

```
/?left=/categories/phones&right=/posts/5?sort=desc
```

Breaking this down:

```
Main URL: /
Search params:
  - left = /categories/phones
  - right = /posts/5?sort=desc
```

### Panel Value Format

Each panel's value combines pathname and search string:

```typescript
type PanelValue = string // Format: "/path" or "/path?query=params"
```

Examples:

- `/categories` — Simple path
- `/categories/phones` — Path with params
- `/posts?sort=desc` — Path with search
- `/categories/phones?skip=10&limit=20` — Both params and search

### Parsing Logic

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

**Key Decision:** Use string encoding instead of JSON to:

- Keep URLs human-readable
- Support browser history (no escaping issues)
- Simplify copy/paste and debugging
- Match TanStack Router's URL patterns

### Building Panel Values

```typescript
function buildPanelValue(
  pathname: string,
  search?: Record<string, string>,
): string {
  if (!search || Object.keys(search).length === 0) return pathname

  // Filter empty string values
  const filtered = Object.fromEntries(
    Object.entries(search).filter(([, v]) => v !== ''),
  )

  if (Object.keys(filtered).length === 0) return pathname

  const qs = new URLSearchParams(filtered).toString()
  return `${pathname}?${qs}`
}
```

**Why Filter Empty Strings?**

- Clean URLs (no `?key=`)
- Consistent behavior with TanStack Router
- Avoids accidental empty param bugs

---

## Context Layering

The library uses two nested contexts for different purposes:

### Layer 1: PanelSystemContext

Provides system-wide state and navigation methods.

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

**Scope:** Entire application (mounted at root)

**Consumers:**

- `usePanel()` — Get all panel controls
- `Panel.Link` — Compute hrefs, handle clicks
- `System.Link` — Multi-panel navigation
- `Panel.Outlet` — Retrieve panel router

### Layer 2: PanelIdentityContext

Provides panel-specific identity for components inside a panel.

```typescript
interface PanelIdentity {
  name: string
  navigate: (to: string, opts?: {...}) => void
  close: () => void
}
```

**Scope:** Inside each `<Panel.Outlet />` (per panel)

**Consumers:**

- `useCurrentPanel()` — Auto-detect which panel
- Breadcrumbs — Navigate within current panel
- Generic panel components

### Context Diagram

```
<panels.Provider>                     ← PanelSystemContext
  <AppSidebar />                      ← Can use usePanel()
  <PanelLayout>
    <div>
      <leftPanel.Outlet>              ← Wraps in PanelIdentityContext (name='left')
        <CategoriesView>              ← Can use useCurrentPanel()
          <Breadcrumbs />             ← Can use useCurrentPanel()
        </CategoriesView>
      </leftPanel.Outlet>
    </div>
    <div>
      <rightPanel.Outlet>             ← Wraps in PanelIdentityContext (name='right')
        <PostDetailView>              ← Can use useCurrentPanel()
          <Breadcrumbs />             ← Same component, different panel
        </PostDetailView>
      </rightPanel.Outlet>
    </div>
  </PanelLayout>
</panels.Provider>
```

### Why Two Contexts?

**Problem:** Generic components (like Breadcrumbs) need to know which panel they're in without passing props through every level.

**Solution:**

1. `PanelSystemContext` — Global panel state (always available)
2. `PanelIdentityContext` — Panel-specific identity (scoped to each Outlet)

This allows:

- Same Breadcrumbs component in left and right panels
- Auto-detection of current panel context
- No prop drilling through route components

---

## Lazy Router Initialization

### The Problem

Creating all panel routers eagerly would:

- Waste memory for unopened panels
- Slow down initial app load
- Initialize routers before they're needed

### The Solution

Routers are created lazily via factory pattern:

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

**Key Points:**

1. **Singleton Pattern** — `instance` is captured in closure, returns same router on subsequent calls
2. **Lazy Creation** — Router only created on first `getRouter()` call
3. **Initial Path** — Router starts at URL value or `defaultPath`
4. **No Disposal** — Once created, router persists for session (panel can close/reopen without losing state)

### Provider Integration

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
      // Lazy initialization: router created only when first accessed
      return panel.getRouter(panelValue || panel.defaultPath)
    },
    [search],
  )

  // ...
}
```

**Behavior:**

- First call to `getRouter('left')` creates left router
- Subsequent calls return same instance
- Router recreated if provider unmounts/remounts (full page reload)

### Memory Management

**Panel Closed:**

- Router instance persists in memory
- Panel can reopen with preserved navigation state
- Example: User closes right panel, navigates left panel, reopens right → right panel remembers last location

**Page Reload:**

- All routers disposed (React context cleanup)
- New routers created from URL state
- Example: User bookmarks `/?left=/categories/phones`, reloads → left router recreated at `/categories/phones`

---

## Type System Design

### Custom Path Parameter Extraction

TanStack Router's `PathParams` type doesn't work with our phantom router type. We built custom extraction:

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

**How It Works:**

1. **Recursive Pattern Matching** — Extracts all `$param` segments from path
2. **Union Type** — Returns union of all parameter names
3. **Record Construction** — Converts union to `Record<paramName, string>`
4. **Never Fallback** — Paths without params return `Record<string, never>` (empty object type)

**Example:**

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

### Conditional Params Prop

Panel Link types make `params` prop required only when path has parameters:

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

**Type Behavior:**

```typescript
// Path without params: params is optional (and type is `never`)
<leftPanel.Link to="/categories" params={undefined} />  // ✓
<leftPanel.Link to="/categories" />                     // ✓

// Path with params: params is required
<leftPanel.Link to="/categories/$category" />           // ✗ Error
<leftPanel.Link
  to="/categories/$category"
  params={{ category: 'phones' }}                       // ✓
/>
```

### Route Path Inference

We leverage TanStack Router's `RoutePaths` utility:

```typescript
import type { RoutePaths } from '@tanstack/router-core'

type LeftPanelPaths = RoutePaths<typeof leftPanelTree>
// → '/' | '/categories' | '/categories/$category' | '/categories/$category/$productId'
```

**How It Works:**

1. TanStack Router's route tree has full type information
2. `RoutePaths<TTree>` extracts all possible paths as string literal union
3. We constrain `to` prop to this union type
4. TypeScript autocompletes valid paths

**Challenge:** We don't have a real `Router` instance (routers are created lazily), so we can't use `PathParams<Router, Path>`.

**Solution:** Custom `ExtractPathParams` that works directly on path strings.

### Phantom Router Type (Not Used)

Original plan was to create a phantom router type:

```typescript
type PanelRouterType<TTree extends AnyRoute> = RouterCore<
  TTree,
  'never',
  false,
  RouterHistory,
  Record<string, any>
>
```

**Why Abandoned:**

- TanStack Router's internal types changed between versions
- `RouterCore` doesn't expose path utilities in a stable way
- Custom path extraction proved more reliable and version-independent

**Current Approach:**

- Use `RoutePaths<TTree>` for path enumeration (stable API)
- Use custom `ExtractPathParams<TPath>` for parameter extraction
- Don't rely on phantom router type

### Multi-Panel Link Types

System Link uses mapped types to support dynamic panel names:

```typescript
type SystemLinkProps<TPanels extends PanelMap> = {
  [K in keyof TPanels]?: PanelLinkTarget<TPanels[K]['tree']>
} & { children?: React.ReactNode; className?: string }

type PanelLinkTarget<TTree extends AnyRoute> =
  | RoutePaths<TTree>                                // String shorthand
  | { to: RoutePaths<TTree>; params?: ...; search?: ... }  // Object with params
  | false                                            // Close panel
```

**Example:**

```typescript
// For panels = { left: leftPanel, right: rightPanel }
type MySystemLinkProps = {
  left?: RoutePaths<LeftTree> | { to: ..., params?: ..., search?: ... } | false
  right?: RoutePaths<RightTree> | { to: ..., params?: ..., search?: ... } | false
  children?: React.ReactNode
  className?: string
}
```

**Type Safety:**

- Each panel prop has its own route tree inference
- Left panel paths don't autocomplete for right panel (and vice versa)
- TypeScript validates params based on path template

---

## Navigation Flow

### Per-Panel Link Click

```
1. User clicks <leftPanel.Link to="/categories/$cat" params={{ cat: 'phones' }} />

2. Link component:
   ├─> resolvePath('/categories/$cat', { cat: 'phones' })
   │   └─> Returns: '/categories/phones'
   │
   ├─> buildPanelValue('/categories/phones', search)
   │   └─> Returns: '/categories/phones' (or with ?query if search provided)
   │
   └─> Check for modifier keys (ctrl/cmd/shift)
       ├─> Has modifier: Allow browser default (new tab)
       └─> No modifier:
           ├─> preventDefault()
           └─> navigatePanel('left', '/categories/phones')

3. navigatePanel():
   ├─> getRouter('left')
   │   └─> Returns panel router (creates if first access)
   │
   ├─> panelNavigate(router, '/categories/phones')
   │   ├─> Parse panel value: { pathname, searchString }
   │   └─> Call router.navigate({ to: pathname, search: searchParams })
   │
   └─> Update main router search params:
       navigate({
         to: '/',
         search: {
           left: '/categories/phones',  // Updated
           right: search.right,          // Preserved
         }
       })

4. URL becomes: /?left=/categories/phones&right=...

5. Panel router navigates immediately (memory history)

6. Panel component re-renders with new route
```

### System Link Click

```
1. User clicks <panels.Link left="/categories" right={false} />

2. Link component computes href:
   ├─> For each panel prop (left, right):
   │   ├─> undefined: preserve current value
   │   ├─> false: set to undefined (close)
   │   └─> string | object: resolve and set
   │
   └─> mainRouter.buildLocation({ to: '/', search: { left: '/categories', right: undefined } })

3. On click (no modifiers):
   ├─> preventDefault()
   └─> For each specified panel:
       ├─> left='/categories': navigatePanel('left', '/categories')
       └─> right=false: closePanel('right')

4. navigatePanel('left', '/categories'):
   ├─> Panel router navigates
   └─> Main router search updated: { left: '/categories', right: undefined }

5. closePanel('right'):
   └─> Main router search updated: { left: '/categories', right: undefined }

6. URL becomes: /?left=/categories
```

### Programmatic Navigation

```
1. Component calls: panels.usePanel().left.navigate('/categories/phones')

2. usePanel() returns:
   {
     left: {
       navigate: (to, opts) => navigatePanel('left', to, opts),
       close: () => closePanel('left'),
       isOpen: search.left !== undefined,
     },
     // ...
   }

3. navigatePanel('left', '/categories/phones') executes (same as Link flow)

4. Panel router + main router both update

5. URL and panel UI both reflect new state
```

---

## URL Synchronization

### Provider Sync Effect

The Provider synchronizes URL → panel routers via `useLayoutEffect`:

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

      // Only sync if value changed
      if (current && current !== prev) {
        const router = getRouter(name)
        if (router) panelNavigate(router, current)
      }

      prevRefs.current[name] = current
    }
  }, [search, getRouter])
}
```

**Key Points:**

1. **useLayoutEffect** — Runs synchronously before browser paint (prevents flash of old content)
2. **Ref-based Change Detection** — Only syncs when URL actually changed (avoids infinite loops)
3. **Bidirectional Sync** — Both directions work:
   - Link click → updates panel router + URL
   - Browser back/forward → URL changes → syncs to panel router

### Sync Scenarios

**Scenario 1: Panel Link Click**

```
1. User clicks <leftPanel.Link to="/categories" />
2. navigatePanel() updates panel router + URL simultaneously
3. useLayoutEffect sees search param change
4. But panel router already at /categories (idempotent)
5. No additional navigation needed
```

**Scenario 2: Browser Back Button**

```
1. User at: /?left=/categories/phones
2. User clicks browser back
3. URL becomes: /?left=/categories
4. useLayoutEffect detects search.left changed
5. Syncs panel router: panelNavigate(router, '/categories')
6. Panel UI updates to match URL
```

**Scenario 3: Direct URL Entry**

```
1. User types in address bar: /?left=/categories/phones&right=/posts/5
2. Page loads
3. Provider mounts, reads search params
4. getRouter() lazily creates routers at initial paths
5. No sync needed (routers already at correct paths)
```

**Scenario 4: Bookmark/Share**

```
1. User shares: /?left=/categories/phones?skip=10&right=/posts/5
2. Recipient opens URL
3. Provider creates routers:
   - Left: /categories/phones with search { skip: '10' }
   - Right: /posts/5
4. Both panels render at bookmarked state
```

### Why useLayoutEffect?

**Problem with useEffect:**

```
1. URL changes to /?left=/categories
2. Component renders with new search params
3. Panel Outlet renders (but router still at old path)
4. Flash of old content
5. useEffect runs, syncs router
6. Panel re-renders with correct content
```

**Solution with useLayoutEffect:**

```
1. URL changes to /?left=/categories
2. useLayoutEffect runs (before paint)
3. Syncs panel router to /categories
4. Component renders with correct state
5. No flash (browser paints once with correct content)
```

### Change Detection

```typescript
const prevRefs = useRef<Record<string, string | undefined>>({})

useLayoutEffect(() => {
  for (const name of panelNames) {
    const current = search[name]
    const prev = prevRefs.current[name]

    if (current && current !== prev) {
      // Sync logic
    }

    prevRefs.current[name] = current
  }
}, [search, getRouter])
```

**Why Refs?**

- React state would trigger additional re-renders
- Previous values needed for comparison
- Refs provide mutable storage without causing renders

**Why Check `current !== prev`?**

- Avoid redundant navigation calls
- Prevent infinite loops (navigate → URL change → sync → navigate → ...)
- Only sync when URL actually changed

---

## Error Handling

### Missing Context Errors

All hooks throw descriptive errors when used outside their required context:

```typescript
export function useCurrentPanel(): PanelIdentity {
  const ctx = useContext(PanelIdentityContext)
  if (!ctx) {
    throw new Error('useCurrentPanel must be used inside a panel Outlet')
  }
  return ctx
}
```

**When This Triggers:**

```tsx
// ✗ Error: not inside panel Outlet
function SomeComponent() {
  const current = panels.useCurrentPanel() // Throws!
  return <div>...</div>
}

// ✓ Correct: inside panel Outlet
;<leftPanel.Outlet>
  <SomeComponent /> {/* Can call useCurrentPanel() */}
</leftPanel.Outlet>
```

### Missing Path Params

`resolvePath()` throws when required params are missing:

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

**Example:**

```typescript
resolvePath('/categories/$category', {})
// → Error: Missing param "category" for path "/categories/$category". Got params: {}

resolvePath('/categories/$category/$productId', { category: 'phones' })
// → Error: Missing param "productId" for path "/categories/$category/$productId".
//           Got params: {"category":"phones"}
```

**Why Throw Instead of Silent Fallback?**

- Fail fast during development
- Clear error messages aid debugging
- TypeScript prevents this at compile time (errors only at runtime if types bypassed)

### Graceful Degradation

Panel components gracefully handle missing context:

```typescript
function Outlet(): React.ReactElement | null {
  const ctx = useContext(PanelSystemContext)
  if (!ctx) return null  // Silent: don't render if Provider missing

  const router = ctx.getRouter(name)
  if (!router) return null  // Silent: don't render if panel not initialized

  return (
    <PanelIdentityContext.Provider value={{...}}>
      <RouterProvider router={router} />
    </PanelIdentityContext.Provider>
  )
}
```

**Design Decision:**

- Navigation hooks throw (developer error, should fix)
- Render components return `null` (graceful degradation)

### Router Errors

Panel routers inherit TanStack Router's error handling:

- `errorComponent` per route
- Error boundaries catch route errors
- Panel system doesn't intercept router errors

**Example:**

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
    <div>Error: {error.message}</div>
  ),
})
```

Errors in loaders, components, or beforeLoad hooks are handled by TanStack Router's error boundary system.

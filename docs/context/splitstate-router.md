# SplitState Router — Architecture Context

> For AI agents and developers working on this codebase.
> Last updated: 2026-02-12 after panel system library refactor (branch: `tanstack`).

## What This Project Is

A dual-panel navigation system built on TanStack Router v1. Two independent viewports render side-by-side, each with its own route tree and memory history. A main router owns the browser URL and encodes panel state in query params. The right panel is toggleable (hidden by default).

The panel system is implemented as a generic, reusable library (`lib/panel-system/`) supporting N panels, extractable as npm package later.

## Tech Stack

- React 19, TanStack Router v1.157+, TypeScript 5.8 (strict mode)
- Vite 6, Tailwind CSS 4, shadcn/ui (base-nova style, `@base-ui/react` primitives)
- Package manager: bun
- Linting: oxlint, Formatting: oxfmt

## Architecture

```
App.tsx
└── RouterProvider(mainRouter)           ← browser history, owns URL
    └── rootRoute (AppShell)
        └── panels.Provider              ← wraps entire app, manages URL sync
            ├── <AppSidebar>             ← always visible
            │
            ├── isPanelMode=false → <Outlet>
            │   ├── / (HomeView)
            │   ├── /users (UsersView)
            │   └── /users/$userId (UserDetailView)
            │
            ├── isPanelMode=true → <PanelLayout>
            │   ├── leftPanel.Outlet     ← memory router + PanelIdentityContext
            │   │   ├── / (LeftIndex)
            │   │   ├── /categories (CategoriesView)
            │   │   ├── /categories/$category (CategoryProductsView)
            │   │   └── /categories/$category/$productId (ProductDetailView)
            │   │
            │   └── rightPanel.Outlet    ← memory router + PanelIdentityContext
            │       ├── / (PostsListView)
            │       └── /$postId (PostDetailView)
            │
            └── <LogPanel />             ← always visible
```

### Panel System Library (`lib/panel-system/`)

The panel system is a generic library with these key concepts:

**`createPanel(config)`** — Creates a single panel instance:

```tsx
const leftPanel = createPanel({
  name: 'left',
  tree: leftPanelTree,
  defaultPath: '/categories',
})
// Returns: { Outlet, Link, useNav, getRouter, name, tree, defaultPath }
```

**`createPanelSystem(options)`** — Combines panels into a system:

```tsx
const panels = createPanelSystem({
  panels: { left: leftPanel, right: rightPanel },
  onNavigate,
})
// Returns: { Provider, Link, MainLink, usePanel, useCurrentPanel, validateSearch }
```

### Mode Switching

- **Normal mode:** URL is a pathname (`/`, `/users`). Standard TanStack Router behavior.
- **Panel mode:** URL has query params `/?left=/categories`. Presence of `?left` or `?right` triggers panel mode.
- Switching: `isPanelMode = panels.usePanel().isPanelMode`

### URL Schema

```
/                                        → normal mode (home)
/users                                   → normal mode (users)
/?left=/categories                       → panel mode, right panel hidden
/?left=/categories&right=/               → panel mode, right panel visible
/?left=/categories/phones&right=/5       → panel mode, nested routes in both
```

### Right Panel Toggle

- Right panel is **hidden by default** when entering panel mode
- Expand button calls `right.navigate('/')` to open it
- X button calls `right.close()` to hide it
- Visibility controlled by `search.right !== undefined`

### Persistent Elements

- **AppSidebar** — renders in root layout, visible in both modes
- **LogPanel** — renders in root layout below content, visible in both modes
- **panels.Provider** — wraps entire app (always mounted)

## File Structure

### Conventions

| File          | Role                                                                     |
| ------------- | ------------------------------------------------------------------------ |
| `index.tsx`   | Route definition + component (default file for a route directory)        |
| `route.tsx`   | Parent layout route (used when directory also has `index.tsx` for child) |
| `components/` | Local components scoped to this route                                    |
| `<dir>/`      | Child routes as sibling directories (no `routes/` intermediary)          |

### Directory Tree

```
lib/
├── panel-system/                        # generic panel library (8 files)
│   ├── index.ts                         #   barrel export
│   ├── types.ts                         #   all type definitions
│   ├── panel-utils.ts                   #   URL parsing, path resolution, router factory
│   ├── panel-link.tsx                   #   per-panel Link factory
│   ├── create-panel.tsx                 #   createPanel() factory
│   ├── system-provider.tsx              #   Provider + contexts + useCurrentPanel
│   ├── system-link.tsx                  #   multi-panel Link + MainLink factories
│   └── create-panel-system.tsx          #   createPanelSystem() factory
├── panels.ts                            # system instance (left + right + logger)
├── logger.ts                            # Logger singleton, useLogEntries() hook
├── utils.ts                             # cn() utility
├── api-types.ts                         # API response types
└── breadcrumb.ts                        # TanStack Router module augmentation

routes/
├── route.tsx                            # rootRoute, routeTree, mainRouter, Register
├── index.tsx                            # path '/' landing page
├── components/                          # shared across all routes
│   ├── AppShell.tsx                     #   root layout + panels.Provider
│   ├── AppSidebar.tsx                   #   sidebar nav
│   ├── PanelLayout.tsx                  #   panel rendering (Panel + CollapsedPanel UI)
│   ├── Breadcrumbs.tsx                  #   auto-generated breadcrumbs
│   ├── RoutePending.tsx                 #   loading skeleton
│   └── LogPanel.tsx                     #   always-visible log strip
│
├── home/
│   └── index.tsx                        # homeRoute + HomeView (feature status table)
│
├── users/
│   ├── route.tsx                        # usersRoute (layout, Outlet)
│   ├── index.tsx                        # usersIndexRoute (loader) + UsersView
│   └── $userId/
│       └── index.tsx                    # userDetailRoute (loader) + UserDetailView
│
├── left-panel/
│   ├── index.tsx                        # leftPanel instance + leftPanelTree
│   └── routes/categories/
│       ├── route.tsx                    # categoriesRoute (layout)
│       ├── index.tsx                    # categoriesIndexRoute + CategoriesView
│       └── $category/
│           ├── route.tsx                # categoryProductsRoute (layout)
│           ├── index.tsx                # categoryProductsIndexRoute + CategoryProductsView
│           └── routes/$productId/
│               └── index.tsx            # productDetailRoute + ProductDetailView
│
└── right-panel/
    ├── index.tsx                        # rightPanel instance + rightPanelTree
    └── routes/
        ├── posts/
        │   └── index.tsx                # postsRoute + PostsListView
        └── $postId/
            └── index.tsx                # postDetailRoute + PostDetailView
```

### Other Key Files

| File                     | Purpose                                                                          |
| ------------------------ | -------------------------------------------------------------------------------- |
| `App.tsx`                | Entry: `<RouterProvider router={mainRouter} />`                                  |
| `lib/panels.ts`          | Panel system instance: `createPanelSystem({ left, right, onNavigate })`          |
| `lib/logger.ts`          | `Logger` singleton, `useLogEntries()` hook, `beforeLoadLog(cause, route)` helper |
| `lib/utils.ts`           | `cn()` utility (clsx + tailwind-merge)                                           |
| `components/ui/*`        | shadcn/ui components (Button, Separator, Card, Badge, etc.)                      |
| `components/ui/link.tsx` | Main router `Link` wrapper (clears panel search params)                          |

### Component Wiring

Each route file defines both the route and its component in a single file. The component function is declared below `createRoute()` — function hoisting makes it available as a reference, and the route const is initialized by the time the component renders:

```typescript
export const myRoute = createRoute({
  component: MyView,
  loader: async () => { ... },
})

function MyView() {
  const data = myRoute.useLoaderData()
  return <div>...</div>
}
```

Layout routes that only render `<Outlet />` define `component` inline.

## Panel System API

### Per-panel navigation

```tsx
// Type-safe link with autocomplete for paths and params
<leftPanel.Link to='/categories/$category' params={{ category: 'phones' }} />
<leftPanel.Link to='/categories/$category' params={{ category: 'phones' }} search={{ skip: '10' }} />

// Hook for programmatic navigation
const nav = leftPanel.useNav()
nav.navigate('/categories/phones')
nav.navigate('/categories/phones', { search: { skip: '10' } })
nav.close()
nav.isOpen  // boolean
```

### System-level navigation

```tsx
// Multi-panel link (string shorthand for param-free paths, object for params, false to close)
<panels.Link left='/categories' right={false} />
<panels.Link left={{ to: '/categories/$category', params: { category: 'phones' } }} />

// Main router link that clears all panel params
<panels.MainLink to='/users'>Users</panels.MainLink>

// Hook for all panels
const { left, right, isPanelMode, navigateMain } = panels.usePanel()
left.navigate('/categories')
right.close()
navigateMain('/users')
```

### Inside a panel (auto-detect)

```tsx
const current = panels.useCurrentPanel()
current.navigate('/some/path') // navigates the current panel
current.close() // closes the current panel
current.name // 'left' or 'right'
```

## Critical Implementation Details (Gotchas)

### 1. `RoutePaths` import source

```typescript
// WRONG — not re-exported from react-router
import type { RoutePaths } from '@tanstack/react-router'

// CORRECT — must import from router-core
import type { RoutePaths } from '@tanstack/router-core'
```

### 2. Global Register types ALL .navigate() calls

TanStack Router's `declare module` / `Register` interface types every `.navigate()` call against the registered main router — including panel routers with separate route trees.

```typescript
// FAILS — '/categories' is not a main router path
leftRouter.navigate({ to: '/categories' })

// FIX — cast panel router navigate (done internally by panelNavigate utility)
;(leftRouter.navigate as (opts: { to: string }) => void)({ to: '/categories' })
```

### 3. `validateSearch` makes search params required on all `<Link>`

When root route defines `validateSearch`, every `<Link>` must include `search` prop. The `Link` wrapper in `components/ui/link.tsx` handles this by always clearing panel params.

### 4. Panel search callback types

`buildLocation({ search: (prev) => ... })` requires the callback to return `Record<string, string | undefined>`, not `Record<string, unknown>`.

### 5. `strict: true` required in tsconfig

TanStack Router v1.157 requires `strictNullChecks`. Without it:

```
error TS2345: not assignable to "strictNullChecks must be enabled in tsconfig.json"
```

### 6. Panel router sync effects must skip initial mount

Panel routers are created with initial path from URL. The sync `useLayoutEffect` must skip re-navigating to the same path on mount to avoid duplicate `beforeLoad` fires. Uses `prevRefs` pattern.

### 7. `ParsePathParams` is not publicly exported

TanStack Router's `ParsePathParams` type is internal. The panel system uses a custom `ExtractPathParams` type that extracts `$param` segments from path strings.

### 8. `beforeLoadLog` helper for consistent route logging

All routes use `beforeLoadLog(cause, route)` from `lib/logger.ts` instead of inline `if (cause === 'enter')` checks.

### 9. Deep imports use `@/` alias

Files nested 3+ levels deep use the `@/*` tsconfig path alias instead of fragile relative paths.

## Patterns

### Adding a New Main Route

1. Create `routes/<name>/index.tsx` with `createRoute({ getParentRoute: () => rootRoute, component: MyView, ... })`
2. Define the component function in the same file below the route
3. In `routes/route.tsx`: import the route and add to `routeTree.addChildren([...])`

### Adding a New Panel Route

1. Create `routes/<panel>/routes/<name>/index.tsx` with `createRoute` and component
2. In `routes/<panel>/index.tsx`: import the route and add to tree via `.addChildren([...])`
3. Sibling routes go at the same directory level (not nested under each other)

### Adding a New Panel

1. Create `routes/<panel-name>/index.tsx`:
   - Define root route, child routes, assembled tree
   - Call `createPanel({ name: '<name>', tree, defaultPath: '/' })`
   - Export panel instance
2. In `lib/panels.ts`: import the panel and add to `createPanelSystem({ panels: { ..., newPanel } })`
3. In `routes/components/PanelLayout.tsx`: add `<newPanel.Outlet />` rendering
4. URL params are automatically handled by `validateSearch`

### Panel Navigation from Components

```tsx
// Per-panel typed Link (type-safe to/params)
<leftPanel.Link to='/categories/$category' params={{ category: 'phones' }} />

// Multi-panel Link
<panels.Link left='/categories' right={false} />

// Programmatic navigation
const nav = leftPanel.useNav()
nav.navigate('/categories')

// Inside a panel (auto-detect)
const current = panels.useCurrentPanel()
current.navigate('/some/path')
```

## Build & Run

```bash
bun run dev          # Dev server on port 3000
bun run build        # Production build
bunx tsc --noEmit    # Type check
bun run test         # Unit tests
bun run test:types   # Type tests
bun run fix          # Format + lint
```

## Known Issues

1. URLs show `%2F` encoding in query params — functionally correct but visually noisy
2. No error boundaries in panel routers — invalid paths show blank
3. Panel routers recreated on full mode switch round-trip (minor performance)

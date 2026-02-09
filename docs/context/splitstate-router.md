# SplitState Router — Architecture Context

> For AI agents and developers working on this codebase.
> Last updated: 2026-02-01 after adding users routes with loaders (branch: `tanstack`).

## What This Project Is

A dual-panel navigation system built on TanStack Router v1. Two independent viewports render side-by-side, each with its own route tree and memory history. A main router owns the browser URL and encodes panel state in query params. The right panel is toggleable (hidden by default).

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
        ├── <AppSidebar> (Home | Users | Panels)  ← always visible
        │
        ├── isPanelMode=false → <Outlet>
        │   ├── / (IndexPage)
        │   ├── /home (HomeView)
        │   ├── /users (UsersView)              ← loader: json-mock.org
        │   └── /users/$userId (UserDetailView)
        │
        ├── isPanelMode=true → <PanelShell>
        │   └── PanelContext.Provider
        │       ├── RouterProvider(leftRouter)    ← memory history
        │       │   ├── /dash (DashLayout + Outlet)
        │       │   │   ├── / (DashIndex)
        │       │   │   ├── /sub1 (Sub1View)
        │       │   │   └── /sub2 (Sub2View)
        │       │   ├── /users (UsersView)              ← loader: fake.jsonmockapi.com
        │       │   └── /users/$userId (UserDetailView)
        │       │
        │       └── RouterProvider(rightRouter)   ← memory history, conditional
        │           ├── /posts (PostsListView)
        │           └── /posts/$postId (PostDetailView)
        │
        └── <LogPanel />                          ← always visible
```

### Mode Switching

- **Normal mode:** URL is a pathname (`/home`, `/users`). Standard TanStack Router behavior.
- **Panel mode:** URL has query params `/?left=/dash`. Presence of `?left` or `?right` triggers panel mode.
- Switching: `isPanelMode = search.left !== undefined || search.right !== undefined`

### URL Schema

```
/home                                    → normal mode
/?left=/dash                             → panel mode, right panel hidden
/?left=/dash&right=/posts                → panel mode, right panel visible
/?left=/dash/sub1&right=/posts/3         → panel mode, nested routes in both
```

### Right Panel Toggle

- Right panel is **hidden by default** when entering panel mode (`right: undefined`)
- "Show Agent" button in left panel calls `showRight('/posts')` to open it
- Right panel has its own X close button that calls `closeRight()`
- Visibility controlled by `search.right !== undefined`

### Persistent Elements

- **AppSidebar** (Home, Users, Panels) — renders in root layout, visible in both modes
- **LogPanel** — renders in root layout below content, visible in both modes
- `PanelShell` no longer wraps itself in `h-screen` or renders its own LogPanel

## File Structure

### Conventions

| File          | Role                                                                          |
| ------------- | ----------------------------------------------------------------------------- |
| `route.tsx`   | Route definition + component (createRoute with component, beforeLoad, loader) |
| `index.tsx`   | Index route of parent (path `/`) + its component                              |
| `components/` | Local components scoped to this route                                         |
| `routes/`     | Child routes                                                                  |

### Directory Tree

```
routes/
├── route.tsx                          # rootRoute, routeTree, mainRouter, Register
├── index.tsx                          # path '/' landing page (IndexPage)
├── components/                        # shared across all routes
│   ├── AppSidebar.tsx                 #   sidebar nav
│   ├── PanelShell.tsx                 #   dual RouterProvider, URL↔memory sync
│   ├── LogPanel.tsx                   #   always-visible log strip
│   └── panel-links.tsx                #   LinkLeft/LinkRight typed buttons
│
├── home/
│   └── route.tsx                      # homeRoute + HomeView
│
├── users/
│   ├── route.tsx                      # usersRoute (layout, Outlet)
│   ├── index.tsx                      # usersIndexRoute (loader) + UsersView
│   └── routes/
│       └── $userId/
│           └── route.tsx              # userDetailRoute (loader) + UserDetailView
│
├── left-panel/
│   ├── route.tsx                      # leftRoot, leftPanelTree, createLeftRouter
│   └── routes/
│       ├── categories/
│       │   ├── route.tsx              # categoriesRoute (layout, Outlet)
│       │   ├── index.tsx              # categoriesIndexRoute (loader) + CategoriesView
│       │   └── routes/
│       │       └── $category/
│       │           ├── route.tsx      # categoryProductsRoute (layout, Outlet)
│       │           ├── index.tsx      # categoryProductsIndexRoute (loader) + CategoryProductsView
│       │           └── routes/
│       │               └── $productId/
│       │                   └── route.tsx  # productDetailRoute (loader) + ProductDetailView
│       └── users/
│           ├── route.tsx              # usersRoute (layout, Outlet)
│           ├── index.tsx              # usersIndexRoute (loader) + UsersView
│           └── routes/
│               └── $userId/
│                   └── route.tsx      # userDetailRoute (loader) + UserDetailView
│
└── right-panel/
    ├── route.tsx                      # rightRoot, rightPanelTree, createRightRouter
    └── routes/
        └── posts/
            ├── route.tsx              # postsRoute (loader) + PostsListView
            └── routes/
                └── $postId/
                    └── route.tsx      # postDetailRoute (loader) + PostDetailView
```

### Other Key Files

| File                    | Purpose                                                                          |
| ----------------------- | -------------------------------------------------------------------------------- |
| `App.tsx`               | Entry: `<RouterProvider router={mainRouter} />`                                  |
| `lib/panel-context.tsx` | `PanelContext`, `usePanelNav()` hook, `LeftPanelPaths`/`RightPanelPaths` types   |
| `lib/logger.ts`         | `Logger` singleton, `useLogEntries()` hook, `beforeLoadLog(cause, route)` helper |
| `lib/utils.ts`          | `cn()` utility (clsx + tailwind-merge)                                           |
| `components/ui/*`       | shadcn/ui components (Button, Separator, Card, Badge, etc.)                      |

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
// FAILS — '/dash/sub1' is not a main router path
leftRouter.navigate({ to: '/dash/sub1' })

// FIX — cast panel router navigate
;(leftRouter.navigate as (opts: { to: string }) => void)({ to: '/dash/sub1' })
```

### 3. `validateSearch` makes search params required on all `<Link>`

When root route defines `validateSearch`, every `<Link>` must include `search` prop:

```tsx
// FAILS — missing search
<Link to="/home">Home</Link>

// FIX — pass explicit undefined
<Link to="/home" search={{ left: undefined, right: undefined }}>Home</Link>
```

### 4. Exiting panel mode requires clearing search params

```typescript
// WRONG — left/right persist, stays in panel mode
navigate({ to: '/home' })

// FIX — clear search params
navigate({ to: '/home', search: { left: undefined, right: undefined } })
```

### 5. `strict: true` required in tsconfig

TanStack Router v1.157 requires `strictNullChecks`. Without it:

```
error TS2345: not assignable to "strictNullChecks must be enabled in tsconfig.json"
```

### 6. File extensions must be `.tsx` for route files

Route files contain JSX (component functions with `<Outlet />`, `<div>`, etc.). Use `.tsx`, not `.ts`.

### 7. Panel router sync effects must skip initial mount

Panel routers are created with `createLeftRouter(search.left || '/dash')`, so the initial path is already set. The sync `useEffect` must skip re-navigating to the same path on mount to avoid duplicate `beforeLoad` fires:

```typescript
const prevLeftRef = useRef(search.left)

useEffect(() => {
  if (search.left && search.left !== prevLeftRef.current) {
    panelNavigate(leftRouter, search.left)
  }
  prevLeftRef.current = search.left
}, [search.left, leftRouter])
```

Without this, StrictMode + redundant effect navigation causes 3x `beforeLoad` fires per route.

### 8. `beforeLoadLog` helper for consistent route logging

All routes use `beforeLoadLog(cause, route)` from `lib/logger.ts` instead of inline `if (cause === 'enter')` checks:

```typescript
// One-liner for routes without context
beforeLoad: ({ cause }) => beforeLoadLog(cause, 'left:/dash'),

// Inline call for routes that also return context
beforeLoad: ({ cause }) => {
  beforeLoadLog(cause, 'main:/home')
  return { label: '...', description: '...' }
},
```

### 9. Deep imports use `@/` alias

Files nested 3+ levels deep use the `@/*` tsconfig path alias instead of fragile relative paths:

```typescript
// Deep file: routes/left-panel/routes/dash/routes/sub1/route.tsx
import { beforeLoadLog } from '@/lib/logger'
import { dashRoute } from '@/routes/left-panel/routes/dash/route'
```

## Patterns

### Adding a New Main Route

1. Create `routes/<name>/route.tsx` with `createRoute({ getParentRoute: () => rootRoute, component: MyView, ... })`
2. Define the component function in the same file below the route
3. In `routes/route.tsx`: import the route and add to `routeTree.addChildren([...])`

### Adding a New Panel Route

1. Create `routes/<panel>/routes/<name>/route.tsx` with `createRoute` and component
2. In `routes/<panel>/route.tsx`: import the route and add to tree via `.addChildren([...])`

### Adding a New Panel

1. Create `routes/<panel-name>/route.tsx` with root route tree + `createRouter` factory
2. Add panel path type to `lib/panel-context.tsx`
3. Add `navigate<Panel>` / `show<Panel>` / `close<Panel>` to `PanelNavigators` interface
4. Add `Link<Panel>` to `routes/components/panel-links.tsx`
5. Add `<panel>` to `validateSearch` in `routes/route.tsx`
6. Add router creation + sync + render to `routes/components/PanelShell.tsx`

### Cross-Panel Navigation

Components inside any panel use `usePanelNav()` to navigate other panels:

```tsx
const { navigateLeft, navigateRight, showRight, closeRight, navigateMain } =
  usePanelNav()

// Navigate another panel (panel already visible)
navigateRight('/posts/5')

// Show hidden panel
showRight('/posts')

// Hide panel
closeRight()

// Exit panel mode
navigateMain('/home')
```

## Build & Run

```bash
bun run dev          # Dev server on port 3000
bun run build        # Production build
bunx tsc --noEmit    # Type check
```

## Known Issues

1. `components/ui/breadcrumb.tsx` imports missing `@tabler/icons-react` — unused, not blocking
2. URLs show `%2F` encoding in query params — functionally correct but visually noisy
3. No error boundaries in panel routers — invalid paths show blank
4. Panel routers recreated on PanelShell remount (mode switch round-trip)

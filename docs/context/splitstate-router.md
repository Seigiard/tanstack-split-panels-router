# SplitState Router — Architecture Context

> For AI agents and developers working on this codebase.
> Last updated: 2025-01-30 after POC completion (branch: `tanstack`).

## What This Project Is

A dual-panel (soon triple-panel) navigation system built on TanStack Router v1. Two independent viewports render side-by-side, each with its own route tree and memory history. A main router owns the browser URL and encodes panel state in query params.

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
        ├── isPanelMode=false → <nav> + <Outlet>
        │   ├── / (IndexPage)
        │   ├── /home (HomeView)
        │   └── /settings/billing
        │
        └── isPanelMode=true → <PanelShell>
            └── PanelContext.Provider
                ├── RouterProvider(leftRouter)    ← memory history
                │   └── /dash (DashLayout + Outlet)
                │       ├── / (DashIndex)
                │       ├── /sub1 (Sub1View)
                │       └── /sub2 (Sub2View)
                │
                └── RouterProvider(rightRouter)   ← memory history
                    ├── /route1 (Route1View)
                    └── /route2 (Route2View)
```

### Mode Switching

- **Normal mode:** URL is a pathname (`/home`, `/settings/billing`). Standard TanStack Router behavior.
- **Panel mode:** URL has query params `/?left=/dash&right=/route1`. Presence of `?left` or `?right` triggers panel mode.
- Switching: `isPanelMode = search.left !== undefined || search.right !== undefined`

### URL Schema

```
/home                                    → normal mode
/?left=/dash&right=/route1               → panel mode, two panels
/?left=/dash/sub1&right=/route2          → panel mode, nested route in left
```

## Key Files

| File | Purpose |
|------|---------|
| `routes/main.tsx` | Main router: root route with `validateSearch`, AppShell with mode switching, normal routes. Exports `rootRoute` and `mainRouter`. |
| `routes/left-panel.tsx` | Left panel route tree. Exports `leftPanelTree` and `createLeftRouter(initialPath)`. |
| `routes/right-panel.tsx` | Right panel route tree. Exports `rightPanelTree` and `createRightRouter(initialPath)`. |
| `lib/panel-context.tsx` | `PanelContext`, `usePanelNav()` hook, `LeftPanelPaths`/`RightPanelPaths` types. |
| `components/panel-links.tsx` | `LinkLeft`/`LinkRight` — typed buttons for cross-panel navigation. |
| `components/PanelShell.tsx` | Dual `RouterProvider`, URL↔memory sync, `PanelContext.Provider`. |
| `App.tsx` | Entry: `<RouterProvider router={mainRouter} />` |
| `lib/utils.ts` | `cn()` utility (clsx + tailwind-merge) |
| `components/ui/*` | shadcn/ui components (Button, Separator, Card, Badge, etc.) |

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

## Patterns

### Adding a New Panel Route

1. Add `createRoute(...)` to the panel's route tree file
2. Add it to the tree via `.addChildren([...])`
3. Done — types, navigation, rendering auto-update

### Adding a New Panel

1. Create `routes/<panel-name>.tsx` with route tree + `createRouter` factory
2. Add panel path type to `lib/panel-context.tsx`
3. Add `navigate<Panel>` to `PanelNavigators` interface
4. Add `Link<Panel>` to `components/panel-links.tsx`
5. Add `<panel>` to `validateSearch` in `routes/main.tsx`
6. Add router creation + sync + render to `components/PanelShell.tsx`

### Cross-Panel Navigation

Components inside any panel use `usePanelNav()` to navigate other panels:

```tsx
const { navigateLeft, navigateRight, navigateMain } = usePanelNav()

// Navigate another panel
navigateRight('/route2')

// Exit panel mode
navigateMain('/home')
```

## Build & Run

```bash
bun run dev          # Dev server on port 3000
bun run build        # Production build
bunx tsc --noEmit    # Type check (expect breadcrumb.tsx error — pre-existing, not blocking)
```

## Known Issues

1. `components/ui/breadcrumb.tsx` imports missing `@tabler/icons-react` — unused, not blocking
2. URLs show `%2F` encoding in query params — functionally correct but visually noisy
3. No error boundaries in panel routers — invalid paths show blank
4. Panel routers recreated on PanelShell remount (mode switch round-trip)

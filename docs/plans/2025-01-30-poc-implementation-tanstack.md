# POC: Dual-Panel Navigation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Validate Path D architecture — three TanStack Routers (main + left panel + right panel) with typed `<LinkLeft>` / `<LinkRight>`, working `<Outlet>` inside panels, and PanelSync for URL coordination.

**Architecture:** MainRouter owns browser history and URL. LeftRouter and RightRouter use memory history. PanelShell renders two `<RouterProvider>` side by side. PanelContext provides typed cross-panel navigation. URL sync via PanelSync (memory ↔ query params).

**Tech Stack:** React 19, TanStack Router v1, TypeScript 5.8, Vite 6, Tailwind CSS 4, shadcn/ui (base-nova style)

**Ref docs (READ FIRST):**

- `docs/plans/2025-01-30-poc-requirements.md` — full requirements and edge cases
- `docs/plans/2025-01-30-multi-router-panels-research.md` — research, Path D design (section 3.4)

---

## Assumptions

1. `@tanstack/react-router` v1.157+ exports `RoutePaths`, `createMemoryHistory`
2. Multiple `<RouterProvider>` on one page works (confirmed in research)
3. React Context passes through `<RouterProvider>` boundary (confirmed: RouterProvider uses its own routerContext, doesn't block external contexts)
4. `RoutePaths<typeof panelTree>` infers path union from code-based route tree
5. Panel routers use memory history — no browser URL conflict

---

## Task 1: Clean slate — remove current routing

**Files:**

- Delete content: `router.tsx`, `components/Layout.tsx`, `components/Panel.tsx`, `components/PanelNav.tsx`, `views/registry.tsx`
- Keep: `types.ts`, `App.tsx`, `index.tsx`, `index.html`, `index.css`, `lib/utils.ts`, `components/ui/*`

**Step 1: Remove old files**

Delete old routing files. Keep App.tsx but gut it:

```tsx
// App.tsx
import React from 'react'

const App: React.FC = () => {
  return (
    <div className='p-8 text-center text-muted-foreground'>
      POC shell — routing not wired yet
    </div>
  )
}

export default App
```

**Step 2: Verify app loads**

Run: `bun run dev`
Open: `http://localhost:3000/`
Expected: blank page with "POC shell" text, no errors in console

**Step 3: Commit**

```bash
git add -A && git commit -m "chore: clean slate for Path D POC"
```

---

## Task 2: Define panel route trees and routers

**Files:**

- Create: `routes/left-panel.ts`
- Create: `routes/right-panel.ts`

**Step 1: Create left panel route tree**

```typescript
// routes/left-panel.ts
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  Outlet,
} from '@tanstack/react-router'

const leftRoot = createRootRoute({
  component: () => <Outlet />,
})

const dashRoute = createRoute({
  getParentRoute: () => leftRoot,
  path: '/dash',
  component: function DashLayout() {
    return (
      <div className="space-y-4">
        <div className="border border-border rounded-lg p-3 bg-muted/30">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Dash Layout
          </span>
          <Outlet />
        </div>
      </div>
    )
  },
})

const dashIndexRoute = createRoute({
  getParentRoute: () => dashRoute,
  path: '/',
  component: function DashIndex() {
    return <p className="text-muted-foreground py-4">Dash index — select a sub-section</p>
  },
})

const sub1Route = createRoute({
  getParentRoute: () => dashRoute,
  path: '/sub1',
  component: function Sub1View() {
    return <p className="py-4">Sub-section 1 content</p>
  },
})

const sub2Route = createRoute({
  getParentRoute: () => dashRoute,
  path: '/sub2',
  component: function Sub2View() {
    return <p className="py-4">Sub-section 2 content</p>
  },
})

export const leftPanelTree = leftRoot.addChildren([
  dashRoute.addChildren([dashIndexRoute, sub1Route, sub2Route]),
])

export function createLeftRouter(initialPath: string = '/dash') {
  return createRouter({
    routeTree: leftPanelTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}
```

**Step 2: Create right panel route tree**

```typescript
// routes/right-panel.ts
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  Outlet,
} from '@tanstack/react-router'

const rightRoot = createRootRoute({
  component: () => <Outlet />,
})

const route1 = createRoute({
  getParentRoute: () => rightRoot,
  path: '/route1',
  component: function Route1View() {
    return <p className="py-4">Right panel — Route 1</p>
  },
})

const route2 = createRoute({
  getParentRoute: () => rightRoot,
  path: '/route2',
  component: function Route2View() {
    return <p className="py-4">Right panel — Route 2</p>
  },
})

export const rightPanelTree = rightRoot.addChildren([route1, route2])

export function createRightRouter(initialPath: string = '/route1') {
  return createRouter({
    routeTree: rightPanelTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}
```

**Step 3: Verify TypeScript compiles**

Run: `bunx tsc --noEmit`
Expected: no errors (files are not imported yet, but should type-check standalone)

**Step 4: Commit**

```bash
git add routes/ && git commit -m "feat: define left and right panel route trees"
```

---

## Task 3: Define main router with mode switching

**Files:**

- Create: `routes/main.ts`

**Step 1: Create main router**

```typescript
// routes/main.ts
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router'

const rootRoute = createRootRoute({
  component: function AppShell() {
    return <Outlet />
  },
  validateSearch: (search: Record<string, unknown>) => ({
    left: typeof search.left === 'string' ? search.left : undefined,
    right: typeof search.right === 'string' ? search.right : undefined,
  }),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: function IndexPage() {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Split-State Router POC</h1>
        <p className="text-muted-foreground">Normal mode — no panels</p>
      </div>
    )
  },
})

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/home',
  component: function HomeView() {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Home</h1>
        <p className="text-muted-foreground mt-2">Normal route — /home</p>
      </div>
    )
  },
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: function SettingsLayout() {
    return (
      <div className="p-8">
        <h2 className="text-xl font-bold mb-4">Settings</h2>
        <Outlet />
      </div>
    )
  },
})

const billingRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/billing',
  component: function BillingView() {
    return <p className="text-muted-foreground">Billing settings content</p>
  },
})

export { rootRoute }

const routeTree = rootRoute.addChildren([
  indexRoute,
  homeRoute,
  settingsRoute.addChildren([billingRoute]),
])

export const mainRouter = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof mainRouter
  }
}
```

**Step 2: Wire App.tsx**

```tsx
// App.tsx
import React from 'react'
import { RouterProvider } from '@tanstack/react-router'
import { mainRouter } from './routes/main'

const App: React.FC = () => {
  return <RouterProvider router={mainRouter} />
}

export default App
```

**Step 3: Verify main routes work**

Run: `bun run dev`

- Open `http://localhost:3000/` → "Split-State Router POC"
- Open `http://localhost:3000/home` → "Home"
- Open `http://localhost:3000/settings/billing` → "Settings" + "Billing settings content"

**Step 4: Commit**

```bash
git add routes/main.ts App.tsx && git commit -m "feat: main router with normal routes"
```

---

## Task 4: Panel context and typed link components

**Files:**

- Create: `lib/panel-context.tsx`
- Create: `components/panel-links.tsx`

**Step 1: Create PanelContext**

```tsx
// lib/panel-context.tsx
import { createContext, useContext } from 'react'
import type { RoutePaths } from '@tanstack/react-router'
import type { leftPanelTree } from '../routes/left-panel'
import type { rightPanelTree } from '../routes/right-panel'

export type LeftPanelPaths = RoutePaths<typeof leftPanelTree>
export type RightPanelPaths = RoutePaths<typeof rightPanelTree>

export interface PanelNavigators {
  navigateLeft: (to: LeftPanelPaths) => void
  navigateRight: (to: RightPanelPaths) => void
  navigateMain: (to: string) => void
}

export const PanelContext = createContext<PanelNavigators | null>(null)

export function usePanelNav(): PanelNavigators {
  const ctx = useContext(PanelContext)
  if (!ctx) throw new Error('usePanelNav must be used within PanelShell')
  return ctx
}
```

**Step 2: Create LinkLeft and LinkRight**

```tsx
// components/panel-links.tsx
import React from 'react'
import type { LeftPanelPaths, RightPanelPaths } from '../lib/panel-context'
import { usePanelNav } from '../lib/panel-context'
import { Button } from './ui/button'

interface PanelLinkProps<TPaths extends string> {
  to: TPaths
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

export function LinkLeft({
  to,
  children,
  variant = 'outline',
  size = 'sm',
  className,
}: PanelLinkProps<LeftPanelPaths>) {
  const { navigateLeft } = usePanelNav()
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => navigateLeft(to)}
    >
      {children}
    </Button>
  )
}

export function LinkRight({
  to,
  children,
  variant = 'outline',
  size = 'sm',
  className,
}: PanelLinkProps<RightPanelPaths>) {
  const { navigateRight } = usePanelNav()
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => navigateRight(to)}
    >
      {children}
    </Button>
  )
}
```

**Step 3: Verify TypeScript types compile**

Run: `bunx tsc --noEmit`
Expected: no errors. `RoutePaths<typeof leftPanelTree>` should resolve.

> **CRITICAL CHECK:** If `RoutePaths` doesn't resolve to a union type from the panel tree,
> this is a POC failure criterion. Document the error and stop.

**Step 4: Commit**

```bash
git add lib/panel-context.tsx components/panel-links.tsx && git commit -m "feat: PanelContext and typed LinkLeft/LinkRight"
```

---

## Task 5: PanelShell with PanelSync

**Files:**

- Create: `components/PanelShell.tsx`

**Step 1: Create PanelShell**

```tsx
// components/PanelShell.tsx
import React, { useEffect, useMemo, useRef } from 'react'
import { RouterProvider, useSearch } from '@tanstack/react-router'
import { rootRoute, mainRouter } from '../routes/main'
import { createLeftRouter } from '../routes/left-panel'
import { createRightRouter } from '../routes/right-panel'
import { PanelContext, type PanelNavigators } from '../lib/panel-context'
import { Separator } from './ui/separator'

export function PanelShell() {
  const search = useSearch({ from: rootRoute.id })

  const leftRouterRef = useRef(createLeftRouter(search.left || '/dash'))
  const rightRouterRef = useRef(createRightRouter(search.right || '/route1'))
  const leftRouter = leftRouterRef.current
  const rightRouter = rightRouterRef.current

  // Sync URL → memory on search param changes (browser back/forward)
  useEffect(() => {
    if (search.left) {
      leftRouter.navigate({ to: search.left })
    }
  }, [search.left])

  useEffect(() => {
    if (search.right) {
      rightRouter.navigate({ to: search.right })
    }
  }, [search.right])

  const navigators: PanelNavigators = useMemo(
    () => ({
      navigateLeft: (to) => {
        leftRouter.navigate({ to })
        mainRouter.navigate({
          search: (prev) => ({ ...prev, left: to }),
        })
      },
      navigateRight: (to) => {
        rightRouter.navigate({ to })
        mainRouter.navigate({
          search: (prev) => ({ ...prev, right: to }),
        })
      },
      navigateMain: (to) => {
        mainRouter.navigate({ to })
      },
    }),
    [leftRouter, rightRouter],
  )

  return (
    <PanelContext.Provider value={navigators}>
      <div className='flex h-screen w-full overflow-hidden'>
        <div className='flex-1 min-w-0 overflow-y-auto p-4'>
          <h2 className='text-xs font-bold tracking-widest text-muted-foreground uppercase mb-4'>
            Left Panel
          </h2>
          <RouterProvider router={leftRouter} />
        </div>

        <Separator orientation='vertical' />

        <div className='flex-1 min-w-0 overflow-y-auto p-4'>
          <h2 className='text-xs font-bold tracking-widest text-muted-foreground uppercase mb-4'>
            Right Panel
          </h2>
          <RouterProvider router={rightRouter} />
        </div>
      </div>
    </PanelContext.Provider>
  )
}
```

**Step 2: Commit**

```bash
git add components/PanelShell.tsx && git commit -m "feat: PanelShell with PanelSync and PanelContext"
```

---

## Task 6: Wire mode switching in AppShell

**Files:**

- Modify: `routes/main.ts` — update AppShell component

**Step 1: Update AppShell to switch modes**

Modify the `rootRoute` component in `routes/main.ts`:

```tsx
// Replace the AppShell function in rootRoute component:
import { Outlet, Link, useSearch } from '@tanstack/react-router'
import { PanelShell } from '../components/PanelShell'
import { Button } from '../components/ui/button'

function AppShell() {
  const search = useSearch({ from: rootRoute.id })
  const isPanelMode = search.left !== undefined || search.right !== undefined

  if (isPanelMode) {
    return <PanelShell />
  }

  return (
    <div>
      <nav className='flex gap-2 p-4 border-b border-border'>
        <Link to='/home'>
          <Button variant='ghost' size='sm'>
            Home
          </Button>
        </Link>
        <Link to='/settings/billing'>
          <Button variant='ghost' size='sm'>
            Settings
          </Button>
        </Link>
        <Link to='/' search={{ left: '/dash', right: '/route1' }}>
          <Button variant='outline' size='sm'>
            Open Panels
          </Button>
        </Link>
      </nav>
      <Outlet />
    </div>
  )
}
```

**Step 2: Verify mode switching**

- Open `http://localhost:3000/home` → normal mode, nav bar, "Home" content
- Click "Open Panels" → `/?left=/dash&right=/route1` → two panels side by side
- Both panels show their content

**Step 3: Commit**

```bash
git add routes/main.ts && git commit -m "feat: mode switching between normal and panel modes"
```

---

## Task 7: Add navigation controls to panel views

**Files:**

- Modify: `routes/left-panel.ts` — add LinkLeft, LinkRight, and navigation buttons to views
- Modify: `routes/right-panel.ts` — same

**Step 1: Update left panel views with navigation**

Update the component functions in `routes/left-panel.ts` to include:

- Intra-panel navigation (LinkLeft to sibling routes)
- Cross-panel navigation (LinkRight to open something in right panel)
- Exit to normal mode (Link to /home)

Each view should display:

- Its own name/path
- Navigation buttons using `LinkLeft` and `LinkRight`
- A "Go to /home" button to exit panel mode

Use `LinkLeft` from `../components/panel-links` and `Link` from `@tanstack/react-router`.

**Step 2: Update right panel views similarly**

Add `LinkRight` for intra-panel navigation and `LinkLeft` for cross-panel.

**Step 3: Verify all navigation works**

- Open `/?left=/dash&right=/route1`
- Click LinkLeft buttons → `?left=` changes, `?right=` stays
- Click LinkRight buttons → `?right=` changes, `?left=` stays
- Click cross-panel link → correct panel updates
- Click "Go to /home" → exits panel mode

**Step 4: Commit**

```bash
git add routes/ && git commit -m "feat: navigation controls in panel views"
```

---

## Task 8: Validate Outlet nesting in left panel

**Goal:** Confirm `<Outlet>` works inside panel RouterProvider.

**Verification:**

1. Open `/?left=/dash/sub1&right=/route1`
2. Left panel should show: DashLayout wrapper + Sub1View inside it
3. Navigate to `/?left=/dash/sub2` → DashLayout stays, only child swaps
4. Navigate to `/?left=/dash` → DashLayout with index content

If `<Outlet>` does NOT render children → **POC FAILURE**. Document and stop.

**Step 1: Commit verification result**

```bash
git commit --allow-empty -m "verify: Outlet works inside panel RouterProvider"
```

---

## Task 9: Validate type safety

**Goal:** Confirm TypeScript catches invalid paths.

**Step 1: Create type-check test file**

```typescript
// lib/type-check.ts (temporary — delete after verification)
import type { LeftPanelPaths, RightPanelPaths } from './panel-context'

// These should compile:
const validLeft: LeftPanelPaths = '/dash'
const validLeft2: LeftPanelPaths = '/dash/sub1'
const validRight: RightPanelPaths = '/route1'

// These should ERROR:
// @ts-expect-error — invalid left path
const invalidLeft: LeftPanelPaths = '/nonexistent'
// @ts-expect-error — right path used as left
const wrongPanel: LeftPanelPaths = '/route1'
// @ts-expect-error — invalid right path
const invalidRight: RightPanelPaths = '/dash/sub1'
```

**Step 2: Run type checker**

Run: `bunx tsc --noEmit`
Expected: NO errors (the `@ts-expect-error` comments suppress the intentional errors, and TS verifies they ARE errors)

If `RoutePaths` resolves to `string` instead of a union → **POC FAILURE**.

**Step 3: Delete temp file and commit**

```bash
rm lib/type-check.ts
git commit --allow-empty -m "verify: RoutePaths extracts typed union from panel trees"
```

---

## Task 10: Validate browser Back/Forward

**Goal:** Confirm history navigation works across panel mode transitions.

**Verification sequence:**

1. Open `http://localhost:3000/home` (normal mode)
2. Click "Open Panels" → `/?left=/dash&right=/route1`
3. Click a left panel link → `/?left=/dash/sub1&right=/route1`
4. Click browser Back → should go to `/?left=/dash&right=/route1`
5. Click browser Back → should go to `/home`
6. Click browser Forward → should go to `/?left=/dash&right=/route1`

If Back/Forward breaks or shows wrong content → document the issue.
This is not a hard failure — PanelSync might need adjustment.

**Step 1: Commit verification result**

```bash
git commit --allow-empty -m "verify: browser back/forward across mode transitions"
```

---

## Task 11: Validate deep linking and F5

**Goal:** Confirm URL fully describes state.

**Verification:**

1. Open `/?left=/dash/sub2&right=/route2` directly (paste in address bar)
2. Left panel should show DashLayout + Sub2View
3. Right panel should show Route2View
4. Press F5 → same state after refresh

If panels show wrong initial content → check memory history initialization.

**Step 1: Commit verification result**

```bash
git commit --allow-empty -m "verify: deep linking and F5 preserve panel state"
```

---

## Task 12: Clean up old files and final commit

**Files:**

- Delete: `router.tsx` (old single-router setup)
- Delete: `views/registry.tsx` (old view registry)
- Delete: `components/Layout.tsx`, `components/Panel.tsx`, `components/PanelNav.tsx` (old panel components)
- Update: `types.ts` — remove old ViewKey/SearchParams if unused

**Step 1: Remove old files**

```bash
rm -f router.tsx views/registry.tsx components/Layout.tsx components/Panel.tsx components/PanelNav.tsx
```

**Step 2: Update types.ts or remove if unused**

Check if anything still imports from `types.ts`. If not, delete it.

**Step 3: Final commit**

```bash
git add -A && git commit -m "chore: remove old single-router files, POC complete"
```

---

## Summary of POC Validation Points

| #   | What             | Pass Criterion                                   | Fail → Stop |
| --- | ---------------- | ------------------------------------------------ | :---------: |
| 8   | Outlet in panels | DashLayout wraps Sub1View via Outlet             |     YES     |
| 9   | Type safety      | RoutePaths extracts union, ts-expect-error works |     YES     |
| 10  | Back/Forward     | History restores panel state                     |     no      |
| 11  | Deep linking     | Direct URL opens correct state                   |     no      |
| —   | PanelContext     | usePanelNav() works inside RouterProvider        |     YES     |
| —   | Cross-nav        | LinkRight inside left panel updates right        |     YES     |

---

## Implementation Results (2025-01-30)

> **Status: POC COMPLETE — ALL VALIDATIONS PASS**
> **Branch:** `tanstack` (12 commits from `master`)

### Validation Results

| #   | What             | Result   | Notes                                                                              |
| --- | ---------------- | -------- | ---------------------------------------------------------------------------------- |
| 8   | Outlet in panels | **PASS** | DashLayout wraps children, child swap works, index route works                     |
| 9   | Type safety      | **PASS** | `RoutePaths` resolves to typed union, `@ts-expect-error` confirmed 3 invalid paths |
| 10  | Back/Forward     | **PASS** | `/home` → panels → sub1 → Back → Back → Forward all correct                        |
| 11  | Deep linking     | **PASS** | Direct URL `/?left=/dash/sub2&right=/route2` + F5 both preserve state              |
| —   | PanelContext     | **PASS** | `usePanelNav()` works inside panel `RouterProvider` boundaries                     |
| —   | Cross-nav        | **PASS** | `LinkRight` in left panel updates right panel, `LinkLeft` in right updates left    |

### Corrections to Plan (Deviations from Original)

#### 1. File extensions: `.tsx` not `.ts`

**Plan said:** `routes/left-panel.ts`, `routes/right-panel.ts`, `routes/main.ts`
**Actual:** `.tsx` — files contain JSX (component functions with `<Outlet />`, `<div>`, etc.)

#### 2. `RoutePaths` import source

**Plan said:** `import type { RoutePaths } from '@tanstack/react-router'`
**Actual:** `import type { RoutePaths } from '@tanstack/router-core'`

`RoutePaths` is defined in `@tanstack/router-core` (`routeInfo.js` module) but is **not re-exported** from `@tanstack/react-router`. Must import from `router-core` directly.

#### 3. `strict` mode required in tsconfig.json

**Not in plan.** TanStack Router v1.157 requires `strictNullChecks: true` (or `strict: true`). Without it, `createRouter()` produces a type error: `not assignable to "strictNullChecks must be enabled in tsconfig.json"`.

**Fix applied:** Added `"strict": true` to `tsconfig.json`. Also required adding `@types/react` and `@types/react-dom` as dev dependencies.

#### 4. Panel router `.navigate()` type conflict with global Register

**Plan's PanelShell code** called `leftRouter.navigate({ to })` and `mainRouter.navigate({ search: ... })` directly.

**Problem:** TanStack Router's `declare module` / `Register` interface types **all** `.navigate()` calls against the registered main router's route tree — including panel routers that have their own separate trees. So `leftRouter.navigate({ to: '/dash/sub1' })` fails because `/dash/sub1` is not a main router path.

**Fix applied:** Cast panel router navigate:

```typescript
;(leftRouter.navigate as (opts: { to: string }) => void)({ to })
```

For main router search updates, use `useNavigate()` hook with explicit search object instead of spread:

```typescript
navigate({ to: '/', search: { left: to, right: search.right || '/route1' } })
```

#### 5. `validateSearch` makes search params required on all `<Link>`

**Plan's Link code:** `<Link to="/home">` (no search prop)

**Problem:** When root route has `validateSearch` returning `{ left, right }`, TanStack Router requires **all** `<Link>` components to pass a `search` prop — even for normal-mode links that don't use panels.

**Fix applied:**

```tsx
<Link to="/home" search={{ left: undefined, right: undefined }}>
```

#### 6. `navigateMain` needs search params cleared

**Plan said:** `mainRouter.navigate({ to })`

**Problem:** Navigating to a normal route from panel mode needs to clear search params, otherwise `left`/`right` persist and the app stays in panel mode.

**Fix applied:**

```typescript
navigate({ to: to as '/', search: { left: undefined, right: undefined } })
```

### Architecture (Final, Verified)

```
App.tsx
└── RouterProvider(mainRouter)          ← browser history, owns URL
    └── rootRoute (AppShell)
        ├── isPanelMode=false → <nav> + <Outlet>
        │   ├── / (IndexPage)
        │   ├── /home (HomeView)
        │   └── /settings → /settings/billing
        │
        └── isPanelMode=true → <PanelShell>
            └── PanelContext.Provider
                ├── RouterProvider(leftRouter)   ← memory history
                │   └── /dash (DashLayout + Outlet)
                │       ├── / (DashIndex)
                │       ├── /sub1 (Sub1View)
                │       └── /sub2 (Sub2View)
                │
                └── RouterProvider(rightRouter)  ← memory history
                    ├── /route1 (Route1View)
                    └── /route2 (Route2View)
```

### Key Files (Final)

| File                         | Purpose                                                                                  |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| `routes/main.tsx`            | Main router: root route with validateSearch, AppShell with mode switching, normal routes |
| `routes/left-panel.tsx`      | Left panel route tree with DashLayout/Outlet, memory history factory                     |
| `routes/right-panel.tsx`     | Right panel route tree, memory history factory                                           |
| `lib/panel-context.tsx`      | PanelContext, usePanelNav(), LeftPanelPaths/RightPanelPaths types                        |
| `components/panel-links.tsx` | LinkLeft/LinkRight typed buttons                                                         |
| `components/PanelShell.tsx`  | Dual RouterProvider, URL↔memory sync, PanelContext provider                              |
| `App.tsx`                    | Entry: `<RouterProvider router={mainRouter} />`                                          |

### Commit Log

| Hash      | Message                                                  |
| --------- | -------------------------------------------------------- |
| `4f63b17` | chore: clean slate for Path D POC                        |
| `201a016` | feat: define left and right panel route trees            |
| `7d768fa` | feat: main router with normal routes                     |
| `8bb3fbf` | feat: PanelContext and typed LinkLeft/LinkRight          |
| `031dcce` | feat: PanelShell with PanelSync and PanelContext         |
| `81336cc` | feat: mode switching between normal and panel modes      |
| `f43b6be` | feat: navigation controls in panel views                 |
| `578ab4f` | verify: Outlet works inside panel RouterProvider         |
| `11b9ebe` | verify: RoutePaths extracts typed union from panel trees |
| `c90bc3a` | verify: browser back/forward across mode transitions     |
| `89fdb39` | verify: deep linking and F5 preserve panel state         |
| `5301898` | chore: remove old single-router files, POC complete      |

### Known Issues / Future Work

1. **Pre-existing:** `components/ui/breadcrumb.tsx` imports `@tabler/icons-react` which is not installed. Not blocking — file is unused.
2. **Panel router re-creation on mode re-entry:** Panel routers are created once via `useRef` in PanelShell. If PanelShell unmounts (exit panel mode) and remounts (re-enter), new routers are created. This is correct behavior for POC but may need optimization for production (router pool / cache).
3. **Search param encoding:** URLs show `%2F` for `/` in query params (`?left=%2Fdash%2Fsub1`). Functionally correct but visually noisy. Could use custom serializer for cleaner URLs.
4. **No error boundaries** in panel routers — invalid panel paths show blank. Production needs 404 handling per panel.

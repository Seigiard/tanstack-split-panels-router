# Panel System Library — Updated Implementation Plan

## Context

The SplitState Router project has a working dual-panel navigation system scattered across 6+ files with hardcoded "left"/"right" panel names. This plan refactors it into a generic, reusable `lib/panel-system/` library supporting N panels, extractable as npm package later.

This plan incorporates feedback from three independent reviews (code, architecture, plan) and 10 resolved design decisions.

## Key Design Decisions (from review)

| #   | Decision                       | Choice                                                       |
| --- | ------------------------------ | ------------------------------------------------------------ |
| 1   | Phantom type validation        | Phase 0 type spike before implementation                     |
| 2   | Provider scope                 | Always mounted (wraps entire app)                            |
| 3   | Panel identity for breadcrumbs | `useCurrentPanel()` hook via Outlet wrapper context          |
| 4   | Test timing                    | Type tests after Phase 1, unit tests alongside Phase 2       |
| 5   | Panel-local search params      | `search` prop in navigate() and Link (mirrors TanStack Link) |
| 6   | Panel control API              | `navigate(path)` + `close()` only (no `show`)                |
| 7   | Migration atomicity            | Atomic (single commit), verify at end                        |
| 8   | isPanelMode                    | Included in `usePanel()` return value                        |
| 9   | Logger                         | Decoupled via `onNavigate` callback on `createPanelSystem`   |
| 10  | File count                     | 8 files (merged context→provider, url+router→utils)          |

## Agreed DX API

### Step 1: Define each panel independently

```tsx
const leftPanel = createPanel({
  name: 'left',
  tree: leftTree,
  defaultPath: '/categories',
})
// leftPanel.Outlet — renders panel's RouterProvider (wrapped in identity context + error boundary)
// leftPanel.Link  — typed Link (to, params, search autocomplete)
// leftPanel.useNav — { navigate, close, isOpen } for this panel only
```

### Step 2: Combine into system

```tsx
const panels = createPanelSystem({
  left: leftPanel,
  right: rightPanel,
  onNavigate: (panel, action, path) =>
    logger.log(`[nav:${panel}] ${action} -> ${path}`),
})
// panels.Provider       — wraps ENTIRE app, manages URL sync + context (lazy router init)
// panels.Link           — multi-panel nav: <panels.Link left='/x' right={false} />
// panels.usePanel       — { left, right, isPanelMode, navigateMain }
// panels.validateSearch  — composable: returns only panel fields, consumer merges own params
// panels.MainLink       — regular Link that clears all panel params
```

### Navigation patterns

```tsx
// Per-panel typed link (with search params mirroring TanStack Link)
<leftPanel.Link to='/categories/$cat' params={{ cat: 'phones' }} search={{ skip: '10' }} />

// Multi-panel link (string | {to, params, search} | false)
<panels.Link left={{ to: '/cat/$id', params: { id: '1' } }} right={false} />

// Hook
const { left, right, isPanelMode, navigateMain } = panels.usePanel()
left.navigate('/categories/phones')           // opens panel if closed + navigates
left.navigate('/categories/phones', { search: { skip: '10' } })
right.close()

// Inside a panel component
const current = useCurrentPanel()             // auto-detects which panel
current.navigate('/some/path')                // breadcrumbs, generic panel components
```

## File Structure (8 files)

```
lib/panel-system/
  index.ts                 — barrel export
  types.ts                 — core generic types + PanelRouterType phantom
  panel-utils.ts           — parsePanelValue, buildPanelValue (internal), createPanelRouter
  create-panel.tsx         — createPanel() factory
  create-panel-system.tsx  — createPanelSystem() factory
  system-provider.tsx      — Provider component + PanelSystemContext + all hooks
  panel-link.tsx           — per-panel Link factory (custom <a>, resolvePath helper)
  system-link.tsx          — multi-panel Link + MainLink factories
```

## Type System Design

### Phantom Router Type

```ts
type PanelRouterType<TTree extends AnyRoute> = RouterCore<
  TTree,
  'never',
  false,
  RouterHistory,
  Record<string, any>
>
```

**Validated in Phase 0 spike.** Must satisfy `AnyRouter` constraint.
Fallback if fails: minimal interface with `routeTree` property.

### Per-panel Link typing (custom `<a>`, NOT TanStack Link)

```ts
type PanelLinkComponent<TTree extends AnyRoute> = <
  const TTo extends RoutePaths<TTree>,
>(props: {
  to: TTo
  params?: PathParams<PanelRouterType<TTree>, TTo>
  search?: Record<string, string>
  children?: React.ReactNode
  className?: string
}) => React.ReactElement
```

Per-panel Link includes `resolvePath(to, params)` helper that:

- Replaces `$paramName` segments with values
- Handles nested params (`/categories/$cat/$productId`)
- Throws at dev time on missing params (not silent `/categories/undefined`)

### Multi-panel Link — mapped types

```ts
type SystemLinkProps<TPanels extends PanelMap> = {
  [K in keyof TPanels]?:
    | RoutePaths<TPanels[K]['tree']>                      // string shorthand (param-free paths only)
    | { to: RoutePaths<...>; params?: ...; search?: ... } // object with params
    | false                                                // close panel
} & { children?: React.ReactNode; className?: string }
```

### usePanel hook

```ts
type UsePanelReturn<TPanels> = {
  [K in keyof TPanels]: {
    navigate: (
      to: PanelPaths<K>,
      opts?: { search?: Record<string, string> },
    ) => void
    close: () => void
    isOpen: boolean
  }
} & { isPanelMode: boolean; navigateMain: (to: string) => void }
```

## Implementation Order

### Phase 0: Type Spike (~30 min)

1. Create `lib/panel-system/__spike__.ts` (temporary file)
2. Define phantom `PanelRouterType<TTree>` using `RouterCore`
3. Verify: `PanelRouterType` satisfies `AnyRouter`
4. Verify: `RoutePaths<PanelRouterType<typeof leftTree>['routeTree']>` = expected union
5. Verify: `PathParams` infers `{ category: string }` from `'/categories/$category'`
6. If fails: implement fallback (minimal interface with `routeTree`)
7. Delete spike file, carry findings into Phase 1

### Phase 1: Foundation

1. Create `lib/panel-system/types.ts` — all type definitions including validated PanelRouterType
2. Create `lib/panel-system/panel-utils.ts` — move `parsePanelValue`/`buildPanelValue` + `createPanelRouter`
3. Create `lib/panel-system/index.ts` — barrel export
4. **Type tests**: validate phantom type, RoutePaths, PathParams, PanelLinkComponent signature

### Phase 2: Core Factories (with unit tests)

5. Create `lib/panel-system/panel-link.tsx` — per-panel Link factory + resolvePath helper
   - Unit test: href computation, param interpolation, click handling
6. Create `lib/panel-system/create-panel.tsx` — createPanel() returns { Outlet, Link, useNav }
   - Outlet wraps RouterProvider in panel identity context + error boundary
7. Create `lib/panel-system/system-provider.tsx` — Provider + PanelSystemContext + hooks
   - Provider reads useSearch(), creates/retrieves panel routers (lazy), runs URL sync
   - Includes: usePanel(), useCurrentPanel(), useIsPanelMode (internal to usePanel)
   - Stores mainRouter ref via useRouter()
   - Unit test: URL sync, navigator behavior
8. Create `lib/panel-system/system-link.tsx` — multi-panel Link + MainLink
9. Create `lib/panel-system/create-panel-system.tsx` — createPanelSystem()
   - Accepts `onNavigate` callback for logging

### Phase 3: Migration (atomic, single commit)

10. Create panel instances: `routes/left-panel/index.tsx` — use createPanel()
11. Create panel instances: `routes/right-panel/index.tsx` — use createPanel()
12. Create system: `lib/panels.ts` — createPanelSystem({ left, right, onNavigate })
13. Update `routes/route.tsx` — use panels.validateSearch (composable)
14. Update root layout — `<panels.Provider>` wraps entire app (in rootRoute component)
15. Extract Panel/CollapsedPanel UI → `routes/components/PanelLayout.tsx`
16. Update all consumers (template-literal → to/params conversion):
    - `routes/left-panel/routes/categories/index.tsx` (LinkLeftPanel → leftPanel.Link)
    - `routes/left-panel/routes/categories/$category/index.tsx` (LinkLeftPanel + usePanelNav + buildPanelValue)
    - `routes/right-panel/routes/posts/index.tsx` (LinkRightPanel → rightPanel.Link)
    - `routes/right-panel/routes/$postId/index.tsx` (LinkRightPanel → rightPanel.Link)
    - `routes/home/index.tsx` (LinkLeftPanel + LinkRightPanel)
    - `routes/components/AppSidebar.tsx` (LinkPanels → panels.Link)
    - `routes/components/Breadcrumbs.tsx` (PanelContext → useCurrentPanel + useMatches)
    - `routes/components/AppShell.tsx` (isPanelMode → panels.usePanel().isPanelMode)
17. Delete old files: `lib/panel-context.tsx`, `routes/components/PanelShell.tsx`
18. Reduce `components/ui/link.tsx` — delete panel link variants, keep or re-export MainLink

### Phase 4: Integration Tests + Docs

19. Update existing `link.test.tsx` and `link.test-d.tsx`
20. Integration tests: full Provider + panel navigation flows
21. Update `docs/context/splitstate-router.md` with new architecture

## Critical Files to Modify

**New (library):**

- `lib/panel-system/*` (8 files)
- `lib/panels.ts` (system instance)
- `routes/components/PanelLayout.tsx` (extracted UI)

**Modified:**

- `routes/route.tsx` — panels.validateSearch
- `routes/left-panel/index.tsx` — createPanel()
- `routes/right-panel/index.tsx` — createPanel()
- `routes/components/AppShell.tsx` — panels.Provider + isPanelMode
- `routes/components/AppSidebar.tsx` — panels.Link
- `routes/components/Breadcrumbs.tsx` — useCurrentPanel + useMatches
- `routes/home/index.tsx` — leftPanel.Link / rightPanel.Link
- All consumer files in left-panel/right-panel routes

**Deleted:**

- `lib/panel-context.tsx`
- `routes/components/PanelShell.tsx`

## Existing Code to Reuse

- `lib/panel-url.ts` → `parsePanelValue`/`buildPanelValue` (move to panel-utils.ts)
- `lib/create-panel-router.ts` → router factory (move to panel-utils.ts)
- `routes/components/PanelShell.tsx` → URL sync logic (proven pattern with ref guards)
- `components/ui/link.tsx` → href computation via mainRouter.buildLocation()

## Notes

- `RoutePaths` must be imported from `@tanstack/router-core` (not react-router)
- Pin `@tanstack/react-router` to `~1.157` — phantom type depends on RouterCore internals
- `buildPanelValue` becomes internal to library (not in public API)
- `defaultPath` serves as: initial router path when no URL value, default for `navigate()` on closed panel
- `RoutePending` component must be accepted as config param (not imported from host app)

## Verification

1. `bunx tsc --noEmit` — type-check passes
2. `bun run test` — all tests pass (type tests, unit tests, integration tests)
3. `bun run dev` — app works identically:
   - Normal mode: home, users pages work, no Provider overhead visible
   - Panel mode: both panels navigate, URL sync, per-panel Links
   - Cross-panel: navigate from left to right, close right, open with navigate
   - Modifier keys: ctrl+click on panel Links opens in new tab (href passthrough)
   - Home page: panel Links in feature table work (Provider always mounted)
   - Breadcrumbs: auto-detect panel, navigate within correct panel
4. `bun run fix` — formatting/linting clean

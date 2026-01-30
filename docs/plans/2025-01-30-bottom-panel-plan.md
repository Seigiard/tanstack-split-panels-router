# Bottom Panel Extension — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a third (bottom) panel with its own memory router, toggled via `?bottom=/logs` search param.

**Layout:**
```
┌──────────────┬──────────────┐
│  Left Panel  │ Right Panel  │
├──────────────┴──────────────┤
│  Bottom Panel          [X]  │
└─────────────────────────────┘
```

**Branch:** `tanstack` (continue from current HEAD)

**Context:** Read `docs/context/splitstate-router.md` for architecture overview and known gotchas.

---

## Task 1: Add `bottom` to main router validateSearch

**Files:** `routes/main.tsx`

**Step 1:** Add `bottom` to `validateSearch` return type:

```tsx
validateSearch: (search: Record<string, unknown>) => ({
  left: typeof search.left === 'string' ? search.left : undefined,
  right: typeof search.right === 'string' ? search.right : undefined,
  bottom: typeof search.bottom === 'string' ? search.bottom : undefined,
})
```

**Step 2:** Update all `<Link>` components in AppShell nav to include `bottom: undefined` in their search prop (same pattern as left/right — validateSearch makes all search params required on `<Link>`).

**Step 3:** Verify: `bunx tsc --noEmit` — no new errors.

**Step 4:** Commit: `feat: add bottom search param to main router`

---

## Task 2: Create bottom panel route tree

**Files:** Create `routes/bottom-panel.tsx`

**Step 1:** Create route tree with single `/logs` route:

```tsx
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  Outlet,
} from '@tanstack/react-router'

const bottomRoot = createRootRoute({
  component: () => <Outlet />,
})

const logsRoute = createRoute({
  getParentRoute: () => bottomRoot,
  path: '/logs',
  component: function LogsView() {
    return (
      <div className="py-2">
        <p className="text-sm font-mono text-muted-foreground">
          [2025-01-30 12:00:01] System initialized<br />
          [2025-01-30 12:00:02] Connected to data source<br />
          [2025-01-30 12:00:03] Panel sync active<br />
          [2025-01-30 12:00:05] Awaiting user input...
        </p>
      </div>
    )
  },
})

export const bottomPanelTree = bottomRoot.addChildren([logsRoute])

export function createBottomRouter(initialPath: string = '/logs') {
  return createRouter({
    routeTree: bottomPanelTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}
```

**Step 2:** Verify: `bunx tsc --noEmit`

**Step 3:** Commit: `feat: bottom panel route tree with /logs route`

---

## Task 3: Extend PanelContext with bottom panel navigation

**Files:** `lib/panel-context.tsx`, `components/panel-links.tsx`

**Step 1:** Update `panel-context.tsx`:

- Import `bottomPanelTree` type
- Add `BottomPanelPaths` type: `RoutePaths<typeof bottomPanelTree>`
- Add to `PanelNavigators`:
  - `navigateBottom: (to: BottomPanelPaths) => void`
  - `closeBottom: () => void`

**Step 2:** Add `LinkBottom` to `panel-links.tsx` — same pattern as LinkLeft/LinkRight.

**Step 3:** Verify: `bunx tsc --noEmit`

**Step 4:** Commit: `feat: extend PanelContext with bottom panel navigation`

---

## Task 4: Update PanelShell to render bottom panel

**Files:** `components/PanelShell.tsx`

**Step 1:** Add bottom router creation:

```tsx
const bottomRouterRef = useRef(
  search.bottom ? createBottomRouter(search.bottom) : null
)
```

Note: bottom router is `null` when `?bottom` is absent. Only create when param exists.

**Step 2:** Add useEffect for bottom sync (same pattern as left/right):

```tsx
useEffect(() => {
  if (search.bottom && bottomRouterRef.current) {
    panelNavigate(bottomRouterRef.current, search.bottom)
  }
}, [search.bottom])
```

**Step 3:** Add `navigateBottom` and `closeBottom` to navigators:

```tsx
navigateBottom: (to) => {
  // Create router if not exists
  if (!bottomRouterRef.current) {
    bottomRouterRef.current = createBottomRouter(to)
  } else {
    panelNavigate(bottomRouterRef.current, to)
  }
  navigate({
    to: '/',
    search: { left: search.left || '/dash', right: search.right || '/route1', bottom: to },
  })
},
closeBottom: () => {
  bottomRouterRef.current = null
  navigate({
    to: '/',
    search: { left: search.left || '/dash', right: search.right || '/route1', bottom: undefined },
  })
},
```

**Step 4:** Update layout JSX — wrap top panels in a flex-col, conditionally render bottom:

```tsx
<PanelContext.Provider value={navigators}>
  <div className="flex flex-col h-screen w-full overflow-hidden">
    {/* Top: left + right */}
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 min-w-0 overflow-y-auto p-4">
        <h2 className="...">Left Panel</h2>
        <RouterProvider router={leftRouter} />
      </div>
      <Separator orientation="vertical" />
      <div className="flex-1 min-w-0 overflow-y-auto p-4">
        <h2 className="...">Right Panel</h2>
        <RouterProvider router={rightRouter} />
      </div>
    </div>

    {/* Bottom (conditional) */}
    {search.bottom && bottomRouterRef.current && (
      <>
        <Separator orientation="horizontal" />
        <div className="h-48 overflow-y-auto p-4 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
              Bottom Panel
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigators.closeBottom()}>
              ✕
            </Button>
          </div>
          <RouterProvider router={bottomRouterRef.current} />
        </div>
      </>
    )}
  </div>
</PanelContext.Provider>
```

**Step 5:** Verify: `bunx tsc --noEmit` + `bun run build`

**Step 6:** Commit: `feat: PanelShell renders conditional bottom panel`

---

## Task 5: Add "Open Logs" button to left panel

**Files:** `routes/left-panel.tsx`

**Step 1:** In DashLayout nav bar, add a button on the right side:

```tsx
const { navigateMain, navigateBottom } = usePanelNav()

// In the flex nav container, add ml-auto to push to right:
<Button variant="secondary" size="sm" className="ml-auto" onClick={() => navigateBottom('/logs')}>
  Logs
</Button>
```

**Step 2:** Verify in browser:
- Open `/?left=/dash&right=/route1` — no bottom panel
- Click "Logs" button in left panel → URL becomes `/?left=/dash&right=/route1&bottom=/logs`
- Bottom panel appears with static log text and X button
- Click X → bottom panel disappears, `?bottom` removed from URL
- Back button restores bottom panel

**Step 3:** Commit: `feat: open logs button in left panel nav`

---

## Task 6: Validate bottom panel

**Goal:** Verify all POC criteria extend to bottom panel.

**Checks:**
1. Deep link: open `/?left=/dash&right=/route1&bottom=/logs` directly — bottom panel shows
2. F5: refresh preserves bottom panel state
3. Back/Forward: open bottom → close → Back restores it
4. Type safety: `navigateBottom('/nonexistent')` should be a TS error

**Step 1:** Run type check and browser verification.

**Step 2:** Commit: `verify: bottom panel deep link, F5, back/forward, type safety`

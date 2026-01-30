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

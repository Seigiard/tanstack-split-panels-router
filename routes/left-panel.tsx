import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  Outlet,
} from '@tanstack/react-router'
import { LinkLeft, LinkRight } from '../components/panel-links'
import { usePanelNav } from '../lib/panel-context'
import { Button } from '../components/ui/button'

const leftRoot = createRootRoute({
  component: () => <Outlet />,
})

const dashRoute = createRoute({
  getParentRoute: () => leftRoot,
  path: '/dash',
  component: function DashLayout() {
    const { navigateMain } = usePanelNav()
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <LinkLeft to="/dash/sub1">Sub 1</LinkLeft>
          <LinkLeft to="/dash/sub2">Sub 2</LinkLeft>
          <LinkLeft to="/dash">Dash Index</LinkLeft>
          <LinkRight to="/route1">Right → Route 1</LinkRight>
          <LinkRight to="/route2">Right → Route 2</LinkRight>
          <Button variant="ghost" size="sm" onClick={() => navigateMain('/home')}>
            Exit → /home
          </Button>
        </div>
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

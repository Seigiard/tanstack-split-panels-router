import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  Outlet,
  useRouteContext,
} from '@tanstack/react-router'
import { LinkLeft } from '../components/panel-links'
import { usePanelNav } from '../lib/panel-context'
import { Button } from '../components/ui/button'
import { beforeLoadLog } from '../lib/logger'

const leftRoot = createRootRoute({
  component: () => <Outlet />,
})

const dashRoute = createRoute({
  getParentRoute: () => leftRoot,
  path: '/dash',
  beforeLoad: ({ cause }) => beforeLoadLog(cause, 'left:/dash'),
  component: function DashLayout() {
    const { navigateMain, showRight } = usePanelNav()
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <LinkLeft to="/dash/sub1">Sub 1</LinkLeft>
          <LinkLeft to="/dash/sub2">Sub 2</LinkLeft>
          <LinkLeft to="/dash">Dash Index</LinkLeft>
          <Button variant="outline" size="sm" onClick={() => showRight('/route1')}>
            Show Agent
          </Button>
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
  beforeLoad: ({ cause }) => beforeLoadLog(cause, 'left:/dash/'),
  component: function DashIndex() {
    return <p className="text-muted-foreground py-4">Dash index — select a sub-section</p>
  },
})

const sub1Route = createRoute({
  getParentRoute: () => dashRoute,
  path: '/sub1',
  beforeLoad: ({ cause }) => {
    beforeLoadLog(cause, 'left:/dash/sub1')
    return { label: '[context] Sub-section 1', tag: '[context] panel-left' }
  },
  component: function Sub1View() {
    const ctx = useRouteContext({ strict: false }) as { label: string; tag: string }
    return (
      <p className="py-4">
        {ctx.label} <span className="text-xs text-muted-foreground">({ctx.tag})</span>
      </p>
    )
  },
})

const sub2Route = createRoute({
  getParentRoute: () => dashRoute,
  path: '/sub2',
  beforeLoad: ({ cause }) => beforeLoadLog(cause, 'left:/dash/sub2'),
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

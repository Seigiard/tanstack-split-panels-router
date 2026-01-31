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
import { beforeLoadLog } from '../lib/logger'

const rightRoot = createRootRoute({
  component: () => <Outlet />,
})

const route1 = createRoute({
  getParentRoute: () => rightRoot,
  path: '/route1',
  beforeLoad: ({ cause }) => beforeLoadLog(cause, 'right:/route1'),
  component: function Route1View() {
    const { navigateMain } = usePanelNav()
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <LinkRight to="/route2">Route 2</LinkRight>
          <LinkLeft to="/dash/sub1">Left → Sub 1</LinkLeft>
          <LinkLeft to="/dash/sub2">Left → Sub 2</LinkLeft>
          <Button variant="ghost" size="sm" onClick={() => navigateMain('/home')}>
            Exit → /home
          </Button>
        </div>
        <p className="py-4">Right panel — Route 1</p>
      </div>
    )
  },
})

const route2 = createRoute({
  getParentRoute: () => rightRoot,
  path: '/route2',
  beforeLoad: ({ cause }) => beforeLoadLog(cause, 'right:/route2'),
  component: function Route2View() {
    const { navigateMain } = usePanelNav()
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <LinkRight to="/route1">Route 1</LinkRight>
          <LinkLeft to="/dash">Left → Dash</LinkLeft>
          <Button variant="ghost" size="sm" onClick={() => navigateMain('/home')}>
            Exit → /home
          </Button>
        </div>
        <p className="py-4">Right panel — Route 2</p>
      </div>
    )
  },
})

export const rightPanelTree = rightRoot.addChildren([route1, route2])

export function createRightRouter(initialPath: string = '/route1') {
  return createRouter({
    routeTree: rightPanelTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

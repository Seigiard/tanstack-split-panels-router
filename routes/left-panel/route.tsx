import {
  createRootRoute,
  createRouter,
  createMemoryHistory,
  Outlet,
} from '@tanstack/react-router'

import { dashIndexRoute } from './routes/dash/index'
import { dashRoute } from './routes/dash/route'
import { sub1Route } from './routes/dash/routes/sub1/route'
import { sub2Route } from './routes/dash/routes/sub2/route'

export const leftRoot = createRootRoute({
  component: () => <Outlet />,
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

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
import { usersRoute } from './routes/users/route'
import { userDetailRoute } from './routes/users/routes/$userId/route'
import { UserDetailView } from './routes/users/routes/$userId/view'
import { UsersView } from './routes/users/view'

export const leftRoot = createRootRoute({
  component: () => <Outlet />,
})

usersRoute.update({ component: UsersView })
userDetailRoute.update({ component: UserDetailView })

export const leftPanelTree = leftRoot.addChildren([
  dashRoute.addChildren([dashIndexRoute, sub1Route, sub2Route]),
  usersRoute,
  userDetailRoute,
])

export function createLeftRouter(initialPath: string = '/dash') {
  return createRouter({
    routeTree: leftPanelTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

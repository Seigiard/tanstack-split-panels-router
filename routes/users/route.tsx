import { createRoute, Outlet } from '@tanstack/react-router'

import { rootRoute } from '@/routes/route'

import { userDetailRoute } from './routes/$userId'

import { usersIndexRoute } from '.'

export const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  staticData: { breadcrumb: 'Users' },
  component: () => <Outlet />,
})

export const usersRouteTree = usersRoute.addChildren([
  usersIndexRoute,
  userDetailRoute,
])

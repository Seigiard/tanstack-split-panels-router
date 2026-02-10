import { createRoute, Outlet } from '@tanstack/react-router'

import { rootRoute } from '@/routes/route'

import { userDetailRoute } from './routes/$userId'

import { usersIndexRoute } from '.'

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  staticData: { breadcrumb: 'Users' },
  component: () => <Outlet />,
})

usersRoute.addChildren([usersIndexRoute, userDetailRoute])

export { usersRoute }

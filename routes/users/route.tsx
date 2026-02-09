import { createRoute, Outlet } from '@tanstack/react-router'

import { rootRoute } from '@/routes/route'

export const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  staticData: { breadcrumb: 'Users' },
  component: () => <Outlet />,
})

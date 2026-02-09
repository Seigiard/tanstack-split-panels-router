import { createRoute, Outlet } from '@tanstack/react-router'

import { leftRoot } from '@/routes/left-panel/route'

export const usersRoute = createRoute({
  getParentRoute: () => leftRoot,
  path: '/users',
  staticData: { breadcrumb: 'Users' },
  component: () => <Outlet />,
})

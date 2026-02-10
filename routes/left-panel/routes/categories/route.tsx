import { createRoute, Outlet } from '@tanstack/react-router'

import { leftRoot } from '@/routes/left-panel'

export const categoriesRoute = createRoute({
  getParentRoute: () => leftRoot,
  path: '/categories',
  staticData: { breadcrumb: 'Categories' },
  component: () => <Outlet />,
})

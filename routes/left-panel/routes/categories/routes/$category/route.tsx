import { createRoute, Outlet } from '@tanstack/react-router'

import { categoriesRoute } from '@/routes/left-panel/routes/categories/route'

export const categoryProductsRoute = createRoute({
  getParentRoute: () => categoriesRoute,
  path: '/$category',
  staticData: {
    breadcrumb: ({ params }) =>
      params.category
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()),
  },
  component: () => <Outlet />,
})

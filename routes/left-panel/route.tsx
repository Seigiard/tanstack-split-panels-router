import { createRootRoute, createRoute, Outlet } from '@tanstack/react-router'

import { createPanelRouter } from '@/lib/create-panel-router'
import { beforeLoadLog } from '@/lib/logger'

import { categoriesIndexRoute } from './routes/categories/index'
import { categoriesRoute } from './routes/categories/route'
import { categoryProductsIndexRoute } from './routes/categories/routes/$category/index'
import { categoryProductsRoute } from './routes/categories/routes/$category/route'
import { productDetailRoute } from './routes/categories/routes/$category/routes/$productId/route'
import { usersIndexRoute } from './routes/users/index'
import { usersRoute } from './routes/users/route'
import { userDetailRoute } from './routes/users/routes/$userId/route'

export const leftRoot = createRootRoute({
  component: () => <Outlet />,
})

const leftIndexRoute = createRoute({
  getParentRoute: () => leftRoot,
  path: '/',
  beforeLoad: ({ cause }) => beforeLoadLog(cause, 'left:/'),
  component: function LeftIndex() {
    return (
      <p className='py-4 text-muted-foreground'>
        Select a section from the sidebar
      </p>
    )
  },
})

export const leftPanelTree = leftRoot.addChildren([
  leftIndexRoute,
  categoriesRoute.addChildren([
    categoriesIndexRoute,
    categoryProductsRoute.addChildren([
      categoryProductsIndexRoute,
      productDetailRoute,
    ]),
  ]),
  usersRoute.addChildren([usersIndexRoute, userDetailRoute]),
])

export const getLeftRouter = createPanelRouter(leftPanelTree)

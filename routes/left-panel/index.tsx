import { createRootRoute, createRoute, Outlet } from '@tanstack/react-router'

import { createPanelRouter } from '@/lib/create-panel-router'
import { beforeLoadLog } from '@/lib/logger'

import { categoryProductsIndexRoute } from './routes/categories/$category/index'
import { categoryProductsRoute } from './routes/categories/$category/route'
import { productDetailRoute } from './routes/categories/$category/routes/$productId'
import { categoriesIndexRoute } from './routes/categories/index'
import { categoriesRoute } from './routes/categories/route'

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
])

export const getLeftRouter = createPanelRouter(leftPanelTree)

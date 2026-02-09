import { createRootRoute, createRoute, Outlet } from '@tanstack/react-router'

import { createPanelRouter } from '@/lib/create-panel-router'
import { beforeLoadLog } from '@/lib/logger'

import { productDetailRoute } from './categories/$category/$productId'
import { categoryProductsIndexRoute } from './categories/$category/index'
import { categoryProductsRoute } from './categories/$category/route'
import { categoriesIndexRoute } from './categories/index'
import { categoriesRoute } from './categories/route'

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

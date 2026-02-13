import { createRootRoute, createRoute, Outlet } from '@tanstack/react-router'

import { beforeLoadLog } from '@/lib/logger'
import { createPanel } from '@/lib/panel-system'
import { RoutePending } from '@/routes/components/RoutePending'

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
    return <p>Select a section from the sidebar</p>
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

export const leftPanel = createPanel({
  name: 'left',
  tree: leftPanelTree,
  defaultPath: '/categories',
  pendingComponent: RoutePending,
})

export const getLeftRouter = leftPanel.getRouter

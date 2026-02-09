import { createRootRoute, createRoute, Outlet } from '@tanstack/react-router'

import { createPanelRouter } from '@/lib/create-panel-router'
import { beforeLoadLog } from '@/lib/logger'

import { categoriesRoute } from './routes/categories/route'
import { categoryProductsRoute } from './routes/categories/routes/$category/route'
import { productDetailRoute } from './routes/categories/routes/$category/routes/$productId/route'
import { ProductDetailView } from './routes/categories/routes/$category/routes/$productId/view'
import { CategoryProductsView } from './routes/categories/routes/$category/view'
import { CategoriesView } from './routes/categories/view'
import { usersRoute } from './routes/users/route'
import { userDetailRoute } from './routes/users/routes/$userId/route'
import { UserDetailView } from './routes/users/routes/$userId/view'
import { UsersView } from './routes/users/view'

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

categoriesRoute.update({ component: CategoriesView })
categoryProductsRoute.update({ component: CategoryProductsView })
productDetailRoute.update({ component: ProductDetailView })
usersRoute.update({ component: UsersView })
userDetailRoute.update({ component: UserDetailView })

export const leftPanelTree = leftRoot.addChildren([
  leftIndexRoute,
  categoriesRoute,
  categoryProductsRoute,
  productDetailRoute,
  usersRoute,
  userDetailRoute,
])

export const getLeftRouter = createPanelRouter(leftPanelTree)

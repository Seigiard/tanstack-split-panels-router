import type { Product } from '@/lib/api-types'
import { createRoute } from '@tanstack/react-router'

import { beforeLoadLog } from '@/lib/logger'
import { categoryProductsRoute } from '@/routes/left-panel/routes/categories/routes/$category/route'

export const productDetailRoute = createRoute({
  getParentRoute: () => categoryProductsRoute,
  path: '/$productId',
  staticData: {
    breadcrumb: ({ loaderData }) => (loaderData as Product | undefined)?.title,
  },
  beforeLoad: ({ cause, params }) =>
    beforeLoadLog(
      cause,
      `left:/categories/${params.category}/${params.productId}`,
    ),
  loader: async ({ params }): Promise<Product> => {
    const res = await fetch(
      `https://dummyjson.com/products/${params.productId}`,
    )
    return res.json()
  },
})

import type { Product } from '@/lib/api-types'
import { createRoute } from '@tanstack/react-router'

import { beforeLoadLog } from '@/lib/logger'
import { leftRoot } from '@/routes/left-panel/route'

export const productDetailRoute = createRoute({
  getParentRoute: () => leftRoot,
  path: '/categories/$category/$productId',
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

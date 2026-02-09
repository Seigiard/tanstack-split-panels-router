import type { Product } from '@/lib/api-types'
import { createRoute } from '@tanstack/react-router'

import { beforeLoadLog } from '@/lib/logger'
import { leftRoot } from '@/routes/left-panel/route'

export const categoryProductsRoute = createRoute({
  getParentRoute: () => leftRoot,
  path: '/categories/$category',
  beforeLoad: ({ cause, params }) =>
    beforeLoadLog(cause, `left:/categories/${params.category}`),
  loader: async ({ params }): Promise<Product[]> => {
    const res = await fetch(
      `https://dummyjson.com/products/category/${params.category}`,
    )
    const data: { products: Product[] } = await res.json()
    return data.products
  },
})

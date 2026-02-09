import type { Product } from '@/lib/api-types'
import { createRoute } from '@tanstack/react-router'

import { beforeLoadLog } from '@/lib/logger'

import { categoryProductsRoute } from './route'

export type CategorySearch = {
  skip: number
  limit: number
}

export type CategoryProductsData = {
  products: Product[]
  total: number
  skip: number
  limit: number
}

export const categoryProductsIndexRoute = createRoute({
  getParentRoute: () => categoryProductsRoute,
  path: '/',
  validateSearch: (search: Record<string, unknown>): CategorySearch => ({
    skip: Number(search.skip) || 0,
    limit: Number(search.limit) || 10,
  }),
  loaderDeps: ({ search }) => ({
    skip: search.skip,
    limit: search.limit,
  }),
  beforeLoad: ({ cause, params }) =>
    beforeLoadLog(cause, `left:/categories/${params.category}`),
  loader: async ({ deps }): Promise<CategoryProductsData> => {
    const qs = new URLSearchParams()
    qs.set('limit', String(deps.limit))
    qs.set('skip', String(deps.skip))
    qs.set('select', 'title,price')
    const res = await fetch(`https://dummyjson.com/products?${qs}`)
    return res.json()
  },
})

import type { Category } from '@/lib/api-types'
import { createRoute } from '@tanstack/react-router'

import { beforeLoadLog } from '@/lib/logger'

import { categoriesRoute } from './route'

export const categoriesIndexRoute = createRoute({
  getParentRoute: () => categoriesRoute,
  path: '/',
  beforeLoad: ({ cause }) => beforeLoadLog(cause, 'left:/categories'),
  loader: async (): Promise<Category[]> => {
    const res = await fetch('https://dummyjson.com/products/categories')
    return res.json()
  },
})

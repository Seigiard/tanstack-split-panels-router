import type { Category } from '@/lib/api-types'
import { createRoute } from '@tanstack/react-router'

import { beforeLoadLog } from '@/lib/logger'
import { leftRoot } from '@/routes/left-panel/route'

export const categoriesRoute = createRoute({
  getParentRoute: () => leftRoot,
  path: '/categories',
  staticData: { breadcrumb: 'Categories' },
  beforeLoad: ({ cause }) => beforeLoadLog(cause, 'left:/categories'),
  loader: async (): Promise<Category[]> => {
    const res = await fetch('https://dummyjson.com/products/categories')
    return res.json()
  },
})

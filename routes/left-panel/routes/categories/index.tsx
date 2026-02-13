import type { Category } from '@/lib/api-types'
import { createRoute } from '@tanstack/react-router'

import { beforeLoadLog } from '@/lib/logger'
import { leftPanel } from '@/routes/left-panel'

import { categoriesRoute } from './route'

export const categoriesIndexRoute = createRoute({
  getParentRoute: () => categoriesRoute,
  path: '/',
  beforeLoad: ({ cause }) => beforeLoadLog(cause, 'left:/categories'),
  loader: async (): Promise<Category[]> => {
    const res = await fetch('https://dummyjson.com/products/categories')
    return res.json()
  },
  component: CategoriesView,
})

function CategoriesView() {
  const categories = categoriesIndexRoute.useLoaderData() as Category[]

  return (
    <div>
      <h3>Categories</h3>
      <ul>
        {categories.map((cat) => (
          <li key={cat.slug}>
            <leftPanel.Link
              to='/categories/$category'
              params={{ category: cat.slug }}
            >
              {cat.name}
            </leftPanel.Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

import type { Category } from '@/lib/api-types'
import { createRoute } from '@tanstack/react-router'

import { beforeLoadLog } from '@/lib/logger'
import { usePanelLoaderData, usePanelRouteContext } from '@/lib/panel-system'
import { leftPanel } from '@/routes/left-panel'

import { categoriesRoute } from './route'

export const categoriesIndexRoute = createRoute({
  getParentRoute: () => categoriesRoute,
  path: '/',
  beforeLoad: ({ cause }) => {
    beforeLoadLog(cause, 'left:/categories')
    return {
      title: 'Categories (injected from beforeLoad)',
    }
  },
  loader: async (): Promise<Category[]> => {
    const res = await fetch('https://dummyjson.com/products/categories')
    return res.json()
  },
  component: CategoriesView,
})

function CategoriesView() {
  const ctx = usePanelRouteContext({ from: categoriesIndexRoute })
  const categories = usePanelLoaderData({ from: categoriesIndexRoute })

  return (
    <>
      <h3>{ctx.title}</h3>
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
    </>
  )
}

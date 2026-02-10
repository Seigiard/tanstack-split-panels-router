import type { Category } from '@/lib/api-types'
import { createRoute } from '@tanstack/react-router'

import { LinkLeftPanel } from '@/components/ui/link'
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
  component: CategoriesView,
})

function CategoriesView() {
  const categories = categoriesIndexRoute.useLoaderData() as Category[]

  return (
    <div className='space-y-1'>
      <h3 className='mb-2 text-sm font-semibold'>Categories</h3>
      <ul className='space-y-1'>
        {categories.map((cat) => (
          <li key={cat.slug}>
            <LinkLeftPanel
              to={`/categories/${cat.slug}`}
              className='block w-full rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted'
            >
              {cat.name}
            </LinkLeftPanel>
          </li>
        ))}
      </ul>
    </div>
  )
}

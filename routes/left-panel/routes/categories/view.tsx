import type { Category } from '@/lib/api-types'

import { LinkLeftPanel } from '@/components/ui/link'

import { categoriesIndexRoute } from './index'

export function CategoriesView() {
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

import type { Product } from '@/lib/api-types'
import { createRoute } from '@tanstack/react-router'

import { beforeLoadLog } from '@/lib/logger'
import { Breadcrumbs } from '@/routes/components/Breadcrumbs'
import { leftPanel } from '@/routes/left-panel'

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
  component: CategoryProductsView,
})

function CategoryProductsView() {
  const data =
    categoryProductsIndexRoute.useLoaderData() as CategoryProductsData
  const search = categoryProductsIndexRoute.useSearch() as CategorySearch
  const { category } = categoryProductsIndexRoute.useParams() as {
    category: string
  }
  const nav = leftPanel.useNav()

  const navigateWithSearch = (overrides: Partial<CategorySearch>) => {
    const merged = { ...search, ...overrides }
    nav.navigate(`/categories/${category}`, {
      search: {
        skip: String(merged.skip),
        limit: String(merged.limit),
      },
    })
  }

  const hasNext = search.skip + search.limit < data.total
  const hasPrev = search.skip > 0
  const showingFrom = data.total > 0 ? search.skip + 1 : 0
  const showingTo = Math.min(search.skip + search.limit, data.total)

  return (
    <div>
      <Breadcrumbs />

      <p>
        {data.total > 0
          ? `Showing ${showingFrom}–${showingTo} of ${data.total}`
          : 'No products found'}
      </p>

      <ul>
        {data.products.map((product) => (
          <li key={product.id}>
            <leftPanel.Link
              to='/categories/$category/$productId'
              params={{ category, productId: String(product.id) }}
            >
              {product.title} — ${product.price}
            </leftPanel.Link>
          </li>
        ))}
      </ul>

      {data.total > search.limit && (
        <div className='pagination'>
          <button
            disabled={!hasPrev}
            onClick={() =>
              navigateWithSearch({
                skip: Math.max(0, search.skip - search.limit),
              })
            }
          >
            Prev
          </button>
          <span>
            Page {Math.floor(search.skip / search.limit) + 1} of{' '}
            {Math.ceil(data.total / search.limit)}
          </span>
          <button
            disabled={!hasNext}
            onClick={() =>
              navigateWithSearch({ skip: search.skip + search.limit })
            }
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

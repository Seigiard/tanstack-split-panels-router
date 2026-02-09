import { Button } from '@/components/ui/button'
import { LinkLeftPanel } from '@/components/ui/link'
import { usePanelNav } from '@/lib/panel-context'
import { buildPanelValue } from '@/lib/panel-url'

import {
  categoryProductsRoute,
  type CategoryProductsData,
  type CategorySearch,
} from './route'

export function CategoryProductsView() {
  const data = categoryProductsRoute.useLoaderData() as CategoryProductsData
  const search = categoryProductsRoute.useSearch() as CategorySearch
  const { category } = categoryProductsRoute.useParams() as {
    category: string
  }
  const { navigateLeft } = usePanelNav()

  const navigateWithSearch = (overrides: Partial<CategorySearch>) => {
    const merged = { ...search, ...overrides }
    navigateLeft(
      buildPanelValue(`/categories/${category}`, {
        skip: String(merged.skip),
        limit: String(merged.limit),
      }),
    )
  }

  const hasNext = search.skip + search.limit < data.total
  const hasPrev = search.skip > 0
  const showingFrom = data.total > 0 ? search.skip + 1 : 0
  const showingTo = Math.min(search.skip + search.limit, data.total)

  return (
    <div className='space-y-3'>
      <div className='flex items-center gap-2'>
        <LinkLeftPanel
          to='/categories'
          className='text-sm text-muted-foreground hover:text-foreground'
        >
          &larr;
        </LinkLeftPanel>
        <h3 className='text-sm font-semibold capitalize'>
          {category.replace(/-/g, ' ')}
        </h3>
      </div>

      <div className='text-xs text-muted-foreground'>
        {data.total > 0
          ? `Showing ${showingFrom}–${showingTo} of ${data.total}`
          : 'No products found'}
      </div>

      <ul className='space-y-1'>
        {data.products.map((product) => (
          <li key={product.id}>
            <LinkLeftPanel
              to={`/categories/${category}/${product.id}`}
              className='flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted'
            >
              <span className='truncate'>{product.title}</span>
              <span className='ml-2 shrink-0 text-muted-foreground'>
                ${product.price}
              </span>
            </LinkLeftPanel>
          </li>
        ))}
      </ul>

      {data.total > search.limit && (
        <div className='flex items-center justify-between'>
          <Button
            variant='outline'
            size='sm'
            disabled={!hasPrev}
            onClick={() =>
              navigateWithSearch({
                skip: Math.max(0, search.skip - search.limit),
              })
            }
          >
            Prev
          </Button>
          <span className='text-xs text-muted-foreground'>
            Page {Math.floor(search.skip / search.limit) + 1} of{' '}
            {Math.ceil(data.total / search.limit)}
          </span>
          <Button
            variant='outline'
            size='sm'
            disabled={!hasNext}
            onClick={() =>
              navigateWithSearch({ skip: search.skip + search.limit })
            }
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

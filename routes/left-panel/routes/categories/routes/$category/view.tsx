import type { Product } from '@/lib/api-types'

import { LinkLeftPanel } from '@/components/ui/link'

import { categoryProductsRoute } from './route'

export function CategoryProductsView() {
  const products = categoryProductsRoute.useLoaderData() as Product[]
  const { category } = categoryProductsRoute.useParams() as {
    category: string
  }

  return (
    <div className='space-y-1'>
      <div className='mb-2 flex items-center gap-2'>
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
      <ul className='space-y-1'>
        {products.map((product) => (
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
    </div>
  )
}

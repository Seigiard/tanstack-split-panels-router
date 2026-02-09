import type { Product } from '@/lib/api-types'

import { LinkLeftPanel } from '@/components/ui/link'

import { productDetailRoute } from './route'

export function ProductDetailView() {
  const product = productDetailRoute.useLoaderData() as Product
  const { category } = productDetailRoute.useParams() as {
    category: string
    productId: string
  }

  return (
    <div className='space-y-4'>
      <LinkLeftPanel
        to={`/categories/${category}`}
        className='inline-flex items-center text-sm text-muted-foreground hover:text-foreground'
      >
        &larr; Back to {category.replace(/-/g, ' ')}
      </LinkLeftPanel>

      <div className='flex gap-3'>
        <img
          src={product.thumbnail}
          alt={product.title}
          className='h-20 w-20 shrink-0 rounded object-cover'
        />
        <div>
          <h3 className='text-sm font-semibold'>{product.title}</h3>
          {product.brand && (
            <p className='text-xs text-muted-foreground'>{product.brand}</p>
          )}
          <p className='mt-1 text-sm font-medium'>${product.price}</p>
          <div className='mt-0.5 text-xs text-muted-foreground'>
            Rating: {product.rating}/5
          </div>
        </div>
      </div>

      <p className='text-sm text-muted-foreground'>{product.description}</p>
    </div>
  )
}

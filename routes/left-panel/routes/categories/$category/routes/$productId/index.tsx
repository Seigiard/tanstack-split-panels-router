import type { Product } from '@/lib/api-types'
import { createRoute } from '@tanstack/react-router'

import { beforeLoadLog } from '@/lib/logger'
import { Breadcrumbs } from '@/routes/components/Breadcrumbs'
import { categoryProductsRoute } from '@/routes/left-panel/routes/categories/$category/route'

export const productDetailRoute = createRoute({
  getParentRoute: () => categoryProductsRoute,
  path: '/$productId',
  staticData: {
    breadcrumb: ({ loaderData }) => (loaderData as Product | undefined)?.title,
  },
  beforeLoad: ({ cause, params }) =>
    beforeLoadLog(
      cause,
      `left:/categories/${params.category}/${params.productId}`,
    ),
  loader: async ({ params }): Promise<Product> => {
    const res = await fetch(
      `https://dummyjson.com/products/${params.productId}`,
    )
    return res.json()
  },
  component: ProductDetailView,
})

function ProductDetailView() {
  const product = productDetailRoute.useLoaderData() as Product

  return (
    <div>
      <Breadcrumbs />

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <img
          src={product.thumbnail}
          alt={product.title}
          className='product-thumb'
        />
        <div>
          <h3>{product.title}</h3>
          {product.brand && <p>{product.brand}</p>}
          <p>${product.price}</p>
          <p>Rating: {product.rating}/5</p>
        </div>
      </div>

      <p>{product.description}</p>
    </div>
  )
}

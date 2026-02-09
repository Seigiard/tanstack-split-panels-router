# Plan 1: Migrate All Endpoints to dummyjson.com

## Goal

Replace 3 separate mock APIs (json-mock.org, fake.jsonmockapi.com, jsonplaceholder.typicode.com) with a single source: `https://dummyjson.com`. Replace left panel todos routes with categories/products hierarchy.

## API Mapping

| Route location                          | Current endpoint                                        | New endpoint                                                    |
| --------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------- |
| Main `/users`                           | `json-mock.org/api/users`                               | `dummyjson.com/users`                                           |
| Main `/users/$userId`                   | `json-mock.org/api/users/{id}`                          | `dummyjson.com/users/{id}`                                      |
| Left `/categories` (was `/todos`)       | `json-mock.org/api/todos`                               | `dummyjson.com/products/categories`                             |
| Left `/categories/$category`            | —                                                       | `dummyjson.com/products/category/{cat}`                         |
| Left `/categories/$category/$productId` | —                                                       | `dummyjson.com/products/{id}`                                   |
| Left `/users`                           | `fake.jsonmockapi.com/users`                            | `dummyjson.com/users`                                           |
| Left `/users/$userId`                   | `fake.jsonmockapi.com/users/{id}`                       | `dummyjson.com/users/{id}`                                      |
| Right `/posts`                          | `jsonplaceholder.typicode.com/posts`                    | `dummyjson.com/posts`                                           |
| Right `/posts/$postId`                  | `jsonplaceholder.typicode.com/posts/{id}` + `/comments` | `dummyjson.com/posts/{id}` + `dummyjson.com/comments/post/{id}` |

## dummyjson Response Shapes

Collections are wrapped: `{ users: [...], total, skip, limit }`. The wrapper key matches the resource name (`users`, `products`, `posts`, `comments`).

Categories endpoint returns a flat array of `{ slug, name, url }`.

Products support query params: `?limit=N&skip=N&select=field1,field2&q=searchterm`.

## Type Changes

```typescript
// dummyjson User (subset of fields we use)
type User = {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  address: {
    address: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  image: string
}

// New: Category
type Category = { slug: string; name: string; url: string }

// New: Product
type Product = {
  id: number
  title: string
  description: string
  price: number
  thumbnail: string
  category: string
  rating: number
  brand: string
}

// dummyjson Post
type Post = {
  id: number
  title: string
  body: string
  userId: number
  tags: string[]
}

// dummyjson Comment
type Comment = {
  id: number
  body: string
  postId: number
  user: { id: number; username: string; fullName: string }
}
```

## Route Structure Changes (Left Panel)

### Delete

```
routes/left-panel/routes/dash/           # entire directory (dash layout, index, sub1, sub2, todos)
```

### Create

```
routes/left-panel/routes/categories/
  route.tsx                              # categoriesRoute, loader: GET /products/categories
  view.tsx                               # CategoriesView — list of category cards/links

routes/left-panel/routes/categories/routes/$category/
  route.tsx                              # categoryProductsRoute, loader: GET /products/category/{cat}?limit&skip&q
  view.tsx                               # CategoryProductsView — product list with search + pagination

routes/left-panel/routes/categories/routes/$category/routes/$productId/
  route.tsx                              # productDetailRoute, loader: GET /products/{id}
  view.tsx                               # ProductDetailView — product card with image, price, description
```

### Update

- `routes/left-panel/route.tsx` — remove dash/todos imports, add categories imports, update tree
- `routes/left-panel/route.tsx` — `leftRoot` component: replace `DashLayout` with simple `Outlet` (or new layout if needed)
- `routes/users/route.tsx` (main) — update type + fetch URL + response parsing
- `routes/left-panel/routes/users/route.tsx` — update type + fetch URL + response parsing
- `routes/right-panel/routes/posts/route.tsx` — update type + fetch URL + response parsing
- `routes/right-panel/routes/posts/routes/$postId/route.tsx` — update type + fetch URL + response parsing
- `routes/components/AppSidebar.tsx` — rename "Todos" link to "Categories"
- `routes/home/view.tsx` — update feature status table if needed
- `lib/panel-context.tsx` — `LeftPanelPaths` will auto-update from new tree
- `components/ui/link.tsx` — sidebar links update (no structural change)

### Response Parsing Pattern

All loaders need to unwrap the collection:

```typescript
// Before (direct array)
const res = await fetch('https://json-mock.org/api/users')
return res.json() // User[]

// After (wrapped response)
const res = await fetch('https://dummyjson.com/users')
const data = await res.json() // { users: User[], total, skip, limit }
return data.users // User[]
```

Categories list is a flat array (no wrapper).

## Steps

1. Create shared types file `lib/api-types.ts` with `User`, `Category`, `Product`, `Post`, `Comment`, `PaginatedResponse<T>`
2. Update main `/users` route — new type, fetch URL, unwrap `data.users`
3. Update main `/users/$userId` route — new type, fetch URL
4. Delete `routes/left-panel/routes/dash/` directory entirely
5. Create `routes/left-panel/routes/categories/` with route + view (loader fetches categories list)
6. Create `routes/left-panel/routes/categories/routes/$category/` with route + view (loader fetches products by category)
7. Create `routes/left-panel/routes/categories/routes/$category/routes/$productId/` with route + view
8. Update `routes/left-panel/route.tsx` — rewire tree with new routes, update `.update()` calls
9. Update left panel `/users` routes — same type/URL changes as main
10. Update right panel `/posts` route — new fetch URL, unwrap `data.posts`
11. Update right panel `/posts/$postId` route — new fetch URLs, unwrap responses
12. Update `AppSidebar.tsx` — "Categories" instead of "Todos" in left panel links
13. Update `dashIndexRoute` replacement — new index for left panel root
14. Run `bun run fix` + `bunx tsc --noEmit`

# Features

Standard TanStack Router patterns that work out of the box in multi-panel mode.

## Loaders

Each route defines a loader that fetches data before the component renders. Works identically in both the main router and panel routers.

```tsx
const categoriesRoute = createRoute({
  loader: async () => {
    const res = await fetch('/api/categories')
    return res.json()
  },
})
```

## Pending UI

While a loader runs, the pending component is shown automatically. Configured globally via defaultPendingMs and defaultPendingComponent.

```tsx
// Right panel posts loader has a 1s delay:
loader: async () => {
  await wait(1000)
  const res = await fetch('/api/posts?limit=30')
  return res.json()
}

// Pending behavior configured on the router:
createRouter({
  defaultPendingMs: 200,
  defaultPendingComponent: RoutePending,
})
```

## Path Params

Dynamic segments like $postId are extracted and passed to loaders and components with full type safety.

```tsx
const postDetailRoute = createRoute({
  path: '/$postId',
  loader: async ({ params }) => {
    const res = await fetch(`/api/posts/${params.postId}`)
    return res.json()
  },
})
```

## Search Params

Typed and validated search params with validateSearch. The loader re-runs when search deps change — pagination, filters, etc.

```tsx
const route = createRoute({
  validateSearch: (search): CategorySearch => ({
    skip: Number(search.skip) || 0,
    limit: Number(search.limit) || 10,
  }),
  loaderDeps: ({ search }) => ({
    skip: search.skip,
    limit: search.limit,
  }),
  loader: async ({ deps }) => {
    return fetch(`/api/products?skip=${deps.skip}&limit=${deps.limit}`)
  },
})
```

## beforeLoad

Pre-render hook for guards, redirects, and context injection. Runs before the loader, available in both main and panel routes.

```tsx
const route = createRoute({
  beforeLoad: ({ cause }) => {
    beforeLoadLog(cause, 'left:/categories')
    return {
      label: 'Categories',
      description: 'Browse product categories',
    }
  },
})
```

## Nested Layouts

Layout routes render an Outlet for child content. The categories layout wraps the index and $category children.

```tsx
// route.tsx — layout
const categoriesRoute = createRoute({
  path: '/categories',
  component: () => <Outlet />,
})

// index.tsx — renders inside the layout
const categoriesIndexRoute = createRoute({
  getParentRoute: () => categoriesRoute,
  path: '/',
  component: CategoriesView,
})
```

## useMatches & Breadcrumbs

useMatches returns the full chain of matched routes. Combined with staticData.breadcrumb, it builds automatic breadcrumb navigation that works in both main and panel contexts.

```tsx
const matches = useMatches()

const crumbs = matches
  .filter((m) => m.staticData.breadcrumb)
  .map((m) => ({
    path: m.pathname,
    label:
      typeof m.staticData.breadcrumb === 'function'
        ? m.staticData.breadcrumb({ params: m.params })
        : m.staticData.breadcrumb,
  }))
```

## Type-Safe Links

Panel links validate the to path and params at compile time, just like standard TanStack Router links.

```tsx
<leftPanel.Link to='/categories/$category' params={{ category: cat.slug }}>
  {cat.name}
</leftPanel.Link>
```

## URL Sync

Panel paths are encoded as query params in the main URL. Bookmarking and sharing preserves the full panel state.

```tsx
// Root route validates panel search params:
const rootRoute = createRootRoute({
  validateSearch: panels.validateSearch,
})

// Resulting URL:
// /?left=%2Fcategories%2Felectronics&right=%2F1
```

## Cross-Panel Navigation

Any component can navigate any panel via the usePanel hook. Open, close, or redirect panels from anywhere in the app.

```tsx
const { left, right } = panels.usePanel()

right.navigate('/posts')
left.close()
```

## Programmatic Navigation

Panel-scoped useNav hook for imperative navigation with search params. Used for pagination, form submissions, etc.

```tsx
const nav = leftPanel.useNav()

nav.navigate(`/categories/${category}`, {
  search: { skip: '0', limit: '10' },
})
```

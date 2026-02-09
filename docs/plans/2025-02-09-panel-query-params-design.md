# Plan 2: Per-Panel Query Params

## Goal

Support query parameters (search, pagination, filters) per panel. Each panel's query param value encodes the full location (path + search string). Panel components can read/write their own search params independently.

## URL Schema

```
Before:  /?left=/categories/electronics&right=/posts
After:   /?left=/categories/electronics?q=phone&skip=10&limit=10&right=/posts

Browser: /?left=%2Fcategories%2Felectronics%3Fq%3Dphone%26skip%3D10%26limit%3D10&right=%2Fposts
```

The main router's `validateSearch` stays the same — `left` and `right` are still `string | undefined`. The strings just now include query params.

## Parsing: `parsePanelValue`

New utility in `lib/panel-url.ts`:

```typescript
import { parsePath } from '@tanstack/react-router'

export function parsePanelValue(value: string): {
  pathname: string
  search: string
} {
  const parsed = parsePath(value)
  return {
    pathname: parsed.pathname,
    search: parsed.search ?? '',
  }
}

export function buildPanelValue(
  pathname: string,
  search?: Record<string, string>,
): string {
  if (!search || Object.keys(search).length === 0) return pathname
  const qs = new URLSearchParams(search).toString()
  return `${pathname}?${qs}`
}
```

## Changes to `PanelShell.tsx`

### Sync: URL -> panel router

Currently `panelNavigate` passes `to` as a string. Needs to parse and pass search:

```typescript
// Before
const panelNavigate = (router: PanelRouter, to: string) => {
  ;(router.navigate as (opts: { to: string }) => void)({ to })
}

// After
const panelNavigate = (router: PanelRouter, panelValue: string) => {
  const { pathname, search } = parsePanelValue(panelValue)
  ;(
    router.navigate as (opts: {
      to: string
      search?: Record<string, string>
    }) => void
  )({
    to: pathname,
    ...(search
      ? { search: Object.fromEntries(new URLSearchParams(search)) }
      : {}),
  })
}
```

### Navigators update

`navigateLeft` and `navigateRight` currently accept a path string. They need to accept search params too:

```typescript
// Option A: accept full encoded string (simplest, matches current API)
navigateLeft: (to: string) => void  // to = '/categories/electronics?q=phone'

// Option B: accept path + search separately
navigateLeft: (to: string, search?: Record<string, string>) => void
```

Recommendation: **Option A** — keep the API simple. Panel components build the full string using `buildPanelValue`. This is consistent with how the hint code works.

### Navigator implementation change

When writing to main URL, navigators already pass `to` as a string — this just now includes the query portion. No structural change needed.

## Changes to `createPanelRouter` factory

`createMemoryHistory` accepts `initialEntries`. If the initial path includes search params, ensure they're parsed:

```typescript
// initialEntries already supports full URL strings like '/categories?q=test'
// createMemoryHistory handles this — no change needed
```

Verify this works; if not, parse and set initial search separately.

## Changes to panel route loaders

Panel route loaders need to receive search params. TanStack Router supports `validateSearch` on any route:

```typescript
// categories/$category/route.tsx
export const categoryProductsRoute = createRoute({
  getParentRoute: () => categoriesRoute, // or leftRoot
  path: '/categories/$category',
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === 'string' ? search.q : undefined,
    skip: typeof search.skip === 'number' ? search.skip : 0,
    limit: typeof search.limit === 'number' ? search.limit : 10,
  }),
  loader: async ({ params, search }) => {
    await wait(500)
    const qs = new URLSearchParams()
    if (search.q) qs.set('q', search.q)
    qs.set('limit', String(search.limit))
    qs.set('skip', String(search.skip))
    const res = await fetch(
      `https://dummyjson.com/products/category/${params.category}?${qs}`,
    )
    const data = await res.json()
    return data // { products: Product[], total, skip, limit }
  },
})
```

## Changes to Link components

`LinkLeftPanel` and `LinkRightPanel` need to support search params in the `to` prop:

```typescript
// The `to` prop already accepts string — just pass full path with search
<LinkLeftPanel to="/categories/electronics?q=phone&skip=10">...</LinkLeftPanel>

// Or add optional search prop for ergonomics:
<LinkLeftPanel to="/categories/electronics" search={{ q: 'phone', skip: '10' }}>
```

Recommendation: support both. The `to` can be a full string (with ?), and an optional `search` prop merges additional params.

### `buildLocation` in links

`LinkLeftPanel` uses `mainRouter.buildLocation` to compute href. The `to` value goes into `search.left` — this already works since it's just a string. No change needed.

## Demo: Category Products Page

The `CategoryProductsView` component demonstrates per-panel query params:

1. **Search input** — types text, updates panel URL with `?q=...`
2. **Pagination** — "Next" / "Prev" buttons update `?skip=...&limit=...`
3. **URL reflects state** — browser shows `/?left=/categories/electronics?q=phone&skip=10&limit=10`

```typescript
// CategoryProductsView uses panel search params
function CategoryProductsView() {
  const { q, skip, limit } = categoryProductsRoute.useSearch()
  const data = categoryProductsRoute.useLoaderData()
  const { navigateLeft } = usePanelNav()
  const { category } = categoryProductsRoute.useParams()

  const handleSearch = (value: string) => {
    navigateLeft(
      buildPanelValue(`/categories/${category}`, {
        q: value,
        skip: '0',
        limit: String(limit),
      }),
    )
  }

  const handleNextPage = () => {
    navigateLeft(
      buildPanelValue(`/categories/${category}`, {
        ...(q ? { q } : {}),
        skip: String(skip + limit),
        limit: String(limit),
      }),
    )
  }

  // render search input + product grid + pagination
}
```

## Steps

1. Create `lib/panel-url.ts` with `parsePanelValue` and `buildPanelValue`
2. Update `PanelShell.tsx` — `panelNavigate` parses search from panel value string
3. Update `PanelShell.tsx` — sync effects compare full panel value (path + search)
4. Verify `createMemoryHistory` handles initial entries with search params; adjust if needed
5. Add `validateSearch` to `categoryProductsRoute` (from Plan 1) with `q`, `skip`, `limit`
6. Update `CategoryProductsView` — add search input + pagination controls using `navigateLeft` + `buildPanelValue`
7. Update `LinkLeftPanel` — optional `search` prop support
8. Test: navigate to `/?left=/categories/electronics?q=phone` — verify loader receives search params
9. Test: change search/pagination — verify URL updates and loader re-fires
10. Run `bun run fix` + `bunx tsc --noEmit`

## Depends On

Plan 1 (dummyjson migration) must be completed first — the demo page (`CategoryProductsView`) uses dummyjson's search/pagination API.

## What Stays the Same

- Root `validateSearch` shape — `left?: string`, `right?: string`
- Panel router architecture (memory history, singleton factory)
- Main router doesn't parse panel search — panels own their search state
- `wait()` delays preserved in loaders

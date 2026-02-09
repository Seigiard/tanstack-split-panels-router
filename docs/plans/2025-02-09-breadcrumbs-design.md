# Plan 3: Route-Based Breadcrumbs

## Goal

Breadcrumb navigation for all routes (left panel + main router) using TanStack Router's `staticData` and `useMatches()`. Static labels for list routes, dynamic labels from loader data for detail routes. Auto-detects panel context for link rendering.

## Type System

Extend `StaticDataRouteOption` globally via module augmentation:

```typescript
// lib/breadcrumb.ts
declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    breadcrumb?:
      | string
      | ((match: { params: Record<string, string>; loaderData: unknown }) => string)
  }
}
```

Routes without `breadcrumb` in `staticData` are skipped in the crumb chain.

## Breadcrumbs Component

Single `<Breadcrumbs />` component in `routes/components/Breadcrumbs.tsx`:

1. `useMatches()` → active route chain
2. Filter to matches with `staticData.breadcrumb`
3. Resolve labels (string literal or function call with `{ params, loaderData }`)
4. Auto-detect `PanelContext` for link type:
   - Panel context present → `navigateLeft(match.pathname)` via `<a>` with click handler
   - No panel context → `<Link to={match.pathname}>` (main router)
5. Last crumb = current page (plain text, no link)
6. Use shadcn `Breadcrumb` primitives from `components/ui/breadcrumb.tsx`

## Route Modifications

### Left Panel

| Route | Path | `staticData.breadcrumb` |
|---|---|---|
| `categoriesRoute` | `/categories` | `'Categories'` |
| `categoryProductsRoute` | `/categories/$category` | `({ params }) => capitalize(params.category)` |
| `productDetailRoute` | `/categories/$category/$productId` | `({ loaderData }) => (loaderData as Product).title` |
| `usersRoute` | `/users` | `'Users'` |
| `userDetailRoute` | `/users/$userId` | `({ loaderData }) => firstName + ' ' + lastName` |

### Main Router

| Route | Path | `staticData.breadcrumb` |
|---|---|---|
| `homeRoute` | `/home` | `'Home'` |
| `usersRoute` | `/users` | `'Users'` |
| `userDetailRoute` | `/users/$userId` | `({ loaderData }) => firstName + ' ' + lastName` |

## View Placement

`<Breadcrumbs />` added per-view (not in layouts). Views that get breadcrumbs:

- `CategoryProductsView` — shows: Categories > Beauty
- `ProductDetailView` — shows: Categories > Beauty > Product Name
- `UsersView` (left + main) — shows: Users (single crumb, still useful as header context)
- `UserDetailView` (left + main) — shows: Users > John Doe

Not added to: index pages, `CategoriesView` (top-level list), `HomeView`.

## Panel Link Auto-Detection

```typescript
const panelNav = useContext(PanelContext)

// For each crumb link:
if (panelNav) {
  // Panel: <a> with onClick → panelNav.navigateLeft(crumb.path)
} else {
  // Main: <Link to={crumb.path} search={{ left: undefined, right: undefined }}>
}
```

## Steps

1. Create `lib/breadcrumb.ts` — module augmentation for `StaticDataRouteOption`
2. Check `components/ui/breadcrumb.tsx` — verify shadcn primitives work (known issue: imports `@tabler/icons-react`)
3. Create `routes/components/Breadcrumbs.tsx` — component with `useMatches`, auto-detect panel context
4. Add `staticData` to left panel routes: `categoriesRoute`, `categoryProductsRoute`, `productDetailRoute`, `usersRoute`, `userDetailRoute`
5. Add `staticData` to main routes: `homeRoute`, `usersRoute`, `userDetailRoute`
6. Add `<Breadcrumbs />` to views: `CategoryProductsView`, `ProductDetailView`, `UsersView` (left+main), `UserDetailView` (left+main)
7. Run `bun run fix` + `bunx tsc --noEmit`
8. Test: navigate to `/users/1` — verify breadcrumb shows "Users > John Doe"
9. Test: navigate to `/?left=/categories/beauty/1` — verify breadcrumb shows "Categories > Beauty > Product Title"

## Depends On

Plan 2 (per-panel query params) — breadcrumb paths in categories include pagination search params.

## What Stays the Same

- Route tree structure — no hierarchy changes
- Loader data shape — breadcrumbs read existing data, don't add fields
- `PanelContext` API — breadcrumbs consume it, don't modify it
- Navigation behavior — breadcrumbs use existing `navigateLeft` / `<Link>`

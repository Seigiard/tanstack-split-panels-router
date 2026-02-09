# Plan 4: Migrate Flat Routes to Nested Structure

## Goal

Replace flat route siblings with proper parent-child nesting. `useMatches()` returns the full ancestor chain, breadcrumbs and layout composition work naturally.

## Current (flat)

```
leftRoot.addChildren([
  /                                    → LeftIndex
  /categories                          → CategoriesView
  /categories/$category                → CategoryProductsView
  /categories/$category/$productId     → ProductDetailView
  /users                               → UsersView
  /users/$userId                       → UserDetailView
])

rootRoute.addChildren([
  /          → IndexPage
  /home      → HomeView
  /users     → UsersView
  /users/$userId → UserDetailView
])
```

All routes: `getParentRoute: () => leftRoot` (or `rootRoute`). Paths are absolute.

## Target (nested)

```
leftRoot
├── / (LeftIndex)
├── /categories (Outlet)                          ← layout route
│   ├── / (CategoriesView)                        ← new index route
│   └── /$category (Outlet)                       ← layout route
│       ├── / (CategoryProductsView)              ← new index route
│       └── /$productId (ProductDetailView)
└── /users (Outlet)                               ← layout route
    ├── / (UsersView)                             ← new index route
    └── /$userId (UserDetailView)

rootRoute
├── / (IndexPage)
├── /home (HomeView)
└── /users (Outlet)                               ← layout route
    ├── / (UsersView)                             ← new index route
    └── /$userId (UserDetailView)
```

## Key Changes Per Route

### Path becomes relative

```typescript
// Before
createRoute({ getParentRoute: () => leftRoot, path: '/categories/$category' })

// After
createRoute({ getParentRoute: () => categoriesRoute, path: '/$category' })
```

### Parent routes become layout routes

Routes that gain children stop rendering their view directly. They render `<Outlet />` instead. Their previous view moves to a new index route (path `/`).

```typescript
// Before: categoriesRoute renders CategoriesView
categoriesRoute.update({ component: CategoriesView })

// After: categoriesRoute renders Outlet, new index renders CategoriesView
export const categoriesRoute = createRoute({
  getParentRoute: () => leftRoot,
  path: '/categories',
  staticData: { breadcrumb: 'Categories' },
  component: () => <Outlet />,
})

export const categoriesIndexRoute = createRoute({
  getParentRoute: () => categoriesRoute,
  path: '/',
  loader: async () => { /* moved from categoriesRoute */ },
  component: CategoriesView,  // wired via .update() or direct
})
```

### Tree assembly uses addChildren

```typescript
// Before (flat)
leftRoot.addChildren([
  categoriesRoute,
  categoryProductsRoute,
  productDetailRoute,
  usersRoute,
  userDetailRoute,
])

// After (nested)
leftRoot.addChildren([
  leftIndexRoute,
  categoriesRoute.addChildren([
    categoriesIndexRoute,
    categoryProductsRoute.addChildren([
      categoryProductsIndexRoute,
      productDetailRoute,
    ]),
  ]),
  usersRoute.addChildren([usersIndexRoute, userDetailRoute]),
])
```

### Breadcrumbs simplify back to useMatches()

After nesting, `useMatches()` on `/categories/beauty/1` returns:
`leftRoot → categoriesRoute → categoryProductsRoute → productDetailRoute`

The `buildCrumbs` workaround in `Breadcrumbs.tsx` can be replaced with a simple `useMatches()` loop again.

## Steps

### Left panel categories

1. Move `categoriesRoute` loader to new `categoriesIndexRoute`, make `categoriesRoute` an Outlet layout
2. Move `categoryProductsRoute` loader/validateSearch to new `categoryProductsIndexRoute`, make `categoryProductsRoute` an Outlet layout
3. Change `categoryProductsRoute.getParentRoute` → `categoriesRoute`, path → `/$category`
4. Change `productDetailRoute.getParentRoute` → `categoryProductsRoute`, path → `/$productId`
5. Create index route files: `routes/categories/index.tsx`, `routes/categories/routes/$category/index.tsx`
6. Update tree assembly in `routes/left-panel/route.tsx` to nested `addChildren`

### Left panel users

7. Move `usersRoute` loader to new `usersIndexRoute`, make `usersRoute` an Outlet layout
8. Change `userDetailRoute.getParentRoute` → `usersRoute`, path → `/$userId`
9. Create `routes/users/index.tsx` (left panel)
10. Update tree assembly

### Main router users

11. Move main `usersRoute` loader to new `usersIndexRoute`, make `usersRoute` an Outlet layout
12. Change main `userDetailRoute.getParentRoute` → `usersRoute`, path → `/$userId`
13. Create `routes/users/index.tsx` (main)
14. Update tree assembly in `routes/route.tsx`

### Breadcrumbs

15. Simplify `Breadcrumbs.tsx` — replace `buildCrumbs` with simple `useMatches()` loop
16. `staticData.breadcrumb` stays on layout routes (not moved to index routes)

### Cleanup & verify

17. Remove unused imports (`LinkLeftPanel` back-links already removed)
18. Run `bun run fix` + `bunx tsc --noEmit` + `bun run build`
19. Test: `/?left=/categories/beauty/1` — verify `useMatches()` returns 4 matches
20. Test: `/users/1` — verify breadcrumbs show "Users > Name"

## New Files

| File                                                             | Role                                         |
| ---------------------------------------------------------------- | -------------------------------------------- |
| `routes/left-panel/routes/categories/index.tsx`                  | Categories list (moved from view.tsx loader) |
| `routes/left-panel/routes/categories/routes/$category/index.tsx` | Products list (moved from view.tsx loader)   |
| `routes/left-panel/routes/users/index.tsx`                       | Users list (moved from view.tsx loader)      |
| `routes/users/index.tsx`                                         | Users list — main router                     |

## What Stays the Same

- Panel architecture (memory history, PanelShell sync)
- API endpoints and data types
- View components (just re-parented to index routes)
- staticData.breadcrumb on layout routes
- LinkLeftPanel, LinkRightPanel, panel-url utilities

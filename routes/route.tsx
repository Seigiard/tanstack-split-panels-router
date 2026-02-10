import { createRootRoute, createRouter } from '@tanstack/react-router'

import { AppShell } from './components/AppShell'
import { RoutePending } from './components/RoutePending'
import { homeRoute } from './home'
import { usersRoute } from './users/route'

export const rootRoute = createRootRoute({
  component: AppShell,
  validateSearch: (search: Record<string, unknown>) => ({
    left: typeof search.left === 'string' ? search.left : undefined,
    right: typeof search.right === 'string' ? search.right : undefined,
  }),
})

const routeTree = rootRoute.addChildren([homeRoute, usersRoute])

export const mainRouter = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPendingComponent: RoutePending,
  defaultPendingMs: 200,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof mainRouter
  }
}

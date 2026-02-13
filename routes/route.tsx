import { createRootRoute, createRouter } from '@tanstack/react-router'

import { panels } from '@/lib/panels'

import { AppShell } from './components/AppShell'
import { RoutePending } from './components/RoutePending'
import { homeRoute } from './home'
import { usersRouteTree } from './users/route'

export const rootRoute = createRootRoute({
  component: AppShell,
  validateSearch: panels.validateSearch,
})

const routeTree = rootRoute.addChildren([homeRoute, usersRouteTree])

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

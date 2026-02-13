import { createRootRoute, createRouter } from '@tanstack/react-router'

import { panels } from '@/lib/panels'

import { AppShell } from './components/AppShell'
import { RoutePending } from './components/RoutePending'
import { docsRouteTree } from './docs/route'
import { homeRoute } from './home'

export const rootRoute = createRootRoute({
  component: AppShell,
  validateSearch: panels.validateSearch,
})

const routeTree = rootRoute.addChildren([homeRoute, docsRouteTree])

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

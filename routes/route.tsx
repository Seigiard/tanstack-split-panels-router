import {
  createRootRoute,
  createRouter,
  Outlet,
  useSearch,
} from '@tanstack/react-router'

import { AppSidebar } from './components/AppSidebar'
import { LogPanel } from './components/LogPanel'
import { PanelShell } from './components/PanelShell'
import { RoutePending } from './components/RoutePending'
import { homeRoute } from './home/route'
import { HomeView } from './home/view'
import { usersRoute } from './users/route'
import { userDetailRoute } from './users/routes/$userId/route'
import { UserDetailView } from './users/routes/$userId/view'
import { UsersView } from './users/view'

import { indexRoute } from './index'

export const rootRoute = createRootRoute({
  component: function AppShell() {
    const search = useSearch({ from: rootRoute.id })
    const isPanelMode = search.left !== undefined || search.right !== undefined

    return (
      <div className='grid h-screen w-full grid-cols-[min-content_1fr] grid-rows-1'>
        <AppSidebar />
        <div className='grid h-screen grid-cols-1 grid-rows-[1fr_min-content]'>
          {isPanelMode ? (
            <PanelShell />
          ) : (
            <div className='min-h-0 flex-1 overflow-y-auto'>
              <Outlet />
            </div>
          )}
          <LogPanel />
        </div>
      </div>
    )
  },
  validateSearch: (search: Record<string, unknown>) => ({
    left: typeof search.left === 'string' ? search.left : undefined,
    right: typeof search.right === 'string' ? search.right : undefined,
  }),
})

homeRoute.update({ component: HomeView })
usersRoute.update({ component: UsersView })
userDetailRoute.update({ component: UserDetailView })

const routeTree = rootRoute.addChildren([
  indexRoute,
  homeRoute,
  usersRoute,
  userDetailRoute,
])

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

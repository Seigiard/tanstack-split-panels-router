import {
  createRootRoute,
  createRouter,
  Outlet,
  useSearch,
} from '@tanstack/react-router'

import { LogPanel } from './components/LogPanel'
import { PanelShell } from './components/PanelShell'
import { AppSidebar } from './components/AppSidebar'
import { SidebarProvider, SidebarInset } from '../components/ui/sidebar'

import { indexRoute } from './index'
import { homeRoute } from './home/route'
import { HomeView } from './home/view'
import { settingsRoute } from './settings/route'
import { billingRoute } from './settings/routes/billing/route'

export const rootRoute = createRootRoute({
  component: function AppShell() {
    const search = useSearch({ from: rootRoute.id })
    const isPanelMode = search.left !== undefined || search.right !== undefined

    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className='flex flex-col h-screen'>
          {isPanelMode ? (
            <PanelShell />
          ) : (
            <div className='flex-1 min-h-0 overflow-y-auto'>
              <Outlet />
            </div>
          )}
          <LogPanel />
        </SidebarInset>
      </SidebarProvider>
    )
  },
  validateSearch: (search: Record<string, unknown>) => ({
    left: typeof search.left === 'string' ? search.left : undefined,
    right: typeof search.right === 'string' ? search.right : undefined,
  }),
})

homeRoute.update({ component: HomeView })

const routeTree = rootRoute.addChildren([
  indexRoute,
  homeRoute,
  settingsRoute.addChildren([billingRoute]),
])

export const mainRouter = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof mainRouter
  }
}

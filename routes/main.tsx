import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  Link,
  useSearch,
  useRouteContext,
} from '@tanstack/react-router'

import { LogPanel } from '../components/LogPanel'
import { PanelShell } from '../components/PanelShell'
import { Button } from '../components/ui/button'
import { beforeLoadLog } from '../lib/logger'

export const rootRoute = createRootRoute({
  component: function AppShell() {
    const search = useSearch({ from: rootRoute.id })
    const isPanelMode = search.left !== undefined || search.right !== undefined

    return (
      <div className='flex flex-col h-screen'>
        <nav className='flex gap-2 p-4 border-b border-border'>
          <Link to='/home' search={{ left: undefined, right: undefined }}>
            <Button variant='ghost' size='sm'>
              Home
            </Button>
          </Link>
          <Link
            to='/settings/billing'
            search={{ left: undefined, right: undefined }}
          >
            <Button variant='ghost' size='sm'>
              Settings
            </Button>
          </Link>
          <Link to='/' search={{ left: '/dash', right: undefined }}>
            <Button variant='outline' size='sm'>
              Open Panels
            </Button>
          </Link>
        </nav>
        {isPanelMode ? (
          <PanelShell />
        ) : (
          <div className='flex-1 min-h-0 overflow-y-auto'>
            <Outlet />
          </div>
        )}
        <LogPanel />
      </div>
    )
  },
  validateSearch: (search: Record<string, unknown>) => ({
    left: typeof search.left === 'string' ? search.left : undefined,
    right: typeof search.right === 'string' ? search.right : undefined,
  }),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: ({ cause }) => beforeLoadLog(cause, 'main:/'),
  component: function IndexPage() {
    return (
      <div className='p-8 text-center'>
        <h1 className='text-2xl font-bold mb-4'>Split-State Router POC</h1>
        <p className='text-muted-foreground'>Normal mode — no panels</p>
      </div>
    )
  },
})

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/home',
  beforeLoad: ({ cause }) => {
    beforeLoadLog(cause, 'main:/home')
    return {
      label: '[context] Home Page',
      description: '[context] Main landing page',
    }
  },
  component: function HomeView() {
    const ctx = useRouteContext({ from: homeRoute.id })
    return (
      <div className='p-8'>
        <h1 className='text-2xl font-bold'>{ctx.label}</h1>
        <p className='text-muted-foreground mt-2'>{ctx.description}</p>
      </div>
    )
  },
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  beforeLoad: ({ cause }) => beforeLoadLog(cause, 'main:/settings'),
  component: function SettingsLayout() {
    return (
      <div className='p-8'>
        <h2 className='text-xl font-bold mb-4'>Settings</h2>
        <Outlet />
      </div>
    )
  },
})

const billingRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/billing',
  beforeLoad: ({ cause }) => beforeLoadLog(cause, 'main:/settings/billing'),
  component: function BillingView() {
    return <p className='text-muted-foreground'>Billing settings content</p>
  },
})

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

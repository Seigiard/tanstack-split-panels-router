import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  Link,
  useSearch,
  useRouteContext,
} from '@tanstack/react-router'
import { PanelShell } from '../components/PanelShell'
import { Button } from '../components/ui/button'
import { logger } from '../lib/logger'

export const rootRoute = createRootRoute({
  component: function AppShell() {
    const search = useSearch({ from: rootRoute.id })
    const isPanelMode = search.left !== undefined || search.right !== undefined

    if (isPanelMode) {
      return <PanelShell />
    }

    return (
      <div>
        <nav className="flex gap-2 p-4 border-b border-border">
          <Link to="/home" search={{ left: undefined, right: undefined, bottom: undefined }}><Button variant="ghost" size="sm">Home</Button></Link>
          <Link to="/settings/billing" search={{ left: undefined, right: undefined, bottom: undefined }}><Button variant="ghost" size="sm">Settings</Button></Link>
          <Link to="/" search={{ left: '/dash', right: '/route1', bottom: undefined }}>
            <Button variant="outline" size="sm">Open Panels</Button>
          </Link>
        </nav>
        <Outlet />
      </div>
    )
  },
  validateSearch: (search: Record<string, unknown>) => ({
    left: typeof search.left === 'string' ? search.left : undefined,
    right: typeof search.right === 'string' ? search.right : undefined,
    bottom: typeof search.bottom === 'string' ? search.bottom : undefined,
  }),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: function IndexPage() {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Split-State Router POC</h1>
        <p className="text-muted-foreground">Normal mode — no panels</p>
      </div>
    )
  },
})

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/home',
  beforeLoad: ({ cause }) => {
    if (cause === 'enter') {
      logger.log('[route:main] entered /home', 'lifecycle')
    }
    return { label: 'Home Page', description: 'Main landing page' }
  },
  component: function HomeView() {
    const ctx = useRouteContext({ from: homeRoute.id })
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">{ctx.label}</h1>
        <p className="text-muted-foreground mt-2">{ctx.description}</p>
      </div>
    )
  },
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: function SettingsLayout() {
    return (
      <div className="p-8">
        <h2 className="text-xl font-bold mb-4">Settings</h2>
        <Outlet />
      </div>
    )
  },
})

const billingRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/billing',
  component: function BillingView() {
    return <p className="text-muted-foreground">Billing settings content</p>
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

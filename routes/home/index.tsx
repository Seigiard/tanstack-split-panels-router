import { createRoute, useRouteContext } from '@tanstack/react-router'

import { Link } from '@/components/ui/link'

import { beforeLoadLog } from '../../lib/logger'
import { leftPanel } from '../left-panel'
import { rightPanel } from '../right-panel'
import { rootRoute } from '../route'

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  staticData: { breadcrumb: 'Home' },
  beforeLoad: ({ cause }) => {
    beforeLoadLog(cause, 'main:/home')
    return {
      label: '[context] Home Page',
      description: '[context] Main landing page',
    }
  },
  component: HomeView,
})

const BADGE =
  'inline-flex items-center rounded-md border px-2 py-0.5 text-sm font-medium transition-opacity hover:opacity-80'
const DONE_STYLE = `${BADGE} border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400`
const TODO_STYLE = `${BADGE} border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400`
const NA_STYLE = `${BADGE} border-transparent bg-muted text-muted-foreground`

function Todo() {
  return <span className={TODO_STYLE}>Todo</span>
}

function Na() {
  return <span className={NA_STYLE}>n/a</span>
}

function DoneMain({ to }: { to?: string }) {
  if (!to) return <span className={DONE_STYLE}>Done</span>
  return (
    <Link to={to as '/'} className={DONE_STYLE}>
      Done
    </Link>
  )
}

function DoneLeft({ to }: { to: string }) {
  return (
    <leftPanel.Link to={to as '/'} className={DONE_STYLE}>
      Done
    </leftPanel.Link>
  )
}

function DoneRight({ to }: { to: string }) {
  return (
    <rightPanel.Link to={to as '/'} className={DONE_STYLE}>
      Done
    </rightPanel.Link>
  )
}

function DonePanel() {
  return <span className={DONE_STYLE}>Done</span>
}

// ─── Highlights Section ──────────────────────────────────

const STATS = [
  { value: '14+', label: 'Panel Features' },
  { value: '2', label: 'Independent Panels' },
  { value: '100%', label: 'Type Safe' },
]

const QUICK_START_STEPS = [
  {
    title: 'Define each panel as a standalone router tree',
    code: `const leftPanel = createPanel({
  name: 'left',
  tree: leftPanelTree,
  defaultPath: '/categories',
})`,
  },
  {
    title: 'Combine panels into a system',
    code: `const panels = createPanelSystem({
  panels: { left: leftPanel, right: rightPanel },
})`,
  },
  {
    title: 'Wrap your app in the Provider',
    code: `<panels.Provider>
  <App />
</panels.Provider>`,
  },
  {
    title: 'Navigate with panel-scoped links and hooks',
    code: `<leftPanel.Link to="/categories">Browse</leftPanel.Link>

const { left, right } = panels.usePanel()
left.navigate('/categories')`,
  },
]

function HighlightsSection() {
  return (
    <div className='space-y-8'>
      <div>
        <h2 className='text-xl font-semibold'>
          Your TanStack Router code — now in panels
        </h2>
        <p className='mt-1 text-muted-foreground'>
          Standard routing patterns work out of the box in multi-panel mode. No
          rewrites, no wrappers — just panels.
        </p>
        <div className='mt-4 grid grid-cols-3 gap-4'>
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className='rounded-lg border bg-card p-3 text-center'
            >
              <div className='text-2xl font-bold text-emerald-600 dark:text-emerald-400'>
                {stat.value}
              </div>
              <div className='text-sm text-muted-foreground'>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className='mb-3 text-lg font-semibold'>Quick Start</h3>
        <ol className='space-y-3'>
          {QUICK_START_STEPS.map((step, i) => (
            <li key={i} className='flex gap-3'>
              <span className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-600 dark:text-emerald-400'>
                {i + 1}
              </span>
              <div className='min-w-0 flex-1'>
                <div className='mb-1.5 text-sm font-medium'>{step.title}</div>
                <pre className='overflow-x-auto rounded-md bg-muted px-3 py-2 font-mono text-sm leading-relaxed'>
                  {step.code}
                </pre>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <Link
        to='/features'
        className='inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300'
      >
        See all panel features in action &rarr;
      </Link>
    </div>
  )
}

function HomeView() {
  const ctx = useRouteContext({ from: homeRoute.id })

  return (
    <div className='max-w-4xl space-y-8 p-8'>
      <div>
        <h1 className='text-2xl font-bold'>{ctx.label}</h1>
        <p className='mt-2 text-muted-foreground'>{ctx.description}</p>
      </div>
      <HighlightsSection />
      <div className='overflow-x-auto'>
        <table className='w-full'>
          <thead>
            <tr className='border-b text-left text-muted-foreground'>
              <th className='pr-4 pb-2 font-medium'>Feature</th>
              <th className='w-20 px-4 pb-2 text-center font-medium'>Main</th>
              <th className='w-20 px-4 pb-2 text-center font-medium'>Panel</th>
            </tr>
          </thead>
          <tbody className='[&_td]:px-4 [&_td]:py-2.5 [&_td]:text-center [&_td:first-child]:pr-4 [&_td:first-child]:pl-0 [&_td:first-child]:text-left [&_tr]:border-b [&_tr]:border-border/50'>
            <tr>
              <td>
                <div className='font-medium'>Loader (data fetching)</div>
                <div className='mt-0.5 text-sm text-muted-foreground'>
                  loader() in createRoute — data ready before render
                </div>
              </td>
              <td>
                <DoneMain to='/users' />
              </td>
              <td>
                <DoneRight to='/?left=%2Fcategories' />
              </td>
            </tr>
            <tr>
              <td>
                <div className='font-medium'>Pending UI</div>
                <div className='mt-0.5 text-sm text-muted-foreground'>
                  pendingComponent / pendingMs — skeleton while loader runs
                </div>
              </td>
              <td>
                <DoneMain to='/users' />
              </td>
              <td>
                <DonePanel />
              </td>
            </tr>
            <tr>
              <td>
                <div className='font-medium'>Error boundary</div>
                <div className='mt-0.5 text-sm text-muted-foreground'>
                  errorComponent at route level
                </div>
              </td>
              <td>
                <Todo />
              </td>
              <td>
                <Todo />
              </td>
            </tr>
            <tr>
              <td>
                <div className='font-medium'>Not found</div>
                <div className='mt-0.5 text-sm text-muted-foreground'>
                  notFoundComponent for unknown paths
                </div>
              </td>
              <td>
                <Todo />
              </td>
              <td>
                <Todo />
              </td>
            </tr>
            <tr>
              <td>
                <div className='font-medium'>Lazy components</div>
                <div className='mt-0.5 text-sm text-muted-foreground'>
                  route.lazy() for code splitting
                </div>
              </td>
              <td>
                <Todo />
              </td>
              <td>
                <Todo />
              </td>
            </tr>
            <tr>
              <td>
                <div className='font-medium'>Deferred data</div>
                <div className='mt-0.5 text-sm text-muted-foreground'>
                  defer() + Await — streaming without blocking render
                </div>
              </td>
              <td>
                <Todo />
              </td>
              <td>
                <Todo />
              </td>
            </tr>
            <tr>
              <td>
                <div className='font-medium'>beforeLoad hook</div>
                <div className='mt-0.5 text-sm text-muted-foreground'>
                  Pre-render logic: guards, redirects, context injection
                </div>
              </td>
              <td>
                <DoneMain to='/home' />
              </td>
              <td>
                <DoneLeft to='/' />
              </td>
            </tr>
            <tr>
              <td>
                <div className='font-medium'>Route context</div>
                <div className='mt-0.5 text-sm text-muted-foreground'>
                  useRouteContext() — access data from beforeLoad
                </div>
              </td>
              <td>
                <DoneMain to='/home' />
              </td>
              <td>
                <DoneLeft to='/' />
              </td>
            </tr>
            <tr>
              <td>
                <div className='font-medium'>Search params</div>
                <div className='mt-0.5 text-sm text-muted-foreground'>
                  validateSearch + useSearch — typed query params
                </div>
              </td>
              <td>
                <DoneMain to='/' />
              </td>
              <td>
                <DoneLeft to='/' />
              </td>
            </tr>
            <tr>
              <td>
                <div className='font-medium'>Path params</div>
                <div className='mt-0.5 text-sm text-muted-foreground'>
                  $param in path, access in loader/component
                </div>
              </td>
              <td>
                <DoneMain to='/users/1' />
              </td>
              <td>
                <DoneRight to='/1' />
              </td>
            </tr>
            <tr>
              <td>
                <div className='font-medium'>Nested layouts</div>
                <div className='mt-0.5 text-sm text-muted-foreground'>
                  Shared layout with Outlet for nested routes
                </div>
              </td>
              <td>
                <Todo />
              </td>
              <td>
                <DoneLeft to='/' />
              </td>
            </tr>
            <tr>
              <td>
                <div className='font-medium'>Preloading</div>
                <div className='mt-0.5 text-sm text-muted-foreground'>
                  defaultPreload: intent — load on hover
                </div>
              </td>
              <td>
                <DoneMain to='/home' />
              </td>
              <td>
                <Na />
              </td>
            </tr>
            <tr>
              <td>
                <div className='font-medium'>Programmatic navigation</div>
                <div className='mt-0.5 text-sm text-muted-foreground'>
                  useNavigate() — navigate from code
                </div>
              </td>
              <td>
                <Na />
              </td>
              <td>
                <DoneLeft to='/' />
              </td>
            </tr>
            <tr>
              <td>
                <div className='font-medium'>Breadcrumbs</div>
                <div className='mt-0.5 text-sm text-muted-foreground'>
                  Auto-generated breadcrumbs from route path
                </div>
              </td>
              <td>
                <Todo />
              </td>
              <td>
                <Todo />
              </td>
            </tr>
            <tr>
              <td>
                <div className='font-medium'>Type-safe links</div>
                <div className='mt-0.5 text-sm text-muted-foreground'>
                  Path codegen, TS validation of to=&quot;&quot;
                </div>
              </td>
              <td>
                <DoneMain />
              </td>
              <td>
                <DonePanel />
              </td>
            </tr>
            <tr>
              <td>
                <div className='font-medium'>Memory router isolation</div>
                <div className='mt-0.5 text-sm text-muted-foreground'>
                  Panels run in separate memory routers
                </div>
              </td>
              <td>
                <Na />
              </td>
              <td>
                <DoneLeft to='/' />
              </td>
            </tr>
            <tr>
              <td>
                <div className='font-medium'>URL sync</div>
                <div className='mt-0.5 text-sm text-muted-foreground'>
                  Panel state encoded in main router query params
                </div>
              </td>
              <td>
                <Na />
              </td>
              <td>
                <DoneLeft to='/' />
              </td>
            </tr>
            <tr>
              <td>
                <div className='font-medium'>Cross-panel navigation</div>
                <div className='mt-0.5 text-sm text-muted-foreground'>
                  Left panel opens content in right panel
                </div>
              </td>
              <td>
                <Na />
              </td>
              <td>
                <DoneLeft to='/' />
              </td>
            </tr>
            <tr>
              <td>
                <div className='font-medium'>Panel open/close</div>
                <div className='mt-0.5 text-sm text-muted-foreground'>
                  Dynamic right panel toggle
                </div>
              </td>
              <td>
                <Na />
              </td>
              <td>
                <DoneLeft to='/' />
              </td>
            </tr>
            <tr>
              <td>
                <div className='font-medium'>Exit panel mode</div>
                <div className='mt-0.5 text-sm text-muted-foreground'>
                  Switch from panel mode to normal navigation
                </div>
              </td>
              <td>
                <Na />
              </td>
              <td>
                <DoneLeft to='/' />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

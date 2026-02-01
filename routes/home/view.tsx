import { useRouteContext } from '@tanstack/react-router'

import { Link, LinkLeftPanel, LinkRightPanel } from '@/components/ui/link'

import { homeRoute } from './route'

const BADGE =
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-opacity hover:opacity-80'
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
    <Link to={to} className={DONE_STYLE}>
      Done
    </Link>
  )
}

function DoneLeft({ to }: { to: string }) {
  return (
    <LinkLeftPanel to={to} className={DONE_STYLE}>
      Done
    </LinkLeftPanel>
  )
}

function DoneRight({ to }: { to: string }) {
  return (
    <LinkRightPanel to={to} className={DONE_STYLE}>
      Done
    </LinkRightPanel>
  )
}

function DonePanel() {
  return <span className={DONE_STYLE}>Done</span>
}

export function HomeView() {
  const ctx = useRouteContext({ from: homeRoute.id })

  return (
    <div className='max-w-4xl p-8'>
      <h1 className='text-2xl font-bold'>{ctx.label}</h1>
      <p className='mt-2 text-muted-foreground'>{ctx.description}</p>

      <div className='mt-6 overflow-x-auto'>
        <table className='w-full text-sm'>
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
                <div className='mt-0.5 text-xs text-muted-foreground'>
                  loader() in createRoute — data ready before render
                </div>
              </td>
              <td>
                <Todo />
              </td>
              <td>
                <DoneRight to='/posts' />
              </td>
            </tr>
            <tr>
              <td>
                <div className='font-medium'>Pending UI</div>
                <div className='mt-0.5 text-xs text-muted-foreground'>
                  pendingComponent / pendingMs — skeleton while loader runs
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
                <div className='font-medium'>Error boundary</div>
                <div className='mt-0.5 text-xs text-muted-foreground'>
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
                <div className='mt-0.5 text-xs text-muted-foreground'>
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
                <div className='mt-0.5 text-xs text-muted-foreground'>
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
                <div className='mt-0.5 text-xs text-muted-foreground'>
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
                <div className='mt-0.5 text-xs text-muted-foreground'>
                  Pre-render logic: guards, redirects, context injection
                </div>
              </td>
              <td>
                <DoneMain to='/home' />
              </td>
              <td>
                <DoneLeft to='/dash' />
              </td>
            </tr>
            <tr>
              <td>
                <div className='font-medium'>Route context</div>
                <div className='mt-0.5 text-xs text-muted-foreground'>
                  useRouteContext() — access data from beforeLoad
                </div>
              </td>
              <td>
                <DoneMain to='/home' />
              </td>
              <td>
                <DoneLeft to='/dash/sub1' />
              </td>
            </tr>
            <tr>
              <td>
                <div className='font-medium'>Search params</div>
                <div className='mt-0.5 text-xs text-muted-foreground'>
                  validateSearch + useSearch — typed query params
                </div>
              </td>
              <td>
                <DoneMain to='/' />
              </td>
              <td>
                <DoneLeft to='/dash' />
              </td>
            </tr>
            <tr>
              <td>
                <div className='font-medium'>Path params</div>
                <div className='mt-0.5 text-xs text-muted-foreground'>
                  $param in path, access in loader/component
                </div>
              </td>
              <td>
                <Todo />
              </td>
              <td>
                <DoneRight to='/posts/1' />
              </td>
            </tr>
            <tr>
              <td>
                <div className='font-medium'>Nested layouts</div>
                <div className='mt-0.5 text-xs text-muted-foreground'>
                  Shared layout with Outlet for nested routes
                </div>
              </td>
              <td>
                <DoneMain to='/settings/billing' />
              </td>
              <td>
                <DoneLeft to='/dash' />
              </td>
            </tr>
            <tr>
              <td>
                <div className='font-medium'>Preloading</div>
                <div className='mt-0.5 text-xs text-muted-foreground'>
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
                <div className='mt-0.5 text-xs text-muted-foreground'>
                  useNavigate() — navigate from code
                </div>
              </td>
              <td>
                <Na />
              </td>
              <td>
                <DoneLeft to='/dash' />
              </td>
            </tr>
            <tr>
              <td>
                <div className='font-medium'>Breadcrumbs</div>
                <div className='mt-0.5 text-xs text-muted-foreground'>
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
                <div className='mt-0.5 text-xs text-muted-foreground'>
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
                <div className='mt-0.5 text-xs text-muted-foreground'>
                  Panels run in separate memory routers
                </div>
              </td>
              <td>
                <Na />
              </td>
              <td>
                <DoneLeft to='/dash' />
              </td>
            </tr>
            <tr>
              <td>
                <div className='font-medium'>URL sync</div>
                <div className='mt-0.5 text-xs text-muted-foreground'>
                  Panel state encoded in main router query params
                </div>
              </td>
              <td>
                <Na />
              </td>
              <td>
                <DoneLeft to='/dash' />
              </td>
            </tr>
            <tr>
              <td>
                <div className='font-medium'>Cross-panel navigation</div>
                <div className='mt-0.5 text-xs text-muted-foreground'>
                  Left panel opens content in right panel
                </div>
              </td>
              <td>
                <Na />
              </td>
              <td>
                <DoneLeft to='/dash' />
              </td>
            </tr>
            <tr>
              <td>
                <div className='font-medium'>Panel open/close</div>
                <div className='mt-0.5 text-xs text-muted-foreground'>
                  Dynamic right panel toggle
                </div>
              </td>
              <td>
                <Na />
              </td>
              <td>
                <DoneLeft to='/dash' />
              </td>
            </tr>
            <tr>
              <td>
                <div className='font-medium'>Exit panel mode</div>
                <div className='mt-0.5 text-xs text-muted-foreground'>
                  Switch from panel mode to normal navigation
                </div>
              </td>
              <td>
                <Na />
              </td>
              <td>
                <DoneLeft to='/dash' />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

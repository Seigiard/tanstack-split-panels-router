import { createRoute, useRouteContext } from '@tanstack/react-router'

import { Link } from '@/components/ui/link'

import { beforeLoadLog } from '../../lib/logger'
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
    </div>
  )
}

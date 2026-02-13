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
    <div>
      <section>
        <h2>Your TanStack Router code — now in panels</h2>
        <p>
          Standard routing patterns work out of the box in multi-panel mode. No
          rewrites, no wrappers — just panels.
        </p>
        <div className='stats-grid'>
          {STATS.map((stat) => (
            <div key={stat.label} className='stat-card'>
              <div className='stat-value'>{stat.value}</div>
              <div className='stat-label'>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3>Quick Start</h3>
        <ol className='quick-start'>
          {QUICK_START_STEPS.map((step, i) => (
            <li key={i}>
              <div>
                <div>{step.title}</div>
                <pre>
                  <code>{step.code}</code>
                </pre>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <p>
        <Link to='/features'>See all panel features in action &rarr;</Link>
      </p>
    </div>
  )
}

function HomeView() {
  const ctx = useRouteContext({ from: homeRoute.id })

  return (
    <div style={{ maxWidth: '56rem', padding: '2rem' }}>
      <h1>{ctx.label}</h1>
      <p>{ctx.description}</p>
      <HighlightsSection />
    </div>
  )
}

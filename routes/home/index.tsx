import { createRoute, useRouteContext } from '@tanstack/react-router'

import { panels } from '@/lib/panels'

import { beforeLoadLog } from '../../lib/logger'
import { rootRoute } from '../route'

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  staticData: { breadcrumb: 'Home' },
  beforeLoad: ({ cause }) => {
    beforeLoadLog(cause, 'main:/home')
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

function HomeView() {
  const ctx = useRouteContext({ from: homeRoute.id })

  return (
    <>
      <hgroup>
        <h1>SplitState Router</h1>
        <p>
          Standard routing patterns work out of the box in multi-panel mode. No
          rewrites, no wrappers — just panels.
        </p>
      </hgroup>
      <section>
        <h2>Your TanStack Router code — now in panels</h2>
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
    </>
  )
}

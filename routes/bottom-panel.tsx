import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  Outlet,
} from '@tanstack/react-router'

const bottomRoot = createRootRoute({
  component: () => <Outlet />,
})

const logsRoute = createRoute({
  getParentRoute: () => bottomRoot,
  path: '/logs',
  component: function LogsView() {
    return (
      <div className="py-2">
        <p className="text-sm font-mono text-muted-foreground">
          [2025-01-30 12:00:01] System initialized<br />
          [2025-01-30 12:00:02] Connected to data source<br />
          [2025-01-30 12:00:03] Panel sync active<br />
          [2025-01-30 12:00:05] Awaiting user input...
        </p>
      </div>
    )
  },
})

export const bottomPanelTree = bottomRoot.addChildren([logsRoute])

export function createBottomRouter(initialPath: string = '/logs') {
  return createRouter({
    routeTree: bottomPanelTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

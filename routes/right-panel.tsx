import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
} from '@tanstack/react-router'

const rightRoot = createRootRoute({
  component: () => <p className="py-4 text-muted-foreground">Right panel root</p>,
})

const route1 = createRoute({
  getParentRoute: () => rightRoot,
  path: '/route1',
  component: function Route1View() {
    return <p className="py-4">Right panel — Route 1</p>
  },
})

const route2 = createRoute({
  getParentRoute: () => rightRoot,
  path: '/route2',
  component: function Route2View() {
    return <p className="py-4">Right panel — Route 2</p>
  },
})

export const rightPanelTree = rightRoot.addChildren([route1, route2])

export function createRightRouter(initialPath: string = '/route1') {
  return createRouter({
    routeTree: rightPanelTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

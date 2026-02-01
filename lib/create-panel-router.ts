import type { AnyRoute } from '@tanstack/react-router'
import { createRouter, createMemoryHistory } from '@tanstack/react-router'

import { RoutePending } from '@/routes/components/RoutePending'

export type PanelRouter = ReturnType<typeof createRouter>

export function createPanelRouter(
  routeTree: AnyRoute,
  defaultPath: string,
): (initialPath?: string) => PanelRouter {
  let instance: PanelRouter | null = null

  return (initialPath?: string) => {
    if (!instance) {
      instance = createRouter({
        routeTree,
        history: createMemoryHistory({
          initialEntries: [initialPath ?? defaultPath],
        }),
        defaultPendingComponent: RoutePending,
        defaultPendingMs: 200,
      })
    }
    return instance
  }
}

import type { PanelConfig, PanelInstance, PanelNavReturn } from './types'
import type { AnyRoute, RouteComponent } from '@tanstack/react-router'
import { RouterProvider } from '@tanstack/react-router'
import { useContext } from 'react'

import { createPanelLink } from './panel-link'
import { createPanelRouterFactory } from './panel-utils'
import { PanelIdentityContext, PanelSystemContext } from './system-provider'

export function createPanel<TTree extends AnyRoute>(
  config: PanelConfig<TTree> & { pendingComponent?: RouteComponent },
): PanelInstance<TTree> {
  const { name, tree, defaultPath, pendingComponent } = config
  const getRouter = createPanelRouterFactory(tree, pendingComponent)
  const Link = createPanelLink<TTree>(name)

  function Outlet(): React.ReactElement | null {
    const ctx = useContext(PanelSystemContext)
    if (!ctx) return null

    const router = ctx.getRouter(name)
    if (!router) return null

    return (
      <PanelIdentityContext.Provider
        value={{
          name,
          navigate: (to, opts) => ctx.navigatePanel(name, to, opts),
          close: () => ctx.closePanel(name),
        }}
      >
        <RouterProvider router={router} />
      </PanelIdentityContext.Provider>
    )
  }

  function useNav(): PanelNavReturn {
    const ctx = useContext(PanelSystemContext)
    if (!ctx) {
      throw new Error(
        `useNav for panel "${name}" must be used within panels.Provider`,
      )
    }
    return {
      navigate: (to, opts) => ctx.navigatePanel(name, to, opts),
      close: () => ctx.closePanel(name),
      isOpen: ctx.isPanelOpen(name),
    }
  }

  return {
    name,
    tree,
    defaultPath: defaultPath as string,
    getRouter,
    Outlet,
    Link,
    useNav,
  }
}

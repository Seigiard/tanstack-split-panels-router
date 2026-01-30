import { useEffect, useMemo, useRef } from 'react'
import { RouterProvider, useSearch, useNavigate } from '@tanstack/react-router'
import { rootRoute } from '../routes/main'
import { createLeftRouter } from '../routes/left-panel'
import { createRightRouter } from '../routes/right-panel'
import { PanelContext, type PanelNavigators } from '../lib/panel-context'
import { Separator } from './ui/separator'

export function PanelShell() {
  const search = useSearch({ from: rootRoute.id })
  const navigate = useNavigate()

  const leftRouterRef = useRef(createLeftRouter(search.left || '/dash'))
  const rightRouterRef = useRef(createRightRouter(search.right || '/route1'))
  const leftRouter = leftRouterRef.current
  const rightRouter = rightRouterRef.current

  const panelNavigate = (router: ReturnType<typeof createLeftRouter> | ReturnType<typeof createRightRouter>, to: string) => {
    ;(router.navigate as (opts: { to: string }) => void)({ to })
  }

  useEffect(() => {
    if (search.left) panelNavigate(leftRouter, search.left)
  }, [search.left, leftRouter])

  useEffect(() => {
    if (search.right) panelNavigate(rightRouter, search.right)
  }, [search.right, rightRouter])

  const navigators: PanelNavigators = useMemo(() => ({
    navigateLeft: (to) => {
      panelNavigate(leftRouter, to)
      navigate({
        to: '/',
        search: { left: to, right: search.right || '/route1', bottom: search.bottom },
      })
    },
    navigateRight: (to) => {
      panelNavigate(rightRouter, to)
      navigate({
        to: '/',
        search: { left: search.left || '/dash', right: to, bottom: search.bottom },
      })
    },
    navigateBottom: (to) => {
      navigate({
        to: '/',
        search: { left: search.left || '/dash', right: search.right || '/route1', bottom: to },
      })
    },
    closeBottom: () => {
      navigate({
        to: '/',
        search: { left: search.left || '/dash', right: search.right || '/route1', bottom: undefined },
      })
    },
    navigateMain: (to) => {
      navigate({ to: to as '/', search: { left: undefined, right: undefined, bottom: undefined } })
    },
  }), [leftRouter, rightRouter, navigate, search.left, search.right, search.bottom])

  return (
    <PanelContext.Provider value={navigators}>
      <div className="flex h-screen w-full overflow-hidden">
        <div className="flex-1 min-w-0 overflow-y-auto p-4">
          <h2 className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-4">
            Left Panel
          </h2>
          <RouterProvider router={leftRouter} />
        </div>

        <Separator orientation="vertical" />

        <div className="flex-1 min-w-0 overflow-y-auto p-4">
          <h2 className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-4">
            Right Panel
          </h2>
          <RouterProvider router={rightRouter} />
        </div>
      </div>
    </PanelContext.Provider>
  )
}

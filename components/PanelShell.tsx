import { useEffect, useMemo, useRef } from 'react'
import { RouterProvider, useSearch, useNavigate } from '@tanstack/react-router'
import { rootRoute } from '../routes/main'
import { createLeftRouter } from '../routes/left-panel'
import { createRightRouter } from '../routes/right-panel'
import { createBottomRouter } from '../routes/bottom-panel'
import { PanelContext, type PanelNavigators } from '../lib/panel-context'
import { Separator } from './ui/separator'
import { Button } from './ui/button'

export function PanelShell() {
  const search = useSearch({ from: rootRoute.id })
  const navigate = useNavigate()

  const leftRouterRef = useRef(createLeftRouter(search.left || '/dash'))
  const rightRouterRef = useRef(createRightRouter(search.right || '/route1'))
  const bottomRouterRef = useRef(
    search.bottom ? createBottomRouter(search.bottom) : null
  )
  const leftRouter = leftRouterRef.current
  const rightRouter = rightRouterRef.current

  const panelNavigate = (router: ReturnType<typeof createLeftRouter> | ReturnType<typeof createRightRouter> | ReturnType<typeof createBottomRouter>, to: string) => {
    ;(router.navigate as (opts: { to: string }) => void)({ to })
  }

  useEffect(() => {
    if (search.left) panelNavigate(leftRouter, search.left)
  }, [search.left, leftRouter])

  useEffect(() => {
    if (search.right) panelNavigate(rightRouter, search.right)
  }, [search.right, rightRouter])

  useEffect(() => {
    if (search.bottom && bottomRouterRef.current) {
      panelNavigate(bottomRouterRef.current, search.bottom)
    }
  }, [search.bottom])

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
      if (!bottomRouterRef.current) {
        bottomRouterRef.current = createBottomRouter(to)
      } else {
        panelNavigate(bottomRouterRef.current, to)
      }
      navigate({
        to: '/',
        search: { left: search.left || '/dash', right: search.right || '/route1', bottom: to },
      })
    },
    closeBottom: () => {
      bottomRouterRef.current = null
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
      <div className="flex flex-col h-screen w-full overflow-hidden">
        {/* Top: left + right */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
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

        {/* Bottom (conditional) */}
        {search.bottom && bottomRouterRef.current && (
          <>
            <Separator orientation="horizontal" />
            <div className="h-48 overflow-y-auto p-4 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                  Bottom Panel
                </h2>
                <Button variant="ghost" size="sm" onClick={() => navigators.closeBottom()}>
                  ✕
                </Button>
              </div>
              <RouterProvider router={bottomRouterRef.current} />
            </div>
          </>
        )}
      </div>
    </PanelContext.Provider>
  )
}

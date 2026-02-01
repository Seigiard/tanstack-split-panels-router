import { useEffect, useMemo, useRef } from 'react'
import { RouterProvider, useSearch, useNavigate } from '@tanstack/react-router'
import { rootRoute } from '../route'
import { createLeftRouter } from '../left-panel/route'
import { createRightRouter } from '../right-panel/route'
import { PanelContext, type PanelNavigators } from '../../lib/panel-context'
import { Separator } from '../../components/ui/separator'
import { Button } from '../../components/ui/button'
import { logger } from '../../lib/logger'

export function PanelShell() {
  const search = useSearch({ from: rootRoute.id })
  const navigate = useNavigate()

  const leftRouterRef = useRef(createLeftRouter(search.left || '/dash'))
  const rightRouterRef = useRef(createRightRouter(search.right || '/posts'))
  const leftRouter = leftRouterRef.current
  const rightRouter = rightRouterRef.current

  const panelNavigate = (router: ReturnType<typeof createLeftRouter> | ReturnType<typeof createRightRouter>, to: string) => {
    ;(router.navigate as (opts: { to: string }) => void)({ to })
  }

  const prevLeftRef = useRef(search.left)
  const prevRightRef = useRef(search.right)

  useEffect(() => {
    if (search.left && search.left !== prevLeftRef.current) {
      panelNavigate(leftRouter, search.left)
    }
    prevLeftRef.current = search.left
  }, [search.left, leftRouter])

  useEffect(() => {
    if (search.right && search.right !== prevRightRef.current) {
      panelNavigate(rightRouter, search.right)
    }
    prevRightRef.current = search.right
  }, [search.right, rightRouter])

  const navigators: PanelNavigators = useMemo(() => ({
    navigateLeft: (to) => {
      logger.log('[nav:left] → ' + to, 'navigation')
      panelNavigate(leftRouter, to)
      navigate({
        to: '/',
        search: { left: to, right: search.right },
      })
    },
    navigateRight: (to) => {
      logger.log('[nav:right] → ' + to, 'navigation')
      panelNavigate(rightRouter, to)
      navigate({
        to: '/',
        search: { left: search.left || '/dash', right: to },
      })
    },
    showRight: (to) => {
      logger.log('[nav:right] show → ' + to, 'navigation')
      panelNavigate(rightRouter, to)
      navigate({
        to: '/',
        search: { left: search.left || '/dash', right: to },
      })
    },
    closeRight: () => {
      logger.log('[nav:right] closed', 'navigation')
      navigate({
        to: '/',
        search: { left: search.left || '/dash', right: undefined },
      })
    },
    navigateMain: (to) => {
      logger.log('[nav:main] → ' + to, 'navigation')
      navigate({ to: to as '/', search: { left: undefined, right: undefined } })
    },
  }), [leftRouter, rightRouter, navigate, search.left, search.right])

  const rightVisible = search.right !== undefined

  return (
    <PanelContext.Provider value={navigators}>
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 min-w-0 overflow-y-auto p-4">
          <h2 className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-4">
            Left Panel
          </h2>
          <RouterProvider router={leftRouter} />
        </div>

        {rightVisible && (
          <>
            <Separator orientation="vertical" />
            <div className="flex-1 min-w-0 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                  Right Panel
                </h2>
                <Button variant="ghost" size="sm" onClick={() => navigators.closeRight()}>
                  ✕
                </Button>
              </div>
              <RouterProvider router={rightRouter} />
            </div>
          </>
        )}
      </div>
    </PanelContext.Provider>
  )
}

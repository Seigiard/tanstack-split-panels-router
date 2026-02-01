import type { PanelRouter } from '../../lib/create-panel-router'
import { RouterProvider, useSearch, useNavigate } from '@tanstack/react-router'
import { PropsWithChildren, useLayoutEffect, useMemo, useRef } from 'react'

import { logger } from '../../lib/logger'
import { PanelContext, type PanelNavigators } from '../../lib/panel-context'
import { getLeftRouter } from '../left-panel/route'
import { getRightRouter } from '../right-panel/route'
import { rootRoute } from '../route'

export function PanelShell() {
  const search = useSearch({ from: rootRoute.id })
  const navigate = useNavigate()

  const leftRouter = getLeftRouter(search.left || '/')
  const rightRouter = getRightRouter(search.right || '/posts')

  const panelNavigate = (router: PanelRouter, to: string) => {
    ;(router.navigate as (opts: { to: string }) => void)({ to })
  }

  const prevLeftRef = useRef<string | undefined>(undefined)
  const prevRightRef = useRef<string | undefined>(undefined)

  useLayoutEffect(() => {
    if (search.left && search.left !== prevLeftRef.current) {
      panelNavigate(leftRouter, search.left)
    }
    prevLeftRef.current = search.left
  }, [search.left, leftRouter])

  useLayoutEffect(() => {
    if (search.right && search.right !== prevRightRef.current) {
      panelNavigate(rightRouter, search.right)
    }
    prevRightRef.current = search.right
  }, [search.right, rightRouter])

  const navigators: PanelNavigators = useMemo(
    () => ({
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
          search: { left: search.left || '/', right: to },
        })
      },
      showRight: (to) => {
        logger.log('[nav:right] show → ' + to, 'navigation')
        panelNavigate(rightRouter, to)
        navigate({
          to: '/',
          search: { left: search.left || '/', right: to },
        })
      },
      closeRight: () => {
        logger.log('[nav:right] closed', 'navigation')
        navigate({
          to: '/',
          search: { left: search.left || '/', right: undefined },
        })
      },
      navigateMain: (to) => {
        logger.log('[nav:main] → ' + to, 'navigation')
        navigate({
          to: to as '/',
          search: { left: undefined, right: undefined },
        })
      },
    }),
    [leftRouter, rightRouter, navigate, search.left, search.right],
  )

  return (
    <PanelContext.Provider value={navigators}>
      <div className='flex min-h-0 flex-1 overflow-hidden'>
        {search?.left && (
          <Panel title='Left Panel'>
            <RouterProvider router={leftRouter} />
          </Panel>
        )}

        {search?.right && (
          <Panel title='Right Panel'>
            <RouterProvider router={rightRouter} />
          </Panel>
        )}
      </div>
    </PanelContext.Provider>
  )
}

function Panel({ children, title }: PropsWithChildren<{ title: string }>) {
  return (
    <div className='grid min-w-0 flex-1 grid-rows-[min-content_1fr] gap-2 bg-accent p-2'>
      <h2 className='text-[10px] font-bold tracking-widest text-muted-foreground uppercase'>
        {title}
      </h2>
      <div className='h-full overflow-y-auto rounded-xl bg-white p-4 shadow-sm'>
        {children}
      </div>
    </div>
  )
}

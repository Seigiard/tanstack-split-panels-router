import type { PanelRouter } from '../../lib/create-panel-router'
import { RouterProvider, useSearch, useNavigate } from '@tanstack/react-router'
import { type PropsWithChildren, useLayoutEffect, useMemo, useRef } from 'react'
import {
  TbX,
  TbLayoutSidebarLeftExpand,
  TbLayoutSidebarRightExpand,
} from 'react-icons/tb'

import { logger } from '../../lib/logger'
import { PanelContext, type PanelNavigators } from '../../lib/panel-context'
import { parsePanelValue } from '../../lib/panel-url'
import { getLeftRouter } from '../left-panel/route'
import { getRightRouter } from '../right-panel/route'
import { rootRoute } from '../route'

export function PanelShell() {
  const search = useSearch({ from: rootRoute.id })
  const navigate = useNavigate()

  const leftRouter = getLeftRouter(search.left || '/')
  const rightRouter = getRightRouter(search.right || '/')

  const panelNavigate = (router: PanelRouter, panelValue: string) => {
    const { pathname, searchString } = parsePanelValue(panelValue)
    const searchParams = searchString
      ? Object.fromEntries(new URLSearchParams(searchString))
      : undefined
    ;(
      router.navigate as (opts: {
        to: string
        search?: Record<string, string>
      }) => void
    )({ to: pathname, ...(searchParams ? { search: searchParams } : {}) })
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
      showLeft: (to) => {
        logger.log('[nav:left] show → ' + to, 'navigation')
        panelNavigate(leftRouter, to as string)
        navigate({
          to: '/',
          search: { left: to as string, right: search.right },
        })
      },
      closeLeft: () => {
        logger.log('[nav:left] closed', 'navigation')
        navigate({
          to: '/',
          search: { left: undefined, right: search.right },
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
      isLeftOpen: search.left !== undefined,
      isRightOpen: search.right !== undefined,
    }),
    [leftRouter, rightRouter, navigate, search.left, search.right],
  )

  return (
    <PanelContext.Provider value={navigators}>
      <div className='flex min-h-0 flex-1 overflow-hidden'>
        {search?.left ? (
          <Panel title='Left Panel' onClose={navigators.closeLeft}>
            <RouterProvider router={leftRouter} />
          </Panel>
        ) : (
          <CollapsedPanel
            icon={<TbLayoutSidebarLeftExpand />}
            onClick={() => navigators.showLeft('/categories')}
          />
        )}

        {search?.right ? (
          <Panel title='Right Panel' onClose={navigators.closeRight}>
            <RouterProvider router={rightRouter} />
          </Panel>
        ) : (
          <CollapsedPanel
            icon={<TbLayoutSidebarRightExpand />}
            onClick={() => navigators.showRight('/')}
          />
        )}
      </div>
    </PanelContext.Provider>
  )
}

function Panel({
  children,
  title,
  onClose,
}: PropsWithChildren<{ title: string; onClose: () => void }>) {
  return (
    <div className='grid min-w-0 flex-1 grid-rows-[min-content_1fr] gap-2 bg-accent p-2'>
      <div className='flex items-center justify-between'>
        <h2 className='text-[10px] font-bold tracking-widest text-muted-foreground uppercase'>
          {title}
        </h2>
        <button
          onClick={onClose}
          className='rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
        >
          <TbX className='h-3.5 w-3.5' />
        </button>
      </div>
      <div className='h-full overflow-y-auto rounded-xl bg-white p-4 shadow-sm'>
        {children}
      </div>
    </div>
  )
}

function CollapsedPanel({
  icon,
  onClick,
}: {
  icon: React.ReactNode
  onClick: () => void
}) {
  return (
    <div className='flex items-start bg-accent p-2'>
      <button
        onClick={onClick}
        className='rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
      >
        {icon}
      </button>
    </div>
  )
}

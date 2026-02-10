import { Outlet, useSearch } from '@tanstack/react-router'

import { rootRoute } from '../route'

import { AppSidebar } from './AppSidebar'
import { LogPanel } from './LogPanel'
import { PanelShell } from './PanelShell'

export function AppShell() {
  const search = useSearch({ from: rootRoute.id })
  const isPanelMode = search.left !== undefined || search.right !== undefined

  return (
    <div className='grid h-screen w-full grid-cols-[min-content_1fr] grid-rows-1'>
      <AppSidebar />
      <div className='grid h-screen grid-cols-1 grid-rows-[1fr_min-content]'>
        {isPanelMode ? (
          <PanelShell />
        ) : (
          <div className='min-h-0 flex-1 overflow-y-auto'>
            <Outlet />
          </div>
        )}
        <LogPanel />
      </div>
    </div>
  )
}

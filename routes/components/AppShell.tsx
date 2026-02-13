import { Outlet } from '@tanstack/react-router'

import { panels } from '@/lib/panels'

import { AppSidebar } from './AppSidebar'
import { LogPanel } from './LogPanel'
import { PanelLayout } from './PanelLayout'

export function AppShell() {
  return (
    <panels.Provider>
      <AppShellInner />
    </panels.Provider>
  )
}

function AppShellInner() {
  const { isPanelMode } = panels.usePanel()

  return (
    <div className='grid h-screen w-full grid-cols-[min-content_1fr] grid-rows-1'>
      <AppSidebar />
      <div className='grid h-screen grid-cols-1 grid-rows-[1fr_min-content]'>
        {isPanelMode ? (
          <PanelLayout />
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

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
    <>
      <header>
        <h1>SplitState</h1>
      </header>
      <AppSidebar />
      <main className='app-main'>
        {isPanelMode ? <PanelLayout /> : <Outlet />}
      </main>
      <LogPanel />
    </>
  )
}

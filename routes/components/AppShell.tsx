import { Outlet } from '@tanstack/react-router'

import { panels } from '@/lib/panels'

import { AppMenu } from './AppMenu'
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
      <header className='app-header'>
        <h1>SplitState</h1>
        <AppMenu />
      </header>
      <main className='app-main'>
        {isPanelMode ? <PanelLayout /> : <Outlet />}
      </main>
      <LogPanel className='app-footer' />
    </>
  )
}

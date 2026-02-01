import { Outlet } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { LinkLeftPanel } from '@/components/ui/link'
import { usePanelNav } from '@/lib/panel-context'

export function DashLayout() {
  const { navigateMain, showRight } = usePanelNav()
  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap gap-2'>
        <LinkLeftPanel
          className='text-primary underline hover:no-underline'
          to='/dash'
        >
          Dash Index
        </LinkLeftPanel>
        <LinkLeftPanel
          to='/dash/todos'
          className='inline-flex items-center rounded-md border border-input bg-background px-3 py-1 hover:bg-accent hover:text-accent-foreground'
        >
          Todos
        </LinkLeftPanel>
        <Button variant='outline' onClick={() => showRight('/posts')}>
          Show Agent
        </Button>
        <Button variant='ghost' onClick={() => navigateMain('/home')}>
          Exit → /home
        </Button>
      </div>
      <div className='rounded-lg border border-border bg-muted/30 p-3'>
        <span className='text-xs font-semibold tracking-widest text-muted-foreground uppercase'>
          Dash Layout
        </span>
        <Outlet />
      </div>
    </div>
  )
}

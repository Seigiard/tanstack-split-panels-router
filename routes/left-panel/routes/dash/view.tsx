import { Outlet } from '@tanstack/react-router'
import { LinkLeftPanel } from '@/components/ui/link'
import { usePanelNav } from '@/lib/panel-context'
import { Button } from '@/components/ui/button'

export function DashLayout() {
  const { navigateMain, showRight } = usePanelNav()
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <LinkLeftPanel to="/dash/sub1" className="inline-flex items-center rounded-md border border-input bg-background px-3 py-1 text-sm hover:bg-accent hover:text-accent-foreground">
          Sub 1
        </LinkLeftPanel>
        <LinkLeftPanel to="/dash/sub2" className="inline-flex items-center rounded-md border border-input bg-background px-3 py-1 text-sm hover:bg-accent hover:text-accent-foreground">
          Sub 2
        </LinkLeftPanel>
        <LinkLeftPanel to="/dash" className="inline-flex items-center rounded-md border border-input bg-background px-3 py-1 text-sm hover:bg-accent hover:text-accent-foreground">
          Dash Index
        </LinkLeftPanel>
        <Button variant="outline" size="sm" onClick={() => showRight('/posts')}>
          Show Agent
        </Button>
        <Button variant="ghost" size="sm" onClick={() => navigateMain('/home')}>
          Exit → /home
        </Button>
      </div>
      <div className="border border-border rounded-lg p-3 bg-muted/30">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Dash Layout
        </span>
        <Outlet />
      </div>
    </div>
  )
}

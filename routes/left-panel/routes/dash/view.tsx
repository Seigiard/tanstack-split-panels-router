import { Outlet } from '@tanstack/react-router'
import { LinkLeft } from '@/routes/components/panel-links'
import { usePanelNav } from '@/lib/panel-context'
import { Button } from '@/components/ui/button'

export function DashLayout() {
  const { navigateMain, showRight } = usePanelNav()
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <LinkLeft to="/dash/sub1">Sub 1</LinkLeft>
        <LinkLeft to="/dash/sub2">Sub 2</LinkLeft>
        <LinkLeft to="/dash">Dash Index</LinkLeft>
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

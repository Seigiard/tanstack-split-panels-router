import { createRoute } from '@tanstack/react-router'
import { beforeLoadLog } from '@/lib/logger'
import { dashRoute } from './route'

export const dashIndexRoute = createRoute({
  getParentRoute: () => dashRoute,
  path: '/',
  beforeLoad: ({ cause }) => beforeLoadLog(cause, 'left:/dash/'),
  component: function DashIndex() {
    return <p className="text-muted-foreground py-4">Dash index — select a sub-section</p>
  },
})

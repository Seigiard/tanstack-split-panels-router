import { createRoute } from '@tanstack/react-router'

import { beforeLoadLog } from '@/lib/logger'
import { leftRoot } from '@/routes/left-panel/route'

export const dashIndexRoute = createRoute({
  getParentRoute: () => leftRoot,
  path: '/',
  beforeLoad: ({ cause }) => beforeLoadLog(cause, 'left:/'),
  component: function DashIndex() {
    return (
      <p className='py-4 text-muted-foreground'>
        Dash index — select a sub-section
      </p>
    )
  },
})

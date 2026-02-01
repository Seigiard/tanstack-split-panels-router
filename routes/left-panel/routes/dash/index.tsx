import { createRoute } from '@tanstack/react-router'

import { beforeLoadLog } from '@/lib/logger'

import { dashRoute } from './route'

export const dashIndexRoute = createRoute({
  getParentRoute: () => dashRoute,
  path: '/',
  beforeLoad: ({ cause }) => beforeLoadLog(cause, 'left:/dash/'),
  component: function DashIndex() {
    return (
      <p className='py-4 text-muted-foreground'>
        Dash index — select a sub-section
      </p>
    )
  },
})

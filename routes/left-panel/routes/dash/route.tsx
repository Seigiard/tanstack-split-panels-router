import { createRoute } from '@tanstack/react-router'

import { beforeLoadLog } from '@/lib/logger'
import { leftRoot } from '@/routes/left-panel/route'

import { DashLayout } from './view'

export const dashRoute = createRoute({
  getParentRoute: () => leftRoot,
  path: '/dash',
  beforeLoad: ({ cause }) => beforeLoadLog(cause, 'left:/dash'),
  component: DashLayout,
})

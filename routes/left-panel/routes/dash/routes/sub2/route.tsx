import { createRoute } from '@tanstack/react-router'
import { beforeLoadLog } from '@/lib/logger'
import { dashRoute } from '@/routes/left-panel/routes/dash/route'
import { Sub2View } from './view'

export const sub2Route = createRoute({
  getParentRoute: () => dashRoute,
  path: '/sub2',
  beforeLoad: ({ cause }) => beforeLoadLog(cause, 'left:/dash/sub2'),
  component: Sub2View,
})

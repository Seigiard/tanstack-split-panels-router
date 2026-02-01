import { createRoute } from '@tanstack/react-router'
import { beforeLoadLog } from '@/lib/logger'
import { dashRoute } from '@/routes/left-panel/routes/dash/route'
import { Sub1View } from './view'

export const sub1Route = createRoute({
  getParentRoute: () => dashRoute,
  path: '/sub1',
  beforeLoad: ({ cause }) => {
    beforeLoadLog(cause, 'left:/dash/sub1')
    return { label: '[context] Sub-section 1', tag: '[context] panel-left' }
  },
  component: Sub1View,
})

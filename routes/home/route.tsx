import { createRoute } from '@tanstack/react-router'

import { beforeLoadLog } from '../../lib/logger'
import { rootRoute } from '../route'

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/home',
  staticData: { breadcrumb: 'Home' },
  beforeLoad: ({ cause }) => {
    beforeLoadLog(cause, 'main:/home')
    return {
      label: '[context] Home Page',
      description: '[context] Main landing page',
    }
  },
})

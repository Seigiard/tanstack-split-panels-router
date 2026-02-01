import { createRoute } from '@tanstack/react-router'
import { beforeLoadLog } from '../../lib/logger'
import { rootRoute } from '../route'

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/home',
  beforeLoad: ({ cause }) => {
    beforeLoadLog(cause, 'main:/home')
    return {
      label: '[context] Home Page',
      description: '[context] Main landing page',
    }
  },
})

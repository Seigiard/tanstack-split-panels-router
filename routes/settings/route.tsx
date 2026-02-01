import { createRoute } from '@tanstack/react-router'
import { beforeLoadLog } from '../../lib/logger'
import { rootRoute } from '../route'
import { SettingsLayout } from './view'

export const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  beforeLoad: ({ cause }) => beforeLoadLog(cause, 'main:/settings'),
  component: SettingsLayout,
})

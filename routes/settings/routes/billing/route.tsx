import { createRoute } from '@tanstack/react-router'

import { beforeLoadLog } from '../../../../lib/logger'
import { settingsRoute } from '../../route'

import { BillingView } from './view'

export const billingRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/billing',
  beforeLoad: ({ cause }) => beforeLoadLog(cause, 'main:/settings/billing'),
  component: BillingView,
})

import { createRoute, redirect } from '@tanstack/react-router'

import { docsRoute } from './route'

export const docsIndexRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/docs/$docId', params: { docId: '01-quickstart' } })
  },
})

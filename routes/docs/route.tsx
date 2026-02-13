import { createRoute, Outlet } from '@tanstack/react-router'

import { rootRoute } from '@/routes/route'

import { docPageRoute } from './$docId'

import { docsIndexRoute } from '.'

export const docsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/docs',
  staticData: { breadcrumb: 'Docs' },
  component: () => <Outlet />,
})

export const docsRouteTree = docsRoute.addChildren([
  docsIndexRoute,
  docPageRoute,
])

import { createRoute } from '@tanstack/react-router'

import { beforeLoadLog } from '@/lib/logger'
import readmeHtml from '@/README.md'
import { rootRoute } from '@/routes/route'

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  staticData: { breadcrumb: 'Home' },
  beforeLoad: ({ cause }) => {
    beforeLoadLog(cause, 'main:/home')
  },
  component: HomeView,
})

function HomeView() {
  // Safe: HTML is generated from our own README.md at build time by marked
  return <article dangerouslySetInnerHTML={{ __html: readmeHtml }} />
}

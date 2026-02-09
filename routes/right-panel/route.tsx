import { createRootRoute, Outlet } from '@tanstack/react-router'

import { createPanelRouter } from '@/lib/create-panel-router'

import { postsRoute } from './routes/posts/route'
import { postDetailRoute } from './routes/posts/routes/$postId/route'

export const rightRoot = createRootRoute({
  component: () => <Outlet />,
})

export const rightPanelTree = rightRoot.addChildren([
  postsRoute,
  postDetailRoute,
])

export const getRightRouter = createPanelRouter(rightPanelTree)

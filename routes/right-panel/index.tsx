import { createRootRoute, Outlet } from '@tanstack/react-router'

import { createPanelRouter } from '@/lib/create-panel-router'

import { postDetailRoute } from './$postId'
import { postsRoute } from './posts'

export const rightRoot = createRootRoute({
  component: () => <Outlet />,
})

export const rightPanelTree = rightRoot.addChildren([
  postsRoute,
  postDetailRoute,
])

export const getRightRouter = createPanelRouter(rightPanelTree)

import { createRootRoute, Outlet } from '@tanstack/react-router'

import { createPanel } from '@/lib/panel-system'
import { RoutePending } from '@/routes/components/RoutePending'

import { postDetailRoute } from './routes/$postId'
import { postsRoute } from './routes/posts'

export const rightRoot = createRootRoute({
  component: () => <Outlet />,
})

export const rightPanelTree = rightRoot.addChildren([
  postsRoute,
  postDetailRoute,
])

export const rightPanel = createPanel({
  name: 'right',
  tree: rightPanelTree,
  defaultPath: '/',
  pendingComponent: RoutePending,
})

export const getRightRouter = rightPanel.getRouter

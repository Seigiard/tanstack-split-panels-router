import {
  createRootRoute,
  createRouter,
  createMemoryHistory,
  Outlet,
} from '@tanstack/react-router'

import { RoutePending } from '@/routes/components/RoutePending'

import { postsRoute } from './routes/posts/route'
import { postDetailRoute } from './routes/posts/routes/$postId/route'
import { PostDetailView } from './routes/posts/routes/$postId/view'
import { PostsListView } from './routes/posts/view'

export const rightRoot = createRootRoute({
  component: () => <Outlet />,
})

postsRoute.update({ component: PostsListView })
postDetailRoute.update({ component: PostDetailView })

export const rightPanelTree = rightRoot.addChildren([
  postsRoute,
  postDetailRoute,
])

export function createRightRouter(
  initialPath: string = '/posts',
): ReturnType<typeof createRouter> {
  return createRouter({
    routeTree: rightPanelTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    defaultPendingComponent: RoutePending,
    defaultPendingMs: 200,
  })
}

let _rightRouter: ReturnType<typeof createRightRouter> | null = null

export function getRightRouter(
  initialPath: string = '/posts',
): ReturnType<typeof createRightRouter> {
  if (!_rightRouter) {
    _rightRouter = createRightRouter(initialPath)
  }
  return _rightRouter
}

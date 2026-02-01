import { createRootRoute, Outlet } from '@tanstack/react-router'

import { createPanelRouter } from '@/lib/create-panel-router'

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

export const getRightRouter = createPanelRouter(rightPanelTree, '/posts')

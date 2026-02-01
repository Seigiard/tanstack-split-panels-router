import {
  createRootRoute,
  createRouter,
  createMemoryHistory,
  Outlet,
} from '@tanstack/react-router'
import { postsRoute } from './routes/posts/route'
import { PostsListView } from './routes/posts/view'
import { postDetailRoute } from './routes/posts/routes/$postId/route'
import { PostDetailView } from './routes/posts/routes/$postId/view'

export const rightRoot = createRootRoute({
  component: () => <Outlet />,
})

postsRoute.update({ component: PostsListView })
postDetailRoute.update({ component: PostDetailView })

export const rightPanelTree = rightRoot.addChildren([postsRoute, postDetailRoute])

export function createRightRouter(initialPath: string = '/posts'): ReturnType<typeof createRouter> {
  return createRouter({
    routeTree: rightPanelTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

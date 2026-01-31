import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  Outlet,
} from '@tanstack/react-router'
import { usePanelNav } from '../lib/panel-context'
import { Button } from '../components/ui/button'
import { beforeLoadLog } from '../lib/logger'

type Post = { id: number; title: string; body: string; userId: number }
type Comment = { id: number; postId: number; name: string; email: string; body: string }

const rightRoot = createRootRoute({
  component: () => <Outlet />,
})

const postsRoute = createRoute({
  getParentRoute: () => rightRoot,
  path: '/posts',
  beforeLoad: ({ cause }) => beforeLoadLog(cause, 'right:/posts'),
  loader: async (): Promise<Post[]> => {
    const res = await fetch('https://jsonplaceholder.typicode.com/posts')
    return res.json()
  },
  component: function PostsListView() {
    const posts = postsRoute.useLoaderData() as Post[]
    const { navigateRight } = usePanelNav()
    return (
      <div className="space-y-1">
        <h3 className="text-sm font-semibold mb-2">Posts</h3>
        <ul className="space-y-1">
          {posts.map((post) => (
            <li key={post.id}>
              <button
                className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors"
                onClick={() => navigateRight(`/posts/${post.id}`)}
              >
                <span className="text-muted-foreground mr-1.5">{post.id}.</span>
                {post.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  },
})

const postDetailRoute = createRoute({
  getParentRoute: () => rightRoot,
  path: '/posts/$postId',
  beforeLoad: ({ cause, params }) => beforeLoadLog(cause, `right:/posts/${params.postId}`),
  loader: async ({ params }): Promise<{ post: Post; comments: Comment[] }> => {
    const [post, comments] = await Promise.all([
      fetch(`https://jsonplaceholder.typicode.com/posts/${params.postId}`).then((r) => r.json()),
      fetch(`https://jsonplaceholder.typicode.com/posts/${params.postId}/comments`).then((r) => r.json()),
    ])
    return { post, comments }
  },
  component: function PostDetailView() {
    const { post, comments } = postDetailRoute.useLoaderData() as { post: Post; comments: Comment[] }
    const { navigateRight } = usePanelNav()
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigateRight('/posts')}>
          ← Back to posts
        </Button>
        <div>
          <h3 className="text-sm font-semibold">{post.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{post.body}</p>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
            Comments ({comments.length})
          </h4>
          <ul className="space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="border border-border rounded p-2 text-sm">
                <span className="font-medium">{c.name}</span>
                <p className="text-muted-foreground mt-0.5">{c.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  },
})

export const rightPanelTree = rightRoot.addChildren([postsRoute, postDetailRoute])

export function createRightRouter(initialPath: string = '/posts'): ReturnType<typeof createRouter> {
  return createRouter({
    routeTree: rightPanelTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

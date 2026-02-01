import { usePanelNav } from '@/lib/panel-context'
import { postsRoute } from './route'

type Post = { id: number; title: string; body: string; userId: number }

export function PostsListView() {
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
}

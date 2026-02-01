import { LinkRightPanel } from '@/components/ui/link'
import { postsRoute } from './route'

type Post = { id: number; title: string; body: string; userId: number }

export function PostsListView() {
  const posts = postsRoute.useLoaderData() as Post[]
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold mb-2">Posts</h3>
      <ul className="space-y-1">
        {posts.map((post) => (
          <li key={post.id}>
            <LinkRightPanel
              to={`/posts/${post.id}`}
              className="block w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors"
            >
              <span className="text-muted-foreground mr-1.5">{post.id}.</span>
              {post.title}
            </LinkRightPanel>
          </li>
        ))}
      </ul>
    </div>
  )
}

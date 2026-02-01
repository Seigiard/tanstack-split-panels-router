import { LinkRightPanel } from '@/components/ui/link'
import { postDetailRoute } from './route'

type Post = { id: number; title: string; body: string; userId: number }
type Comment = { id: number; postId: number; name: string; email: string; body: string }

export function PostDetailView() {
  const { post, comments } = postDetailRoute.useLoaderData() as { post: Post; comments: Comment[] }
  return (
    <div className="space-y-4">
      <LinkRightPanel to="/posts" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        ← Back to posts
      </LinkRightPanel>
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
}

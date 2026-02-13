import type { Comment, Post } from '@/lib/api-types'
import { createRoute } from '@tanstack/react-router'

import { beforeLoadLog } from '@/lib/logger'
import { rightPanel, rightRoot } from '@/routes/right-panel'
import { wait } from '@/utils/wait'

export const postDetailRoute = createRoute({
  getParentRoute: () => rightRoot,
  path: '/$postId',
  beforeLoad: ({ cause, params }) =>
    beforeLoadLog(cause, `right:/${params.postId}`),
  loader: async ({ params }): Promise<{ post: Post; comments: Comment[] }> => {
    await wait(1000)
    const [post, commentsData] = await Promise.all([
      fetch(`https://dummyjson.com/posts/${params.postId}`).then((r) =>
        r.json(),
      ),
      fetch(`https://dummyjson.com/comments/post/${params.postId}`).then((r) =>
        r.json(),
      ),
    ])
    return { post, comments: commentsData.comments }
  },
  component: PostDetailView,
})

function PostDetailView() {
  const { post, comments } = postDetailRoute.useLoaderData() as {
    post: Post
    comments: Comment[]
  }
  return (
    <div>
      <p>
        <rightPanel.Link to='/'>&larr; Back to posts</rightPanel.Link>
      </p>
      <h3>{post.title}</h3>
      <p>{post.body}</p>
      <h4>Comments ({comments.length})</h4>
      <ul>
        {comments.map((c) => (
          <li key={c.id} className='comment-card'>
            <strong>{c.user.fullName}</strong>
            <p>{c.body}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

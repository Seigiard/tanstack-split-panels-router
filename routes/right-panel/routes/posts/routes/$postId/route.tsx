import { createRoute } from '@tanstack/react-router'

import { beforeLoadLog } from '@/lib/logger'
import { rightRoot } from '@/routes/right-panel/route'

type Post = { id: number; title: string; body: string; userId: number }
type Comment = {
  id: number
  postId: number
  name: string
  email: string
  body: string
}

export const postDetailRoute = createRoute({
  getParentRoute: () => rightRoot,
  path: '/posts/$postId',
  beforeLoad: ({ cause, params }) =>
    beforeLoadLog(cause, `right:/posts/${params.postId}`),
  loader: async ({ params }): Promise<{ post: Post; comments: Comment[] }> => {
    const [post, comments] = await Promise.all([
      fetch(`https://jsonplaceholder.typicode.com/posts/${params.postId}`).then(
        (r) => r.json(),
      ),
      fetch(
        `https://jsonplaceholder.typicode.com/posts/${params.postId}/comments`,
      ).then((r) => r.json()),
    ])
    return { post, comments }
  },
})

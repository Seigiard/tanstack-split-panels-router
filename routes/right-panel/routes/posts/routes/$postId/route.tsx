import type { Comment, Post } from '@/lib/api-types'
import { createRoute } from '@tanstack/react-router'

import { beforeLoadLog } from '@/lib/logger'
import { rightRoot } from '@/routes/right-panel/route'
import { wait } from '@/utils/wait'

export const postDetailRoute = createRoute({
  getParentRoute: () => rightRoot,
  path: '/posts/$postId',
  beforeLoad: ({ cause, params }) =>
    beforeLoadLog(cause, `right:/posts/${params.postId}`),
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
})

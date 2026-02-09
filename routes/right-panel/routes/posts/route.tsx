import type { Post } from '@/lib/api-types'
import { createRoute } from '@tanstack/react-router'

import { beforeLoadLog } from '@/lib/logger'
import { rightRoot } from '@/routes/right-panel/route'
import { wait } from '@/utils/wait'

export const postsRoute = createRoute({
  getParentRoute: () => rightRoot,
  path: '/posts',
  beforeLoad: ({ cause }) => beforeLoadLog(cause, 'right:/posts'),
  loader: async (): Promise<Post[]> => {
    await wait(1000)
    const res = await fetch('https://dummyjson.com/posts?limit=30')
    const data: { posts: Post[] } = await res.json()
    return data.posts
  },
})

import { createRoute } from '@tanstack/react-router'

import { beforeLoadLog } from '@/lib/logger'
import { rightRoot } from '@/routes/right-panel/route'
import { wait } from '@/utils/wait'

type Post = { id: number; title: string; body: string; userId: number }

export const postsRoute = createRoute({
  getParentRoute: () => rightRoot,
  path: '/posts',
  beforeLoad: ({ cause }) => beforeLoadLog(cause, 'right:/posts'),
  loader: async (): Promise<Post[]> => {
    await wait(1000)
    const res = await fetch('https://jsonplaceholder.typicode.com/posts')
    return res.json()
  },
})

import type { User } from '@/lib/api-types'
import { createRoute } from '@tanstack/react-router'

import { beforeLoadLog } from '@/lib/logger'
import { leftRoot } from '@/routes/left-panel/route'
import { wait } from '@/utils/wait'

export const usersRoute = createRoute({
  getParentRoute: () => leftRoot,
  path: '/users',
  beforeLoad: ({ cause }) => beforeLoadLog(cause, 'left:/users'),
  loader: async (): Promise<User[]> => {
    await wait(1000)
    const res = await fetch('https://dummyjson.com/users?limit=20')
    const data: { users: User[] } = await res.json()
    return data.users
  },
})

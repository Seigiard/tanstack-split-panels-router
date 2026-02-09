import type { User } from '@/lib/api-types'
import { createRoute } from '@tanstack/react-router'

import { beforeLoadLog } from '@/lib/logger'
import { rootRoute } from '@/routes/route'
import { wait } from '@/utils/wait'

export type { User }

export const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  staticData: { breadcrumb: 'Users' },
  beforeLoad: ({ cause }) => beforeLoadLog(cause, 'main:/users'),
  loader: async (): Promise<User[]> => {
    await wait(1000)
    const res = await fetch('https://dummyjson.com/users?limit=20')
    const data: { users: User[] } = await res.json()
    return data.users
  },
})

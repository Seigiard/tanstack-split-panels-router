import type { User } from '@/lib/api-types'
import { createRoute } from '@tanstack/react-router'

import { beforeLoadLog } from '@/lib/logger'
import { leftRoot } from '@/routes/left-panel/route'
import { wait } from '@/utils/wait'

export const userDetailRoute = createRoute({
  getParentRoute: () => leftRoot,
  path: '/users/$userId',
  staticData: {
    breadcrumb: ({ loaderData }) => {
      const user = loaderData as User | undefined
      return user ? `${user.firstName} ${user.lastName}` : undefined
    },
  },
  beforeLoad: ({ cause, params }) =>
    beforeLoadLog(cause, `left:/users/${params.userId}`),
  loader: async ({ params }): Promise<User> => {
    await wait(1000)
    const res = await fetch(`https://dummyjson.com/users/${params.userId}`)
    return res.json()
  },
})

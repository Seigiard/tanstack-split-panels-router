import type { User } from '@/routes/users/route'
import { createRoute } from '@tanstack/react-router'

import { beforeLoadLog } from '@/lib/logger'
import { rootRoute } from '@/routes/route'

export const userDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users/$userId',
  beforeLoad: ({ cause, params }) =>
    beforeLoadLog(cause, `main:/users/${params.userId}`),
  loader: async ({ params }): Promise<User> => {
    const res = await fetch(`https://json-mock.org/api/users/${params.userId}`)
    return res.json()
  },
})

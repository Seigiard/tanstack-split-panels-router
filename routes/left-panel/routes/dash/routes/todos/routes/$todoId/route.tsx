import type { Todo } from '@/routes/left-panel/routes/dash/routes/todos/route'
import { createRoute } from '@tanstack/react-router'

import { beforeLoadLog } from '@/lib/logger'
import { leftRoot } from '@/routes/left-panel/route'

export const todoDetailRoute = createRoute({
  getParentRoute: () => leftRoot,
  path: '/todos/$todoId',
  beforeLoad: ({ cause, params }) =>
    beforeLoadLog(cause, `left:/todos/${params.todoId}`),
  loader: async ({ params }): Promise<Todo> => {
    const res = await fetch(`https://json-mock.org/api/todos/${params.todoId}`)
    return res.json()
  },
})

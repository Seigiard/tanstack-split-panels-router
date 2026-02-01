import { createRoute } from '@tanstack/react-router'

import { beforeLoadLog } from '@/lib/logger'
import { dashRoute } from '@/routes/left-panel/routes/dash/route'

export type Todo = {
  todoId: number
  userId: number
  content: string
  completed: boolean
}

export const todosRoute = createRoute({
  getParentRoute: () => dashRoute,
  path: '/todos',
  beforeLoad: ({ cause }) => beforeLoadLog(cause, 'left:/dash/todos'),
  loader: async (): Promise<Todo[]> => {
    const res = await fetch('https://json-mock.org/api/todos')
    return res.json()
  },
})

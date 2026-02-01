import { createRoute } from '@tanstack/react-router'

import { beforeLoadLog } from '@/lib/logger'
import { leftRoot } from '@/routes/left-panel/route'

export type Todo = {
  todoId: number
  userId: number
  content: string
  completed: boolean
}

export const todosRoute = createRoute({
  getParentRoute: () => leftRoot,
  path: '/todos',
  beforeLoad: ({ cause }) => beforeLoadLog(cause, 'left:/todos'),
  loader: async (): Promise<Todo[]> => {
    const res = await fetch('https://json-mock.org/api/todos')
    return res.json()
  },
})

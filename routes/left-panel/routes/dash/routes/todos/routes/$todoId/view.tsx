import type { Todo } from '@/routes/left-panel/routes/dash/routes/todos/route'

import { LinkLeftPanel } from '@/components/ui/link'

import { todoDetailRoute } from './route'

export function TodoDetailView() {
  const todo = todoDetailRoute.useLoaderData() as Todo

  return (
    <div className='space-y-4'>
      <LinkLeftPanel
        to='/dash/todos'
        className='inline-flex items-center text-sm text-muted-foreground hover:text-foreground'
      >
        &larr; Back to todos
      </LinkLeftPanel>

      <div>
        <h3 className='text-sm font-semibold'>Todo #{todo.todoId}</h3>
        <p className='mt-1 text-sm'>{todo.content}</p>
      </div>

      <div className='space-y-2 text-sm'>
        <div>
          <span className='font-medium'>Status:</span>{' '}
          <span
            className={todo.completed ? 'text-green-600' : 'text-yellow-600'}
          >
            {todo.completed ? 'Completed' : 'Pending'}
          </span>
        </div>
        <div>
          <span className='font-medium'>User ID:</span>{' '}
          <span className='text-muted-foreground'>{todo.userId}</span>
        </div>
      </div>
    </div>
  )
}

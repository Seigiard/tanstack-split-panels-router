import type { Todo } from './route'

import { LinkLeftPanel } from '@/components/ui/link'

import { todosRoute } from './route'

export function TodosView() {
  const todos = todosRoute.useLoaderData() as Todo[]

  return (
    <div className='space-y-1'>
      <h3 className='mb-2 text-sm font-semibold'>Todos</h3>
      <ul className='space-y-1'>
        {todos.map((todo) => (
          <li key={todo.todoId}>
            <LinkLeftPanel
              to={`/dash/todos/${todo.todoId}`}
              className='block w-full rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted'
            >
              <span
                className={
                  todo.completed ? 'line-through opacity-60' : 'font-medium'
                }
              >
                {todo.content}
              </span>
              <span className='ml-2 text-xs text-muted-foreground'>
                #{todo.todoId}
              </span>
            </LinkLeftPanel>
          </li>
        ))}
      </ul>
    </div>
  )
}

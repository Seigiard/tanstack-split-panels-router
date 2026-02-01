import { createRootRoute, Outlet } from '@tanstack/react-router'

import { createPanelRouter } from '@/lib/create-panel-router'

import { dashIndexRoute } from './routes/dash/index'
import { dashRoute } from './routes/dash/route'
import { todosRoute } from './routes/dash/routes/todos/route'
import { todoDetailRoute } from './routes/dash/routes/todos/routes/$todoId/route'
import { TodoDetailView } from './routes/dash/routes/todos/routes/$todoId/view'
import { TodosView } from './routes/dash/routes/todos/view'
import { usersRoute } from './routes/users/route'
import { userDetailRoute } from './routes/users/routes/$userId/route'
import { UserDetailView } from './routes/users/routes/$userId/view'
import { UsersView } from './routes/users/view'

export const leftRoot = createRootRoute({
  component: () => <Outlet />,
})

usersRoute.update({ component: UsersView })
userDetailRoute.update({ component: UserDetailView })
todosRoute.update({ component: TodosView })
todoDetailRoute.update({ component: TodoDetailView })

export const leftPanelTree = leftRoot.addChildren([
  dashRoute.addChildren([dashIndexRoute, todosRoute, todoDetailRoute]),
  usersRoute,
  userDetailRoute,
])

export const getLeftRouter = createPanelRouter(leftPanelTree, '/dash')

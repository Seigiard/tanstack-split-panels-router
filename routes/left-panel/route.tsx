import {
  createRootRoute,
  createRouter,
  createMemoryHistory,
  Outlet,
} from '@tanstack/react-router'

import { RoutePending } from '@/routes/components/RoutePending'

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

export function createLeftRouter(initialPath: string = '/dash') {
  return createRouter({
    routeTree: leftPanelTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    defaultPendingComponent: RoutePending,
    defaultPendingMs: 200,
  })
}

let _leftRouter: ReturnType<typeof createLeftRouter> | null = null

export function getLeftRouter(
  initialPath: string = '/dash',
): ReturnType<typeof createLeftRouter> {
  if (!_leftRouter) {
    _leftRouter = createLeftRouter(initialPath)
  }
  return _leftRouter
}

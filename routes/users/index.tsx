import type { User } from '@/lib/api-types'
import { createRoute, useRouteContext } from '@tanstack/react-router'

import { beforeLoadLog } from '@/lib/logger'
import { panels } from '@/lib/panels'
import { wait } from '@/utils/wait'

import { usersRoute } from './route'

export type { User }

export const usersIndexRoute = createRoute({
  getParentRoute: () => usersRoute,
  path: '/',
  beforeLoad: ({ cause }) => {
    beforeLoadLog(cause, 'main:/users')

    return {
      label: 'User [beforeLoad context]',
      description: 'List of users [beforeLoad context]',
    }
  },
  loader: async (): Promise<User[]> => {
    await wait(1000)
    const res = await fetch('https://dummyjson.com/users?limit=20')
    const data: { users: User[] } = await res.json()
    return data.users
  },
  component: UsersView,
})

function UsersView() {
  const ctx = useRouteContext({ from: usersIndexRoute.id })
  const users = usersIndexRoute.useLoaderData() as User[]

  return (
    <>
      <hgroup>
        <h1>{ctx.label}</h1>
        <p>{ctx.description}</p>
      </hgroup>
      <ul>
        {users.map((user) => (
          <li>
            <dl>
              <dt>
                <panels.MainLink
                  key={user.id}
                  to='/users/$userId'
                  params={{ userId: String(user.id) }}
                >
                  {user.firstName} {user.lastName}
                </panels.MainLink>{' '}
                {user.email}
              </dt>
              <dd>
                {user.address.city}, {user.address.state}
              </dd>
            </dl>
          </li>
        ))}
      </ul>
    </>
  )
}

import type { User } from '@/lib/api-types'
import { createRoute } from '@tanstack/react-router'

import { Link } from '@/components/ui/link'
import { beforeLoadLog } from '@/lib/logger'
import { wait } from '@/utils/wait'

import { usersRoute } from './route'

export type { User }

export const usersIndexRoute = createRoute({
  getParentRoute: () => usersRoute,
  path: '/',
  beforeLoad: ({ cause }) => beforeLoadLog(cause, 'main:/users'),
  loader: async (): Promise<User[]> => {
    await wait(1000)
    const res = await fetch('https://dummyjson.com/users?limit=20')
    const data: { users: User[] } = await res.json()
    return data.users
  },
  component: UsersView,
})

function UsersView() {
  const users = usersIndexRoute.useLoaderData() as User[]

  return (
    <div style={{ maxWidth: '56rem', padding: '2rem' }}>
      <h2>Users</h2>
      <div className='user-list'>
        {users.map((user) => (
          <Link
            key={user.id}
            to='/users/$userId'
            params={{ userId: String(user.id) }}
          >
            <div>
              <strong>
                {user.firstName} {user.lastName}
              </strong>
              <div>{user.email}</div>
            </div>
            <div>
              {user.address.city}, {user.address.state}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

import type { User } from '@/lib/api-types'

import { Link } from '@/components/ui/link'

import { usersIndexRoute } from './index'

export function UsersView() {
  const users = usersIndexRoute.useLoaderData() as User[]

  return (
    <div className='max-w-4xl p-8'>
      <h2 className='mb-4 text-xl font-bold'>Users</h2>
      <div className='grid gap-3'>
        {users.map((user) => (
          <Link
            key={user.id}
            to={`/users/${user.id}`}
            className='flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50'
          >
            <div>
              <div className='font-medium'>
                {user.firstName} {user.lastName}
              </div>
              <div className='text-sm text-muted-foreground'>{user.email}</div>
            </div>
            <div className='text-sm text-muted-foreground'>
              {user.address.city}, {user.address.state}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

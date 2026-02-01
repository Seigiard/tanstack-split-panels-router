import type { User } from './route'

import { LinkLeftPanel } from '@/components/ui/link'

import { usersRoute } from './route'

export function UsersView() {
  const users = usersRoute.useLoaderData() as User[]

  return (
    <div className='space-y-1'>
      <h3 className='mb-2 text-sm font-semibold'>Users</h3>
      <ul className='space-y-1'>
        {users.map((user) => (
          <li key={user.id}>
            <LinkLeftPanel
              to={`/users/${user.id}`}
              className='block w-full rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted'
            >
              <span className='font-medium'>
                {user.firstName} {user.lastName}
              </span>
              <span className='ml-2 text-muted-foreground'>
                {user.company.jobTitle}
              </span>
            </LinkLeftPanel>
          </li>
        ))}
      </ul>
    </div>
  )
}

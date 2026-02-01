import type { User } from '@/routes/left-panel/routes/users/route'

import { LinkLeftPanel } from '@/components/ui/link'

import { userDetailRoute } from './route'

export function UserDetailView() {
  const user = userDetailRoute.useLoaderData() as User

  return (
    <div className='space-y-4'>
      <LinkLeftPanel
        to='/users'
        className='inline-flex items-center text-sm text-muted-foreground hover:text-foreground'
      >
        &larr; Back to users
      </LinkLeftPanel>

      <div>
        <h3 className='text-sm font-semibold'>
          {user.firstName} {user.lastName}
        </h3>
        <p className='mt-1 text-sm text-muted-foreground'>{user.email}</p>
      </div>

      <div className='space-y-2 text-sm'>
        <div>
          <span className='font-medium'>Company:</span>{' '}
          <span className='text-muted-foreground'>{user.company.name}</span>
        </div>
        <div>
          <span className='font-medium'>Role:</span>{' '}
          <span className='text-muted-foreground'>{user.company.jobTitle}</span>
        </div>
        <div>
          <span className='font-medium'>Phone:</span>{' '}
          <span className='text-muted-foreground'>{user.phone}</span>
        </div>
        <div>
          <span className='font-medium'>Location:</span>{' '}
          <span className='text-muted-foreground'>
            {user.address.city}, {user.address.state}
          </span>
        </div>
        <div>
          <span className='font-medium'>Age:</span>{' '}
          <span className='text-muted-foreground'>{user.age}</span>
        </div>
      </div>
    </div>
  )
}

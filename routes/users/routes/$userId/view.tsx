import type { User } from '@/routes/users/route'

import { Link } from '@/components/ui/link'

import { userDetailRoute } from './route'

export function UserDetailView() {
  const user = userDetailRoute.useLoaderData() as User

  return (
    <div className='max-w-2xl p-8'>
      <Link
        to='/users'
        className='inline-flex items-center text-sm text-muted-foreground hover:text-foreground'
      >
        &larr; Back to users
      </Link>

      <div className='mt-4 space-y-3'>
        <h2 className='text-xl font-bold'>
          {user.firstName} {user.lastName}
        </h2>

        <div className='space-y-2 text-sm'>
          <div>
            <span className='font-medium'>Email:</span>{' '}
            <span className='text-muted-foreground'>{user.email}</span>
          </div>
          <div>
            <span className='font-medium'>Phone:</span>{' '}
            <span className='text-muted-foreground'>{user.phoneNumber}</span>
          </div>
          <div>
            <span className='font-medium'>Date of birth:</span>{' '}
            <span className='text-muted-foreground'>
              {new Date(user.dateOfBirth).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className='font-medium'>Address:</span>{' '}
            <span className='text-muted-foreground'>
              {user.address.street}, {user.address.city}, {user.address.state}{' '}
              {user.address.postalCode}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

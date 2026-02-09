import type { User } from '@/lib/api-types'
import { createRoute } from '@tanstack/react-router'

import { beforeLoadLog } from '@/lib/logger'
import { Breadcrumbs } from '@/routes/components/Breadcrumbs'
import { usersRoute } from '@/routes/left-panel/routes/users/route'
import { wait } from '@/utils/wait'

export const userDetailRoute = createRoute({
  getParentRoute: () => usersRoute,
  path: '/$userId',
  staticData: {
    breadcrumb: ({ loaderData }) => {
      const user = loaderData as User | undefined
      return user ? `${user.firstName} ${user.lastName}` : undefined
    },
  },
  beforeLoad: ({ cause, params }) =>
    beforeLoadLog(cause, `left:/users/${params.userId}`),
  loader: async ({ params }): Promise<User> => {
    await wait(1000)
    const res = await fetch(`https://dummyjson.com/users/${params.userId}`)
    return res.json()
  },
  component: UserDetailView,
})

function UserDetailView() {
  const user = userDetailRoute.useLoaderData() as User

  return (
    <div className='space-y-4'>
      <Breadcrumbs />

      <div className='flex items-start gap-3'>
        <img
          src={user.image}
          alt={`${user.firstName} ${user.lastName}`}
          className='h-12 w-12 rounded-full'
        />
        <div>
          <h3 className='text-sm font-semibold'>
            {user.firstName} {user.lastName}
          </h3>
          <p className='mt-0.5 text-sm text-muted-foreground'>{user.email}</p>
        </div>
      </div>

      <div className='space-y-2 text-sm'>
        <div>
          <span className='font-medium'>Company:</span>{' '}
          <span className='text-muted-foreground'>{user.company.name}</span>
        </div>
        <div>
          <span className='font-medium'>Role:</span>{' '}
          <span className='text-muted-foreground'>{user.company.title}</span>
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

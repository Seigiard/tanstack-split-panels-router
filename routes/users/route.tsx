import { createRoute } from '@tanstack/react-router'

import { beforeLoadLog } from '@/lib/logger'
import { rootRoute } from '@/routes/route'

export type User = {
  userId: number
  firstName: string
  lastName: string
  dateOfBirth: string
  address: {
    street: string
    city: string
    state: string
    countryCode: string
    postalCode: string
  }
  phoneNumber: string
  email: string
}

export const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  beforeLoad: ({ cause }) => beforeLoadLog(cause, 'main:/users'),
  loader: async (): Promise<User[]> => {
    const res = await fetch('https://json-mock.org/api/users')
    return res.json()
  },
})

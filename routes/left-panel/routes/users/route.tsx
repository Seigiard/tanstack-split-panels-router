import { createRoute } from '@tanstack/react-router'

import { beforeLoadLog } from '@/lib/logger'
import { leftRoot } from '@/routes/left-panel/route'

export type User = {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  username: string
  age: number
  gender: string
  company: { name: string; jobTitle: string }
  address: {
    street: string
    city: string
    state: string
    country: string
    zipcode: string
  }
}

export const usersRoute = createRoute({
  getParentRoute: () => leftRoot,
  path: '/users',
  beforeLoad: ({ cause }) => beforeLoadLog(cause, 'left:/users'),
  loader: async (): Promise<User[]> => {
    const res = await fetch('https://fake.jsonmockapi.com/users?length=10')
    return res.json()
  },
})

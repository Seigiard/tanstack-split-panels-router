import { createRoute } from '@tanstack/react-router'
import { beforeLoadLog } from '../lib/logger'
import { rootRoute } from './route'

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: ({ cause }) => beforeLoadLog(cause, 'main:/'),
  component: function IndexPage() {
    return (
      <div className='p-8 text-center'>
        <h1 className='text-2xl font-bold mb-4'>Split-State Router POC</h1>
        <p className='text-muted-foreground'>Normal mode — no panels</p>
      </div>
    )
  },
})

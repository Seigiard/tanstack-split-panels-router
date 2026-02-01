import { useRouteContext } from '@tanstack/react-router'
import { homeRoute } from './route'

export function HomeView() {
  const ctx = useRouteContext({ from: homeRoute.id })
  return (
    <div className='p-8'>
      <h1 className='text-2xl font-bold'>{ctx.label}</h1>
      <p className='text-muted-foreground mt-2'>{ctx.description}</p>
    </div>
  )
}

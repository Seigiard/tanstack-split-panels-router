import { useRouteContext } from '@tanstack/react-router'

export function Sub1View() {
  const ctx = useRouteContext({ strict: false }) as {
    label: string
    tag: string
  }
  return (
    <p className='py-4'>
      {ctx.label}{' '}
      <span className='text-xs text-muted-foreground'>({ctx.tag})</span>
    </p>
  )
}

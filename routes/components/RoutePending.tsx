export function RoutePending() {
  return (
    <div className='flex items-center gap-2 p-4 text-sm text-muted-foreground'>
      <div className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
      <span>Loading…</span>
    </div>
  )
}

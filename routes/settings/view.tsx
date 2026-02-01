import { Outlet } from '@tanstack/react-router'

export function SettingsLayout() {
  return (
    <div className='p-8'>
      <h2 className='mb-4 text-xl font-bold'>Settings</h2>
      <Outlet />
    </div>
  )
}

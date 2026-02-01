import { Outlet } from '@tanstack/react-router'

export function SettingsLayout() {
  return (
    <div className='p-8'>
      <h2 className='text-xl font-bold mb-4'>Settings</h2>
      <Outlet />
    </div>
  )
}

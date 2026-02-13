import { useLocation } from '@tanstack/react-router'

import { panels } from '@/lib/panels'

export function AppSidebar() {
  const location = useLocation()
  const { isPanelMode } = panels.usePanel()

  return (
    <aside data-expandable='☰ Quick navigation'>
      <nav>
        <ul>
          <li>
            <panels.MainLink
              to='/'
              aria-current={
                !isPanelMode && location.pathname === '/' ? 'page' : undefined
              }
            >
              Home
            </panels.MainLink>
          </li>
          <li>
            <panels.MainLink
              to='/features'
              aria-current={
                !isPanelMode && location.pathname.startsWith('/features')
                  ? 'page'
                  : undefined
              }
            >
              Features
            </panels.MainLink>
          </li>
          <li>
            <panels.MainLink
              to='/users'
              aria-current={
                !isPanelMode && location.pathname.startsWith('/users')
                  ? 'page'
                  : undefined
              }
            >
              Users
            </panels.MainLink>
          </li>
          <li>
            <panels.Link
              left='/categories'
              aria-current={isPanelMode ? 'page' : undefined}
            >
              Products
            </panels.Link>
          </li>
        </ul>
      </nav>
    </aside>
  )
}

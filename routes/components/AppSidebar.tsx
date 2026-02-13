import { useLocation } from '@tanstack/react-router'
import { TbHome, TbListCheck, TbUsers, TbColumns } from 'react-icons/tb'

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
              <TbHome />
              <span>Home</span>
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
              <TbListCheck />
              <span>Features</span>
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
              <TbUsers />
              <span>Users</span>
            </panels.MainLink>
          </li>
          <li>
            <panels.Link
              left='/categories'
              aria-current={isPanelMode ? 'page' : undefined}
            >
              <TbColumns />
              <span>Products</span>
            </panels.Link>
          </li>
        </ul>
      </nav>
    </aside>
  )
}

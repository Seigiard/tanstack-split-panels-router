import { useLocation } from '@tanstack/react-router'
import { TbHome, TbListCheck, TbUsers, TbColumns } from 'react-icons/tb'

import { Link } from '@/components/ui/link'
import { panels } from '@/lib/panels'

export function AppSidebar() {
  const location = useLocation()
  const { isPanelMode } = panels.usePanel()

  return (
    <aside data-expandable='☰ Quick navigation'>
      <div className='app-sidebar-brand'>SplitState</div>
      <nav>
        <ul>
          <li>
            <Link
              to='/'
              aria-current={
                !isPanelMode && location.pathname === '/' ? 'page' : undefined
              }
            >
              <TbHome />
              <span>Home</span>
            </Link>
          </li>
          <li>
            <Link
              to='/features'
              aria-current={
                !isPanelMode && location.pathname.startsWith('/features')
                  ? 'page'
                  : undefined
              }
            >
              <TbListCheck />
              <span>Features</span>
            </Link>
          </li>
          <li>
            <Link
              to='/users'
              aria-current={
                !isPanelMode && location.pathname.startsWith('/users')
                  ? 'page'
                  : undefined
              }
            >
              <TbUsers />
              <span>Users</span>
            </Link>
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

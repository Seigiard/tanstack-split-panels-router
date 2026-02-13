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
            <ul>
              <li>
                <panels.MainLink
                  to='/docs/$docId'
                  params={{ docId: 'quickstart' }}
                  aria-current={
                    !isPanelMode && location.pathname === '/docs/quickstart'
                      ? 'page'
                      : undefined
                  }
                >
                  Quick Start
                </panels.MainLink>
              </li>
              <li>
                <panels.MainLink
                  to='/docs/$docId'
                  params={{ docId: 'features' }}
                  aria-current={
                    !isPanelMode && location.pathname === '/docs/features'
                      ? 'page'
                      : undefined
                  }
                >
                  Features
                </panels.MainLink>
              </li>
              <li>
                <panels.MainLink
                  to='/docs/$docId'
                  params={{ docId: 'architecture' }}
                  aria-current={
                    !isPanelMode && location.pathname === '/docs/architecture'
                      ? 'page'
                      : undefined
                  }
                >
                  Architecture
                </panels.MainLink>
              </li>
              <li>
                <panels.MainLink
                  to='/docs/$docId'
                  params={{ docId: 'guides' }}
                  aria-current={
                    !isPanelMode && location.pathname === '/docs/guides'
                      ? 'page'
                      : undefined
                  }
                >
                  Guides
                </panels.MainLink>
              </li>
              <li>
                <panels.MainLink
                  to='/docs/$docId'
                  params={{ docId: 'api-reference' }}
                  aria-current={
                    !isPanelMode && location.pathname === '/docs/api-reference'
                      ? 'page'
                      : undefined
                  }
                >
                  API Reference
                </panels.MainLink>
              </li>
            </ul>
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

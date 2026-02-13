import { useLocation } from '@tanstack/react-router'

import { panels } from '@/lib/panels'

const DOC_LINKS = [
  { docId: '01-quickstart', title: 'Quick Start' },
  { docId: '02-features', title: 'Features' },
  { docId: '03-architecture', title: 'Architecture' },
  { docId: '04-guides', title: 'Guides' },
  { docId: '05-api-reference', title: 'API Reference' },
]

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
              {DOC_LINKS.map(({ docId, title }) => (
                <li key={docId}>
                  <panels.MainLink
                    to='/docs/$docId'
                    params={{ docId }}
                    aria-current={
                      !isPanelMode && location.pathname === `/docs/${docId}`
                        ? 'page'
                        : undefined
                    }
                  >
                    {title}
                  </panels.MainLink>
                </li>
              ))}
            </ul>
          </li>
          <li>
            <panels.Link left='/categories'>Example</panels.Link>
          </li>
        </ul>
      </nav>
    </aside>
  )
}

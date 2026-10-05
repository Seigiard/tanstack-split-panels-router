import '@/lib/panel-system/breadcrumb'

import { Link, useMatches } from '@tanstack/react-router'
import { Fragment, type MouseEvent } from 'react'
import { TbChevronRight } from 'react-icons/tb'
import { z } from 'zod'

import { panels } from '@/lib/panels'
import { mainRouter } from '@/routes/route'

type Crumb = { path: string; label: string }

export function Breadcrumbs() {
  const matches = useMatches()

  let currentPanel: { name: string; navigate: (to: string) => void } | null =
    null

  try {
    currentPanel = panels.useCurrentPanel()
  } catch {
    // Not inside a panel — use main router links
  }

  const crumbs: Crumb[] = []

  for (const match of matches) {
    const bc = match.staticData.breadcrumb

    if (!bc) continue

    const label =
      bc instanceof Function
        ? bc({
            params: z.record(z.string(), z.string()).parse(match.params),
            loaderData: match.loaderData,
          })
        : bc

    if (label) crumbs.push({ path: match.pathname, label })
  }

  if (crumbs.length <= 1) return null

  return (
    <nav>
      <ul>
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1

          return (
            <Fragment key={crumb.path}>
              <li>
                {isLast ? (
                  crumb.label
                ) : currentPanel ? (
                  <PanelCrumbLink
                    path={crumb.path}
                    label={crumb.label}
                    panelName={currentPanel.name}
                    navigate={currentPanel.navigate}
                  />
                ) : (
                  // SAFETY: crumb.path is the pathname of a matched main route.
                  <Link
                    to={crumb.path as '/'}
                    search={{ left: undefined, right: undefined }}
                  >
                    {crumb.label}
                  </Link>
                )}
              </li>
              {!isLast && (
                <li>
                  <TbChevronRight />
                </li>
              )}
            </Fragment>
          )
        })}
      </ul>
    </nav>
  )
}

function PanelCrumbLink({
  path,
  label,
  panelName,
  navigate,
}: {
  path: string
  label: string
  panelName: string
  navigate: (to: string) => void
}) {
  const href = mainRouter.buildLocation({
    to: '/',
    search: (prev) => ({
      ...prev,
      [panelName]: path,
    }),
  }).href

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return
    e.preventDefault()
    navigate(path)
  }

  return (
    <a href={href} onClick={handleClick}>
      {label}
    </a>
  )
}

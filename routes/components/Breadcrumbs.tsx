import '@/lib/breadcrumb'

import { Link, useMatches } from '@tanstack/react-router'
import { Fragment, useContext, type MouseEvent } from 'react'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { PanelContext } from '@/lib/panel-context'
import { mainRouter } from '@/routes/route'

type Crumb = { path: string; label: string }

export function Breadcrumbs() {
  const matches = useMatches()
  const panelNav = useContext(PanelContext)

  const crumbs: Crumb[] = []
  for (const match of matches) {
    const bc = (match.staticData as { breadcrumb?: unknown }).breadcrumb
    if (!bc) continue

    const label =
      typeof bc === 'function'
        ? (
            bc as (m: {
              params: Record<string, string>
              loaderData: unknown
            }) => string | undefined
          )({
            params: match.params as Record<string, string>,
            loaderData: match.loaderData,
          })
        : (bc as string)

    if (label) crumbs.push({ path: match.pathname, label })
  }

  if (crumbs.length <= 1) return null

  return (
    <Breadcrumb className='mb-3'>
      <BreadcrumbList>
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1
          return (
            <Fragment key={crumb.path}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : panelNav ? (
                  <PanelCrumbLink path={crumb.path} label={crumb.label} />
                ) : (
                  <Link
                    to={crumb.path as '/'}
                    search={{ left: undefined, right: undefined }}
                    className='transition-colors hover:text-foreground'
                  >
                    {crumb.label}
                  </Link>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

function PanelCrumbLink({ path, label }: { path: string; label: string }) {
  const panelNav = useContext(PanelContext)

  const href = mainRouter.buildLocation({
    to: '/',
    search: (prev: Record<string, unknown>) => ({
      left: path,
      right: (prev as { right?: string }).right ?? undefined,
    }),
  }).href

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return
    if (!panelNav) return
    e.preventDefault()
    panelNav.navigateLeft(path)
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className='transition-colors hover:text-foreground'
    >
      {label}
    </a>
  )
}

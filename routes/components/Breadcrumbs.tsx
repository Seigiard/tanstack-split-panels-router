import '@/lib/breadcrumb'

import {
  Link,
  useMatches,
  useRouter,
  type AnyRoute,
} from '@tanstack/react-router'
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

function buildCrumbs(
  router: { routesById: Record<string, AnyRoute> },
  currentMatch: {
    fullPath: string
    params: Record<string, unknown>
    loaderData: unknown
  },
): Crumb[] {
  const currentFullPath = currentMatch.fullPath as string
  const segments = currentFullPath.split('/').filter(Boolean)

  const prefixPatterns = segments.map(
    (_, i) => '/' + segments.slice(0, i + 1).join('/'),
  )

  const allRoutes = Object.values(router.routesById) as AnyRoute[]
  const crumbs: Crumb[] = []

  for (const pattern of prefixPatterns) {
    const route = allRoutes.find((r) => r.fullPath === pattern)
    if (!route) continue

    const bc = (route.options as { staticData?: { breadcrumb?: unknown } })
      .staticData?.breadcrumb
    if (!bc) continue

    const resolvedPath = pattern.replace(/\$(\w+)/g, (_, key) =>
      String(currentMatch.params[key] ?? ''),
    )

    const isCurrentRoute = pattern === currentFullPath
    let label: string | undefined
    if (typeof bc === 'function') {
      label = (
        bc as (m: {
          params: Record<string, string>
          loaderData: unknown
        }) => string | undefined
      )({
        params: currentMatch.params as Record<string, string>,
        loaderData: isCurrentRoute ? currentMatch.loaderData : undefined,
      })
    } else {
      label = bc as string
    }

    if (label) crumbs.push({ path: resolvedPath, label })
  }

  return crumbs
}

export function Breadcrumbs() {
  const router = useRouter()
  const matches = useMatches()
  const panelNav = useContext(PanelContext)

  const currentMatch = matches[matches.length - 1]
  if (!currentMatch) return null

  const crumbs = buildCrumbs(
    router,
    currentMatch as {
      fullPath: string
      params: Record<string, unknown>
      loaderData: unknown
    },
  )

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

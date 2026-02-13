import type { PanelRouter, PanelRouterFactory } from './types'
import type { AnyRoute, RouteComponent } from '@tanstack/react-router'
import { createRouter, createMemoryHistory } from '@tanstack/react-router'

// ─── URL parsing ──────────────────────────────────────────────────

export function parsePanelValue(value: string): {
  pathname: string
  searchString: string
} {
  const qIndex = value.indexOf('?')
  if (qIndex === -1) return { pathname: value, searchString: '' }
  return {
    pathname: value.substring(0, qIndex),
    searchString: value.substring(qIndex),
  }
}

export function buildPanelValue(
  pathname: string,
  search?: Record<string, string>,
): string {
  if (!search || Object.keys(search).length === 0) return pathname
  const filtered = Object.fromEntries(
    Object.entries(search).filter(([, v]) => v !== ''),
  )
  if (Object.keys(filtered).length === 0) return pathname
  const qs = new URLSearchParams(filtered).toString()
  return `${pathname}?${qs}`
}

// ─── Path resolution ──────────────────────────────────────────────

export function resolvePath(
  to: string,
  params?: Record<string, string>,
): string {
  if (!params) return to
  return to.replace(/\$([^/]+)/g, (_, key: string) => {
    const value = params[key]
    if (value === undefined) {
      throw new Error(
        `Missing param "${key}" for path "${to}". Got params: ${JSON.stringify(params)}`,
      )
    }
    return encodeURIComponent(value)
  })
}

// ─── Panel router navigation ─────────────────────────────────────

export function panelNavigate(router: PanelRouter, panelValue: string): void {
  const { pathname, searchString } = parsePanelValue(panelValue)
  const searchParams = searchString
    ? Object.fromEntries(new URLSearchParams(searchString))
    : undefined
  ;(
    router.navigate as (opts: {
      to: string
      search?: Record<string, string>
    }) => void
  )({ to: pathname, ...(searchParams ? { search: searchParams } : {}) })
}

// ─── Router factory ───────────────────────────────────────────────

export function createPanelRouterFactory(
  routeTree: AnyRoute,
  pendingComponent?: RouteComponent,
): PanelRouterFactory {
  let instance: PanelRouter | null = null

  return (initialPath?: string) => {
    if (!instance) {
      instance = createRouter({
        routeTree,
        history: createMemoryHistory({
          initialEntries: [initialPath ?? '/'],
        }),
        ...(pendingComponent
          ? { defaultPendingComponent: pendingComponent, defaultPendingMs: 200 }
          : {}),
      })
    }
    return instance
  }
}

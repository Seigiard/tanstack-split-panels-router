import type { PanelLinkTarget, PanelMap, SystemLinkProps } from './types'
import { Link as TanStackLink } from '@tanstack/react-router'
import { useContext, useMemo, type MouseEvent } from 'react'

import { buildPanelValue, resolvePath } from './panel-utils'
import { PanelSystemContext } from './system-provider'

// ─── Multi-panel Link factory ─────────────────────────────────────

function resolveTarget(target: PanelLinkTarget<any>): string | false {
  if (target === false) return false
  if (typeof target === 'string') return target
  const resolved = resolvePath(target.to, target.params)
  return target.search ? buildPanelValue(resolved, target.search) : resolved
}

export function createSystemLink<TPanels extends PanelMap>(
  panelNames: string[],
): React.ComponentType<SystemLinkProps<TPanels>> {
  function SystemLink(props: SystemLinkProps<TPanels>) {
    const { children, className, ...panelTargets } = props
    const ctx = useContext(PanelSystemContext)

    const href = useMemo(() => {
      if (!ctx?.mainRouter) return '/'
      return ctx.mainRouter.buildLocation({
        to: '/',
        search: (prev: Record<string, unknown>) => {
          const next: Record<string, string | undefined> = {}
          for (const name of panelNames) {
            const target = (panelTargets as Record<string, unknown>)[name]
            if (target === undefined) {
              next[name] = (prev as Record<string, string | undefined>)[name]
            } else if (target === false) {
              next[name] = undefined
            } else {
              next[name] =
                resolveTarget(target as PanelLinkTarget<any>) || undefined
            }
          }
          return next
        },
      }).href
    }, [ctx, panelTargets])

    const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return
      if (!ctx) return
      e.preventDefault()

      for (const name of panelNames) {
        const target = (panelTargets as Record<string, unknown>)[name]
        if (target === undefined) continue
        if (target === false) {
          ctx.closePanel(name)
        } else {
          const resolved = resolveTarget(target as PanelLinkTarget<any>)
          if (resolved !== false) {
            ctx.navigatePanel(name, resolved)
          }
        }
      }
    }

    return (
      <a href={href} className={className} onClick={handleClick}>
        {children}
      </a>
    )
  }

  return SystemLink
}

// ─── MainLink factory ─────────────────────────────────────────────

export function createMainLink(panelNames: string[]): React.ComponentType<{
  to: string
  children?: React.ReactNode
  className?: string
}> {
  function MainLink({
    to,
    children,
    className,
  }: {
    to: string
    children?: React.ReactNode
    className?: string
  }) {
    const clearSearch: Record<string, string | undefined> = {}
    for (const key of panelNames) {
      clearSearch[key] = undefined
    }

    return (
      <TanStackLink
        to={to as '/'}
        search={clearSearch as unknown as Record<string, string>}
        className={className}
      >
        {children}
      </TanStackLink>
    )
  }

  return MainLink
}

import type { LeftPanelPaths } from '@/lib/panel-context'
import { Link as TanStackLink } from '@tanstack/react-router'
import { useContext, useMemo, type MouseEvent } from 'react'

import { PanelContext } from '@/lib/panel-context'
import { buildPanelValue } from '@/lib/panel-url'
import { mainRouter } from '@/routes/route'

interface LinkProps {
  to?: string
  children?: React.ReactNode
  className?: string
}

export function Link({
  to,
  children,
  className,
}: LinkProps): React.JSX.Element {
  return (
    <TanStackLink
      to={(to ?? '/') as '/'}
      search={
        { left: undefined, right: undefined } as {
          left: string | undefined
          right: string | undefined
        }
      }
      className={className}
    >
      {children}
    </TanStackLink>
  )
}

interface LinkPanelsProps {
  left: LeftPanelPaths
  right?: string
  children?: React.ReactNode
  className?: string
}

export function LinkPanels({
  left,
  right,
  children,
  className,
}: LinkPanelsProps): React.JSX.Element {
  return (
    <TanStackLink
      to='/'
      search={
        { left, right: right ?? undefined } as {
          left: string | undefined
          right: string | undefined
        }
      }
      className={className}
    >
      {children}
    </TanStackLink>
  )
}

interface LinkLeftPanelProps {
  to: LeftPanelPaths | (string & {})
  search?: Record<string, string>
  children: React.ReactNode
  className?: string
}

export function LinkLeftPanel({
  to,
  search,
  children,
  className,
}: LinkLeftPanelProps): React.JSX.Element {
  const panelNav = useContext(PanelContext)
  const panelValue = useMemo(
    () => (search ? buildPanelValue(to, search) : to),
    [to, search],
  )

  const href = mainRouter.buildLocation({
    to: '/',
    search: (prev: Record<string, unknown>) => ({
      left: panelValue,
      right: (prev as { right?: string }).right ?? undefined,
    }),
  }).href

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return
    if (!panelNav) return
    e.preventDefault()
    panelNav.navigateLeft(panelValue)
  }

  return (
    <a href={href} className={className} onClick={handleClick}>
      {children}
    </a>
  )
}

interface LinkRightPanelProps {
  to: string
  children: React.ReactNode
  className?: string
}

export function LinkRightPanel({
  to,
  children,
  className,
}: LinkRightPanelProps): React.JSX.Element {
  const panelNav = useContext(PanelContext)

  const href = mainRouter.buildLocation({
    to: '/',
    search: (prev: Record<string, unknown>) => ({
      left: (prev as { left?: string }).left ?? undefined,
      right: to,
    }),
  }).href

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return
    if (!panelNav) return
    e.preventDefault()
    panelNav.navigateRight(to)
  }

  return (
    <a href={href} className={className} onClick={handleClick}>
      {children}
    </a>
  )
}

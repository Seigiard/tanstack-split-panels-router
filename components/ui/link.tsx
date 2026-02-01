import type { MouseEvent } from 'react'
import { Link as TanStackLink, type LinkProps as TanStackLinkProps } from '@tanstack/react-router'
import { mainRouter } from '@/routes/route'
import { usePanelNav } from '@/lib/panel-context'
import type { LeftPanelPaths } from '@/lib/panel-context'

type BaseLinkProps = Omit<TanStackLinkProps, 'search'>

export function Link(props: BaseLinkProps): React.JSX.Element {
  return (
    <TanStackLink
      {...props}
      search={{ left: undefined, right: undefined } as Record<string, unknown>}
    />
  )
}

interface LinkPanelsProps extends Omit<TanStackLinkProps, 'to' | 'search'> {
  left: LeftPanelPaths
  right?: string
}

export function LinkPanels({ left, right, ...props }: LinkPanelsProps): React.JSX.Element {
  return (
    <TanStackLink
      {...props}
      to="/"
      search={{ left, right: right ?? undefined } as Record<string, unknown>}
    />
  )
}

interface LinkLeftPanelProps {
  to: LeftPanelPaths
  children: React.ReactNode
  className?: string
}

export function LinkLeftPanel({ to, children, className }: LinkLeftPanelProps): React.JSX.Element {
  const { navigateLeft } = usePanelNav()

  const href = mainRouter.buildLocation({
    to: '/',
    search: (prev: Record<string, unknown>) => ({ left: to, right: (prev as { right?: string }).right ?? undefined }),
  }).href

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return
    e.preventDefault()
    navigateLeft(to)
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

export function LinkRightPanel({ to, children, className }: LinkRightPanelProps): React.JSX.Element {
  const { navigateRight } = usePanelNav()

  const href = mainRouter.buildLocation({
    to: '/',
    search: (prev: Record<string, unknown>) => ({ left: (prev as { left?: string }).left ?? undefined, right: to }),
  }).href

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return
    e.preventDefault()
    navigateRight(to)
  }

  return (
    <a href={href} className={className} onClick={handleClick}>
      {children}
    </a>
  )
}

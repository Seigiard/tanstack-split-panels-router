import React from 'react'
import type { LeftPanelPaths } from '../lib/panel-context'
import { usePanelNav } from '../lib/panel-context'
import { Button } from './ui/button'

interface PanelLinkProps<TPaths extends string> {
  to: TPaths
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

export function LinkLeft({ to, children, variant = 'outline', size = 'sm', className }: PanelLinkProps<LeftPanelPaths>) {
  const { navigateLeft } = usePanelNav()
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => navigateLeft(to)}
    >
      {children}
    </Button>
  )
}

export function LinkRight({ to, children, variant = 'outline', size = 'sm', className }: PanelLinkProps<string>) {
  const { navigateRight } = usePanelNav()
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => navigateRight(to)}
    >
      {children}
    </Button>
  )
}

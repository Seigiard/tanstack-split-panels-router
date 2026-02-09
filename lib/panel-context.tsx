import type { leftPanelTree } from '../routes/left-panel'
import type { rightPanelTree } from '../routes/right-panel'
import type { RoutePaths } from '@tanstack/router-core'
import { createContext, useContext } from 'react'

export type LeftPanelPaths = RoutePaths<typeof leftPanelTree>
export type RightPanelPaths = RoutePaths<typeof rightPanelTree>

export interface PanelNavigators {
  navigateLeft: (to: LeftPanelPaths | (string & {})) => void
  navigateRight: (to: string) => void
  showLeft: (to: LeftPanelPaths | (string & {})) => void
  closeLeft: () => void
  showRight: (to: string) => void
  closeRight: () => void
  navigateMain: (to: string) => void
  isLeftOpen: boolean
  isRightOpen: boolean
}

export const PanelContext = createContext<PanelNavigators | null>(null)

export function usePanelNav(): PanelNavigators {
  const ctx = useContext(PanelContext)
  if (!ctx) throw new Error('usePanelNav must be used within PanelShell')
  return ctx
}

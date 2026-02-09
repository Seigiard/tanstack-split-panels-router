import type { leftPanelTree } from '../routes/left-panel/route'
import type { rightPanelTree } from '../routes/right-panel/route'
import type { RoutePaths } from '@tanstack/router-core'
import { createContext, useContext } from 'react'

export type LeftPanelPaths = RoutePaths<typeof leftPanelTree>
export type RightPanelPaths = RoutePaths<typeof rightPanelTree>

export interface PanelNavigators {
  navigateLeft: (to: LeftPanelPaths | (string & {})) => void
  navigateRight: (to: string) => void
  showRight: (to: string) => void
  closeRight: () => void
  navigateMain: (to: string) => void
}

export const PanelContext = createContext<PanelNavigators | null>(null)

export function usePanelNav(): PanelNavigators {
  const ctx = useContext(PanelContext)
  if (!ctx) throw new Error('usePanelNav must be used within PanelShell')
  return ctx
}

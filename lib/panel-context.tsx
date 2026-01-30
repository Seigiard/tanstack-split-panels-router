import { createContext, useContext } from 'react'
import type { RoutePaths } from '@tanstack/router-core'
import type { leftPanelTree } from '../routes/left-panel'
import type { rightPanelTree } from '../routes/right-panel'
import type { bottomPanelTree } from '../routes/bottom-panel'

export type LeftPanelPaths = RoutePaths<typeof leftPanelTree>
export type RightPanelPaths = RoutePaths<typeof rightPanelTree>
export type BottomPanelPaths = RoutePaths<typeof bottomPanelTree>

export interface PanelNavigators {
  navigateLeft: (to: LeftPanelPaths) => void
  navigateRight: (to: RightPanelPaths) => void
  navigateBottom: (to: BottomPanelPaths) => void
  closeBottom: () => void
  navigateMain: (to: string) => void
}

export const PanelContext = createContext<PanelNavigators | null>(null)

export function usePanelNav(): PanelNavigators {
  const ctx = useContext(PanelContext)
  if (!ctx) throw new Error('usePanelNav must be used within PanelShell')
  return ctx
}

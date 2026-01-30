import { createContext, useContext } from 'react'
import type { RoutePaths } from '@tanstack/router-core'
import type { leftPanelTree } from '../routes/left-panel'
import type { rightPanelTree } from '../routes/right-panel'

export type LeftPanelPaths = RoutePaths<typeof leftPanelTree>
export type RightPanelPaths = RoutePaths<typeof rightPanelTree>

export interface PanelNavigators {
  navigateLeft: (to: LeftPanelPaths) => void
  navigateRight: (to: RightPanelPaths) => void
  navigateMain: (to: string) => void
}

export const PanelContext = createContext<PanelNavigators | null>(null)

export function usePanelNav(): PanelNavigators {
  const ctx = useContext(PanelContext)
  if (!ctx) throw new Error('usePanelNav must be used within PanelShell')
  return ctx
}

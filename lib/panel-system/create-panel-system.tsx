import type {
  PanelMap,
  PanelSystem,
  PanelSystemOptions,
  UsePanelReturn,
} from './types'
import { useContext } from 'react'

import { createMainLink, createSystemLink } from './system-link'
import {
  createSystemProvider,
  PanelSystemContext,
  useCurrentPanel,
} from './system-provider'

export function createPanelSystem<TPanels extends PanelMap>(
  options: PanelSystemOptions<TPanels>,
): PanelSystem<TPanels> {
  const { panels, onNavigate } = options
  const panelNames = Object.keys(panels)

  const Provider = createSystemProvider(panels, onNavigate)
  const Link = createSystemLink<TPanels>(panelNames)
  const MainLink = createMainLink(panelNames)

  function validateSearch(
    search: Record<string, unknown>,
  ): Record<string, string | undefined> {
    const result: Record<string, string | undefined> = {}
    for (const name of panelNames) {
      result[name] =
        typeof search[name] === 'string' ? (search[name] as string) : undefined
    }
    return result
  }

  function usePanel(): UsePanelReturn<TPanels> {
    const ctx = useContext(PanelSystemContext)
    if (!ctx) {
      throw new Error('usePanel must be used within panels.Provider')
    }

    const result: Record<string, unknown> = {}
    for (const name of panelNames) {
      result[name] = {
        navigate: (to: string, opts?: { search?: Record<string, string> }) =>
          ctx.navigatePanel(name, to, opts),
        close: () => ctx.closePanel(name),
        isOpen: ctx.isPanelOpen(name),
      }
    }

    result.isPanelMode = panelNames.some((name) => ctx.isPanelOpen(name))
    result.navigateMain = ctx.navigateMain

    return result as UsePanelReturn<TPanels>
  }

  return {
    Provider,
    Link,
    MainLink,
    usePanel,
    useCurrentPanel,
    validateSearch,
  }
}

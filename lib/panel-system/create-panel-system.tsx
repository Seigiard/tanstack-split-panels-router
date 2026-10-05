import type {
  PanelMap,
  PanelSystem,
  PanelSystemOptions,
  UsePanelReturn,
  PanelControl,
  PanelControls,
} from './types'
import { useContext } from 'react'

import {
  panelSearchSchema,
  type PanelSearchInput,
  type PanelSearch,
} from './search-schema'
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

  function validateSearch(search: PanelSearchInput) {
    const parsed = panelSearchSchema.parse(search)
    const result: PanelSearch = {}

    for (const name of panelNames) {
      result[name] = parsed[name]
    }

    return result
  }

  function usePanel(): UsePanelReturn<TPanels> {
    const ctx = useContext(PanelSystemContext)

    if (!ctx) {
      throw new Error('usePanel must be used within panels.Provider')
    }

    const result: Record<string, PanelControl> = {}

    for (const name of panelNames) {
      result[name] = {
        navigate: (to: string, opts?: { search?: Record<string, string> }) =>
          ctx.navigatePanel(name, to, opts),
        close: () => ctx.closePanel(name),
        isOpen: ctx.isPanelOpen(name),
      }
    }

    // SAFETY: every key of panels has a PanelControl built in the loop above.
    const controls = result as PanelControls<TPanels>

    return {
      ...controls,
      isPanelMode: panelNames.some((name) => ctx.isPanelOpen(name)),
      navigateMain: ctx.navigateMain,
    }
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

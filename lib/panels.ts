import { leftPanel } from '@/routes/left-panel'
import { rightPanel } from '@/routes/right-panel'

import { logger } from './logger'
import { createPanelSystem } from './panel-system'

export const panels = createPanelSystem({
  panels: { left: leftPanel, right: rightPanel },
  onNavigate: (panel, action, path) => {
    if (action === 'close') {
      logger.log(`[nav:${panel}] closed`, 'navigation')
    } else {
      logger.log(`[nav:${panel}] → ${path}`, 'navigation')
    }
  },
})

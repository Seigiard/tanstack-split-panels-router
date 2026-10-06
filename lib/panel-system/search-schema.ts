import { z } from 'zod'

// TanStack parses query values as JSON. Only string values identify panels.
export const panelSearchSchema = z.record(
  z.string(),
  z.string().optional().catch(undefined),
)

export type PanelSearchInput = z.input<typeof panelSearchSchema>

export type PanelSearch = z.output<typeof panelSearchSchema>

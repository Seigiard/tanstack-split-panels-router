import type { PanelLinkComponent, PanelLinkProps } from './types'
import type { AnyRoute } from '@tanstack/react-router'
import type { RoutePaths } from '@tanstack/router-core'
import { useCallback, useContext, useMemo, type MouseEvent } from 'react'

import { buildPanelValue, resolvePath } from './panel-utils'
import { panelSearchSchema } from './search-schema'
import { PanelSystemContext } from './system-provider'

export function createPanelLink<TTree extends AnyRoute>(
  panelName: string,
): PanelLinkComponent<TTree> {
  function PanelLink<const TTo extends RoutePaths<TTree>>(
    props: PanelLinkProps<TTree, TTo>,
  ): React.ReactElement | null {
    const { to, params, search, children, className } = props

    const ctx = useContext(PanelSystemContext)

    const resolvedPath = useMemo(() => resolvePath(to, params), [to, params])

    const panelValue = useMemo(
      () => (search ? buildPanelValue(resolvedPath, search) : resolvedPath),
      [resolvedPath, search],
    )

    const href = useMemo(() => {
      if (!ctx?.mainRouter)
        return `/?${panelName}=${encodeURIComponent(panelValue)}`

      return ctx.mainRouter.buildLocation({
        to: '/',
        search: (prev) => {
          const parsed = panelSearchSchema.parse(prev)
          const next: Record<string, string | undefined> = {}

          for (const key of ctx.panelNames) {
            next[key] = key === panelName ? panelValue : parsed[key]
          }

          return next
        },
      }).href
    }, [ctx, panelValue])

    const handleClick = useCallback(
      (e: MouseEvent<HTMLAnchorElement>) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return

        if (!ctx) return
        e.preventDefault()
        ctx.navigatePanel(panelName, panelValue)
      },
      [ctx, panelValue],
    )

    return (
      <a href={href} className={className} onClick={handleClick}>
        {children}
      </a>
    )
  }

  return PanelLink
}

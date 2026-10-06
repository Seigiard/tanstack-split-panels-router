import type { PanelLinkTarget, PanelMap, SystemLinkProps } from './types'
import {
  Link as TanStackLink,
  type LinkComponent,
} from '@tanstack/react-router'
import { useContext, useMemo, type MouseEvent } from 'react'
import { z } from 'zod'

import { buildPanelValue, resolvePath } from './panel-utils'
import { panelSearchSchema } from './search-schema'
import { PanelSystemContext } from './system-provider'

// ─── Multi-panel Link factory ─────────────────────────────────────

function resolveTarget(target: PanelLinkTarget<any>): string | false {
  if (target === false) return false

  const path = z.string().safeParse(target)

  if (path.success) return path.data

  const navigation = z
    .object({
      to: z.string(),
      params: z.record(z.string(), z.string()).optional(),
      search: z.record(z.string(), z.string()).optional(),
    })
    .parse(target)

  const resolved = resolvePath(navigation.to, navigation.params)

  return navigation.search
    ? buildPanelValue(resolved, navigation.search)
    : resolved
}

export function createSystemLink<TPanels extends PanelMap>(
  panelNames: string[],
): React.ComponentType<SystemLinkProps<TPanels>> {
  function SystemLink(props: SystemLinkProps<TPanels>) {
    const { children, className, ...panelTargets } = props

    // SAFETY: omitting children and className leaves only optional panel targets.
    const targets = panelTargets as {
      [K in keyof TPanels]?: PanelLinkTarget<TPanels[K]['tree']>
    }

    const ctx = useContext(PanelSystemContext)

    const href = useMemo(() => {
      if (!ctx?.mainRouter) return '/'

      return ctx.mainRouter.buildLocation({
        to: '/',
        search: (prev) => {
          const parsed = panelSearchSchema.parse(prev)
          const next: Record<string, string | undefined> = {}

          for (const name of panelNames) {
            const target = targets[name]

            if (target === undefined) {
              next[name] = parsed[name]
            } else if (target === false) {
              next[name] = undefined
            } else {
              next[name] = resolveTarget(target) || undefined
            }
          }

          return next
        },
      }).href
    }, [ctx, targets])

    const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return

      if (!ctx) return
      e.preventDefault()

      for (const name of panelNames) {
        const target = targets[name]

        if (target === undefined) continue

        if (target === false) {
          ctx.closePanel(name)
        } else {
          const resolved = resolveTarget(target)

          if (resolved !== false) {
            ctx.navigatePanel(name, resolved)
          }
        }
      }
    }

    return (
      <a href={href} className={className} onClick={handleClick}>
        {children}
      </a>
    )
  }

  return SystemLink
}

// ─── MainLink factory ─────────────────────────────────────────────

export function createMainLink(panelNames: string[]): LinkComponent<'a'> {
  const clearSearch: Record<string, undefined> = {}

  for (const key of panelNames) {
    clearSearch[key] = undefined
  }

  const MainLink: LinkComponent<'a'> = (props) => {
    // SAFETY: props have TanStack's LinkComponent contract; only search is replaced.
    return <TanStackLink {...(props as any)} search={clearSearch} />
  }

  return MainLink
}

import type { AnyRoute } from '@tanstack/react-router'
import type { RoutePaths } from '@tanstack/router-core'

// ─── Path param extraction ────────────────────────────────────────

export type ExtractPathParams<T extends string> =
  T extends `${string}$${infer Param}/${infer Rest}`
    ? Param | ExtractPathParams<`/${Rest}`>
    : T extends `${string}$${infer Param}`
      ? Param
      : never

export type ParamsRecord<TPath extends string> =
  ExtractPathParams<TPath> extends never
    ? Record<string, never>
    : Record<ExtractPathParams<TPath>, string>

// ─── Panel config ─────────────────────────────────────────────────

export interface PanelConfig<TTree extends AnyRoute = AnyRoute> {
  name: string
  tree: TTree
  defaultPath: RoutePaths<TTree> | (string & {})
}

export type PanelRouter = ReturnType<
  typeof import('@tanstack/react-router').createRouter
>

export type PanelRouterFactory = (initialPath?: string) => PanelRouter

// ─── Panel instance (returned by createPanel) ─────────────────────

export interface PanelInstance<TTree extends AnyRoute = AnyRoute> {
  name: string
  tree: TTree
  defaultPath: string
  getRouter: PanelRouterFactory
  Outlet: React.ComponentType
  Link: PanelLinkComponent<TTree>
  useNav: () => PanelNavReturn
}

// ─── Per-panel Link props ─────────────────────────────────────────

export type PanelLinkProps<
  TTree extends AnyRoute,
  TTo extends RoutePaths<TTree>,
> = {
  to: TTo
  children?: React.ReactNode
  className?: string
  search?: Record<string, string>
} & (ExtractPathParams<TTo & string> extends never
  ? { params?: never }
  : { params: Record<ExtractPathParams<TTo & string>, string> })

export type PanelLinkComponent<TTree extends AnyRoute> = <
  const TTo extends RoutePaths<TTree>,
>(
  props: PanelLinkProps<TTree, TTo>,
) => React.ReactElement | null

// ─── Per-panel nav hook ───────────────────────────────────────────

export interface PanelNavReturn {
  navigate: (to: string, opts?: { search?: Record<string, string> }) => void
  close: () => void
  isOpen: boolean
}

// ─── Panel map (input to createPanelSystem) ───────────────────────

export type PanelMap = Record<string, PanelInstance<AnyRoute>>

// ─── System-level Link props ──────────────────────────────────────

export type PanelLinkTarget<TTree extends AnyRoute> =
  | RoutePaths<TTree>
  | {
      to: RoutePaths<TTree> | (string & {})
      params?: Record<string, string>
      search?: Record<string, string>
    }
  | false

export type SystemLinkProps<TPanels extends PanelMap> = {
  [K in keyof TPanels]?: PanelLinkTarget<TPanels[K]['tree']>
} & { children?: React.ReactNode; className?: string }

// ─── usePanel hook return ─────────────────────────────────────────

export type PanelControl = {
  navigate: (to: string, opts?: { search?: Record<string, string> }) => void
  close: () => void
  isOpen: boolean
}

export type UsePanelReturn<TPanels extends PanelMap> = {
  [K in keyof TPanels]: PanelControl
} & {
  isPanelMode: boolean
  navigateMain: (to: string) => void
}

// ─── createPanelSystem options ────────────────────────────────────

export interface PanelSystemOptions<TPanels extends PanelMap> {
  panels: TPanels
  onNavigate?: (
    panel: string,
    action: 'navigate' | 'close',
    path?: string,
  ) => void
}

// ─── Panel identity context (for useCurrentPanel) ─────────────────

export interface PanelIdentity {
  name: string
  navigate: (to: string, opts?: { search?: Record<string, string> }) => void
  close: () => void
}

// ─── System instance (returned by createPanelSystem) ──────────────

export interface PanelSystem<TPanels extends PanelMap> {
  Provider: React.ComponentType<{ children: React.ReactNode }>
  Link: React.ComponentType<SystemLinkProps<TPanels>>
  MainLink: React.ComponentType<{
    to: string
    children?: React.ReactNode
    className?: string
  }>
  usePanel: () => UsePanelReturn<TPanels>
  useCurrentPanel: () => PanelIdentity
  validateSearch: (
    search: Record<string, unknown>,
  ) => Record<string, string | undefined>
}

import type { AnyRoute } from '@tanstack/react-router'
import {
  useLoaderData,
  useMatch,
  useParams,
  useRouteContext,
  useSearch,
} from '@tanstack/react-router'
import type { MakeRouteMatchFromRoute } from '@tanstack/router-core'

/**
 * Panel route IDs are not registered in the global TanStack Router `Register`
 * (only the main router is registered). These wrappers accept the same options
 * as TanStack hooks, but `from` takes a route object instead of a string ID.
 * Types are extracted directly from the route, bypassing the global registry.
 *
 * At runtime, all hooks resolve against the nearest `<RouterProvider>`, which
 * inside a panel's `<Outlet />` is the panel's memory router.
 */

// ─── Option types ────────────────────────────────────────────────

type ResolveResult<TFull, TSelected> = unknown extends TSelected
  ? TFull
  : TSelected

export interface PanelRouteContextOptions<
  TRoute extends AnyRoute,
  TSelected = unknown,
> {
  from: TRoute
  select?: (ctx: TRoute['types']['allContext']) => TSelected
}

export interface PanelLoaderDataOptions<
  TRoute extends AnyRoute,
  TSelected = unknown,
> {
  from: TRoute
  select?: (data: TRoute['types']['loaderData']) => TSelected
  structuralSharing?: boolean
}

export interface PanelParamsOptions<
  TRoute extends AnyRoute,
  TSelected = unknown,
> {
  from: TRoute
  select?: (params: TRoute['types']['allParams']) => TSelected
  structuralSharing?: boolean
}

export interface PanelSearchOptions<
  TRoute extends AnyRoute,
  TSelected = unknown,
> {
  from: TRoute
  select?: (search: TRoute['types']['fullSearchSchema']) => TSelected
  structuralSharing?: boolean
}

export interface PanelMatchOptions<
  TRoute extends AnyRoute,
  TSelected = unknown,
> {
  from: TRoute
  select?: (match: MakeRouteMatchFromRoute<TRoute>) => TSelected
  structuralSharing?: boolean
}

// ─── Hooks ───────────────────────────────────────────────────────

function rewrite({ from, ...rest }: { from: AnyRoute }) {
  return { from: from.id, strict: true as const, ...rest }
}

export function usePanelRouteContext<
  TRoute extends AnyRoute,
  TSelected = unknown,
>(
  opts: PanelRouteContextOptions<TRoute, TSelected>,
): ResolveResult<TRoute['types']['allContext'], TSelected> {
  return useRouteContext(rewrite(opts) as never)
}

export function usePanelLoaderData<
  TRoute extends AnyRoute,
  TSelected = unknown,
>(
  opts: PanelLoaderDataOptions<TRoute, TSelected>,
): ResolveResult<TRoute['types']['loaderData'], TSelected> {
  return useLoaderData(rewrite(opts) as never)
}

export function usePanelParams<TRoute extends AnyRoute, TSelected = unknown>(
  opts: PanelParamsOptions<TRoute, TSelected>,
): ResolveResult<TRoute['types']['allParams'], TSelected> {
  // shouldThrow defaults to true — the hook throws if route not matched, never returns undefined
  return useParams(rewrite(opts) as never) as ResolveResult<
    TRoute['types']['allParams'],
    TSelected
  >
}

export function usePanelSearch<TRoute extends AnyRoute, TSelected = unknown>(
  opts: PanelSearchOptions<TRoute, TSelected>,
): ResolveResult<TRoute['types']['fullSearchSchema'], TSelected> {
  return useSearch(rewrite(opts) as never) as ResolveResult<
    TRoute['types']['fullSearchSchema'],
    TSelected
  >
}

export function usePanelMatch<TRoute extends AnyRoute, TSelected = unknown>(
  opts: PanelMatchOptions<TRoute, TSelected>,
): ResolveResult<MakeRouteMatchFromRoute<TRoute>, TSelected> {
  return useMatch(rewrite(opts) as never) as ResolveResult<
    MakeRouteMatchFromRoute<TRoute>,
    TSelected
  >
}

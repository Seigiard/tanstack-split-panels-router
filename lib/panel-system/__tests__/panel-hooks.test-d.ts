import { createRootRoute, createRoute, Outlet } from '@tanstack/react-router'
import type { MakeRouteMatchFromRoute } from '@tanstack/router-core'
import { expectTypeOf, test } from 'vitest'

import {
  usePanelLoaderData,
  usePanelMatch,
  usePanelParams,
  usePanelRouteContext,
  usePanelSearch,
} from '../panel-hooks'

// ─── Test route tree (mirrors panel route structure) ─────────────

const root = createRootRoute({ component: () => Outlet })

const staticRoute = createRoute({
  getParentRoute: () => root,
  path: '/static',
  beforeLoad: () => ({ title: 'hello' as const }),
  loader: async (): Promise<{ items: string[] }> => ({ items: [] }),
  component: () => null,
})

const dynamicRoute = createRoute({
  getParentRoute: () => root,
  path: '/items/$itemId',
  validateSearch: (s: Record<string, unknown>) => ({
    page: Number(s.page) || 1,
  }),
  loader: async (): Promise<{ name: string }> => ({ name: '' }),
  component: () => null,
})

// ─── usePanelRouteContext ────────────────────────────────────────

test('usePanelRouteContext extracts allContext with beforeLoad data', () => {
  const ctx = usePanelRouteContext({ from: staticRoute })
  expectTypeOf(ctx).toHaveProperty('title')
  expectTypeOf(ctx.title).toEqualTypeOf<'hello'>()
})

test('usePanelRouteContext with select narrows return type', () => {
  const title = usePanelRouteContext({
    from: staticRoute,
    select: (ctx) => ctx.title,
  })
  expectTypeOf(title).toEqualTypeOf<'hello'>()
})

// ─── usePanelLoaderData ──────────────────────────────────────────

test('usePanelLoaderData extracts loader return type', () => {
  const data = usePanelLoaderData({ from: staticRoute })
  expectTypeOf(data).toEqualTypeOf<{ items: string[] }>()
})

test('usePanelLoaderData with select narrows return type', () => {
  const count = usePanelLoaderData({
    from: staticRoute,
    select: (data) => data.items.length,
  })
  expectTypeOf(count).toBeNumber()
})

// ─── usePanelParams ──────────────────────────────────────────────

test('usePanelParams extracts path params', () => {
  const params = usePanelParams({ from: dynamicRoute })
  expectTypeOf(params).toHaveProperty('itemId')
  expectTypeOf(params.itemId).toBeString()
})

test('usePanelParams returns empty object for static route', () => {
  const params = usePanelParams({ from: staticRoute })
  expectTypeOf(params).toEqualTypeOf<{}>()
})

test('usePanelParams with select narrows return type', () => {
  const id = usePanelParams({
    from: dynamicRoute,
    select: (p) => p.itemId,
  })
  expectTypeOf(id).toBeString()
})

// ─── usePanelSearch ──────────────────────────────────────────────

test('usePanelSearch extracts validated search schema', () => {
  const search = usePanelSearch({ from: dynamicRoute })
  expectTypeOf(search).toHaveProperty('page')
  expectTypeOf(search.page).toBeNumber()
})

test('usePanelSearch with select narrows return type', () => {
  const page = usePanelSearch({
    from: dynamicRoute,
    select: (s) => s.page,
  })
  expectTypeOf(page).toBeNumber()
})

// ─── usePanelMatch ───────────────────────────────────────────────

test('usePanelMatch returns MakeRouteMatchFromRoute', () => {
  const match = usePanelMatch({ from: dynamicRoute })
  expectTypeOf(match).toEqualTypeOf<
    MakeRouteMatchFromRoute<typeof dynamicRoute>
  >()
})

test('usePanelMatch includes loaderData (optional), params, context', () => {
  const match = usePanelMatch({ from: dynamicRoute })
  // loaderData is optional in RouteMatch (undefined during pending state)
  expectTypeOf(match.loaderData).toEqualTypeOf<{ name: string } | undefined>()
  expectTypeOf(match.params).toHaveProperty('itemId')
})

test('usePanelMatch with select narrows return type', () => {
  const status = usePanelMatch({
    from: dynamicRoute,
    select: (m) => m.status,
  })
  expectTypeOf(status).toEqualTypeOf<
    'pending' | 'success' | 'error' | 'redirected' | 'notFound'
  >()
})

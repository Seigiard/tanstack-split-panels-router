import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'

import {
  usePanelLoaderData,
  usePanelMatch,
  usePanelParams,
  usePanelRouteContext,
  usePanelSearch,
} from '../panel-hooks'

afterEach(cleanup)

// ─── Test helpers ────────────────────────────────────────────────

type SearchSchema = { page: number }

const root = createRootRoute({ component: () => <Outlet /> })

const staticRoute = createRoute({
  getParentRoute: () => root,
  path: '/',
  beforeLoad: () => ({ title: 'test-title' }),
  loader: async () => ({ items: ['a', 'b'] }),
  component: () => null,
})

const dynamicRoute = createRoute({
  getParentRoute: () => root,
  path: '/items/$itemId',
  validateSearch: (s: Record<string, unknown>): SearchSchema => ({
    page: Number(s.page) || 1,
  }),
  loader: async () => ({ name: 'widget' }),
  component: () => null,
})

const tree = root.addChildren([staticRoute, dynamicRoute])

function renderWithRouter(Component: () => React.ReactNode, initialPath = '/') {
  // #given — component rendered in its own RouterProvider (like a panel)
  const testRouter = createRouter({
    routeTree: tree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })

  return render(<RouterProvider router={testRouter} />)
}

// ─── usePanelRouteContext ────────────────────────────────────────

describe('usePanelRouteContext', () => {
  test('returns context injected by beforeLoad', async () => {
    // #given
    staticRoute.update({
      component: function TestComponent() {
        const ctx = usePanelRouteContext({ from: staticRoute })
        return <div data-testid='ctx'>{ctx.title}</div>
      },
    })

    // #when
    renderWithRouter(() => null, '/')

    // #then
    expect(await screen.findByTestId('ctx')).toHaveTextContent('test-title')
  })
})

// ─── usePanelLoaderData ──────────────────────────────────────────

describe('usePanelLoaderData', () => {
  test('returns data from route loader', async () => {
    // #given
    staticRoute.update({
      component: function TestComponent() {
        const data = usePanelLoaderData({ from: staticRoute })
        return <div data-testid='data'>{JSON.stringify(data)}</div>
      },
    })

    // #when
    renderWithRouter(() => null, '/')

    // #then
    const el = await screen.findByTestId('data')
    expect(JSON.parse(el.textContent!)).toEqual({ items: ['a', 'b'] })
  })
})

// ─── usePanelParams ──────────────────────────────────────────────

describe('usePanelParams', () => {
  test('returns parsed path params', async () => {
    // #given
    dynamicRoute.update({
      component: function TestComponent() {
        const params = usePanelParams({ from: dynamicRoute })
        return <div data-testid='params'>{params.itemId}</div>
      },
    })

    // #when
    renderWithRouter(() => null, '/items/42')

    // #then
    expect(await screen.findByTestId('params')).toHaveTextContent('42')
  })
})

// ─── usePanelSearch ──────────────────────────────────────────────

describe('usePanelSearch', () => {
  test('returns validated search params', async () => {
    // #given
    dynamicRoute.update({
      component: function TestComponent() {
        const search = usePanelSearch({ from: dynamicRoute })
        return <div data-testid='search'>{search.page}</div>
      },
    })

    // #when
    renderWithRouter(() => null, '/items/1?page=5')

    // #then
    expect(await screen.findByTestId('search')).toHaveTextContent('5')
  })

  test('supports select option', async () => {
    // #given
    dynamicRoute.update({
      component: function TestComponent() {
        const page = usePanelSearch({
          from: dynamicRoute,
          select: (s) => s.page,
        })
        return <div data-testid='page'>{page}</div>
      },
    })

    // #when
    renderWithRouter(() => null, '/items/1?page=7')

    // #then
    expect(await screen.findByTestId('page')).toHaveTextContent('7')
  })

  test('falls back to default when search param is missing', async () => {
    // #given
    dynamicRoute.update({
      component: function TestComponent() {
        const search = usePanelSearch({ from: dynamicRoute })
        return <div data-testid='search'>{search.page}</div>
      },
    })

    // #when
    renderWithRouter(() => null, '/items/1')

    // #then
    expect(await screen.findByTestId('search')).toHaveTextContent('1')
  })
})

// ─── usePanelMatch ───────────────────────────────────────────────

describe('usePanelMatch', () => {
  test('returns full match with params and status', async () => {
    // #given
    dynamicRoute.update({
      component: function TestComponent() {
        const match = usePanelMatch({ from: dynamicRoute })
        return (
          <div>
            <span data-testid='status'>{match.status}</span>
            <span data-testid='param'>{match.params.itemId}</span>
          </div>
        )
      },
    })

    // #when
    renderWithRouter(() => null, '/items/99')

    // #then
    expect(await screen.findByTestId('status')).toHaveTextContent('success')
    expect(await screen.findByTestId('param')).toHaveTextContent('99')
  })
})

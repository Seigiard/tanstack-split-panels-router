import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'

import { createPanel } from './create-panel'
import { createPanelSystem } from './create-panel-system'

afterEach(cleanup)

function createFixture(initialPath = '/') {
  const leftRoot = createRootRoute({ component: () => <Outlet /> })
  const leftIndex = createRoute({ getParentRoute: () => leftRoot, path: '/' })

  const categories = createRoute({
    getParentRoute: () => leftRoot,
    path: '/categories',
  })

  const item = createRoute({
    getParentRoute: () => leftRoot,
    path: '/items/$itemId',
  })

  const left = createPanel({
    name: 'left',
    tree: leftRoot.addChildren([leftIndex, categories, item]),
    defaultPath: '/',
  })

  const rightRoot = createRootRoute({ component: () => <Outlet /> })
  const rightIndex = createRoute({ getParentRoute: () => rightRoot, path: '/' })
  const posts = createRoute({ getParentRoute: () => rightRoot, path: '/posts' })

  const right = createPanel({
    name: 'right',
    tree: rightRoot.addChildren([rightIndex, posts]),
    defaultPath: '/',
  })

  const panels = createPanelSystem({ panels: { left, right } })

  const root = createRootRoute({
    component: () => (
      <panels.Provider>
        <Outlet />
      </panels.Provider>
    ),
    validateSearch: panels.validateSearch,
  })

  const index = createRoute({ getParentRoute: () => root, path: '/' })

  const router = createRouter({
    routeTree: root.addChildren([index]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })

  return { panels, router, index, left, right }
}

describe('System.Link applies the documented multi-panel navigation contract', () => {
  test('opens both panels in one ordinary click', async () => {
    // #given
    const { panels, router, index, left, right } = createFixture()
    index.update({
      component: () => (
        <panels.Link left='/categories' right='/posts'>
          Open both
        </panels.Link>
      ),
    })
    render(<RouterProvider router={router} />)
    const link = await screen.findByText('Open both')

    // #when
    fireEvent.click(link)

    // #then — literal outcomes come from the documented navigation contract.
    await waitFor(() =>
      expect({
        search: router.state.location.search,
        leftPath: left.getRouter().state.location.pathname,
        rightPath: right.getRouter().state.location.pathname,
      }).toEqual({
        search: { left: '/categories', right: '/posts' },
        leftPath: '/categories',
        rightPath: '/posts',
      }),
    )
  })

  test('navigates left and closes right without undoing the left update', async () => {
    // #given
    const { panels, router, index } = createFixture('/?left=%2F&right=%2Fposts')
    index.update({
      component: () => (
        <panels.Link left='/categories' right={false}>
          Left only
        </panels.Link>
      ),
    })
    render(<RouterProvider router={router} />)
    const link = await screen.findByText('Left only')

    // #when
    fireEvent.click(link)

    // #then
    await waitFor(() =>
      expect(router.state.location.search).toEqual({
        left: '/categories',
        right: undefined,
      }),
    )
  })

  test('closes left and navigates right without reopening left', async () => {
    // #given
    const { panels, router, index } = createFixture(
      '/?left=%2Fcategories&right=%2F',
    )

    index.update({
      component: () => (
        <panels.Link left={false} right='/posts'>
          Right only
        </panels.Link>
      ),
    })
    render(<RouterProvider router={router} />)
    const link = await screen.findByText('Right only')

    // #when
    fireEvent.click(link)

    // #then
    await waitFor(() =>
      expect(router.state.location.search).toEqual({
        left: undefined,
        right: '/posts',
      }),
    )
  })

  test('resolves object targets and preserves an unspecified panel', async () => {
    // #given
    const { panels, router, index } = createFixture('/?right=%2Fposts')
    index.update({
      component: () => (
        <panels.Link
          left={{
            to: '/items/$itemId',
            params: { itemId: 'a/b' },
            search: { page: '2' },
          }}
        >
          Open item
        </panels.Link>
      ),
    })
    render(<RouterProvider router={router} />)
    const link = await screen.findByText('Open item')

    // #when
    fireEvent.click(link)

    // #then
    await waitFor(() =>
      expect(router.state.location.search).toEqual({
        left: '/items/a%2Fb?page=2',
        right: '/posts',
      }),
    )
  })

  test('closes both panels without restoring the first one', async () => {
    // #given
    const { panels, router, index } = createFixture(
      '/?left=%2Fcategories&right=%2Fposts',
    )

    index.update({
      component: () => (
        <panels.Link left={false} right={false}>
          Close both
        </panels.Link>
      ),
    })
    render(<RouterProvider router={router} />)
    const link = await screen.findByText('Close both')

    // #when
    fireEvent.click(link)

    // #then
    await waitFor(() => expect(router.state.location.href).toBe('/'))
  })

  test('ordinary navigation and opening the computed href have the same URL', async () => {
    // #given
    const { panels, router, index } = createFixture()
    index.update({
      component: () => (
        <panels.Link left='/categories' right='/posts'>
          Same URL
        </panels.Link>
      ),
    })
    render(<RouterProvider router={router} />)
    const link = await screen.findByText('Same URL')
    const href = link.getAttribute('href')

    // #when
    fireEvent.click(link)

    // #then — compare two independently exercised consumer paths to a literal URL.
    await waitFor(() =>
      expect({ href, clicked: router.state.location.href }).toEqual({
        href: '/?left=%2Fcategories&right=%2Fposts',
        clicked: '/?left=%2Fcategories&right=%2Fposts',
      }),
    )
  })
})

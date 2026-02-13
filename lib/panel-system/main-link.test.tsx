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

import { createMainLink } from './system-link'

const PANEL_NAMES = ['left', 'right']

function createTestRouter(
  IndexComponent: () => React.ReactNode,
  initialPath = '/',
) {
  const root = createRootRoute({
    component: () => <Outlet />,
    validateSearch: (
      s: Record<string, unknown>,
    ): { left?: string; right?: string } => ({
      left: typeof s.left === 'string' ? s.left : undefined,
      right: typeof s.right === 'string' ? s.right : undefined,
    }),
  })

  const index = createRoute({
    getParentRoute: () => root,
    path: '/',
    component: IndexComponent,
  })

  const docs = createRoute({
    getParentRoute: () => root,
    path: '/docs',
    component: () => <Outlet />,
  })

  const docPage = createRoute({
    getParentRoute: () => docs,
    path: '/$docId',
    component: () => <div data-testid='doc-page'>Doc Page</div>,
  })

  return createRouter({
    routeTree: root.addChildren([index, docs.addChildren([docPage])]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

const MainLink = createMainLink(PANEL_NAMES)

afterEach(cleanup)

describe('MainLink', () => {
  test('renders an anchor element', async () => {
    // #given
    const router = createTestRouter(() => <MainLink to='/'>Home</MainLink>)

    // #when
    render(<RouterProvider router={router} />)

    // #then
    const link = await screen.findByText('Home')
    expect(link.tagName).toBe('A')
  })

  test('resolves href from to prop', async () => {
    // #given
    const router = createTestRouter(() => (
      <MainLink to='/docs/$docId' params={{ docId: 'features' }}>
        Go to docs
      </MainLink>
    ))

    // #when
    render(<RouterProvider router={router} />)

    // #then
    const link = await screen.findByText('Go to docs')
    expect(link).toHaveAttribute('href', '/docs/features')
  })

  test('clears panel search params from href', async () => {
    // #given
    const router = createTestRouter(
      () => <MainLink to='/'>Home</MainLink>,
      '/?left=%2Fcategories&right=%2F1',
    )

    // #when
    render(<RouterProvider router={router} />)

    // #then
    const link = await screen.findByText('Home')
    const href = link.getAttribute('href')!
    expect(href).not.toContain('left=')
    expect(href).not.toContain('right=')
  })

  test('passes className to the anchor', async () => {
    // #given
    const router = createTestRouter(() => (
      <MainLink to='/' className='my-link'>
        Styled
      </MainLink>
    ))

    // #when
    render(<RouterProvider router={router} />)

    // #then
    const link = await screen.findByText('Styled')
    expect(link).toHaveClass('my-link')
  })

  test('renders children', async () => {
    // #given
    const router = createTestRouter(() => (
      <MainLink to='/'>
        <span data-testid='child'>Inside link</span>
      </MainLink>
    ))

    // #when
    render(<RouterProvider router={router} />)

    // #then
    expect(await screen.findByTestId('child')).toBeInTheDocument()
  })

  test('resolves params in href', async () => {
    // #given
    const router = createTestRouter(() => (
      <MainLink to='/docs/$docId' params={{ docId: 'guides' }}>
        Guides
      </MainLink>
    ))

    // #when
    render(<RouterProvider router={router} />)

    // #then
    const link = await screen.findByText('Guides')
    expect(link).toHaveAttribute('href', '/docs/guides')
  })
})

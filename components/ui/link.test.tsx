import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'

vi.mock('@/routes/route', () => ({
  mainRouter: undefined,
  rootRoute: undefined,
}))

import { Link } from '@/components/ui/link'

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

  const users = createRoute({
    getParentRoute: () => root,
    path: '/users',
    component: () => <Outlet />,
  })

  const userDetail = createRoute({
    getParentRoute: () => users,
    path: '/$userId',
    component: () => <div data-testid='user-detail'>User Detail</div>,
  })

  return createRouter({
    routeTree: root.addChildren([index, users.addChildren([userDetail])]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

afterEach(cleanup)

describe('Link', () => {
  test('renders an anchor element', async () => {
    const router = createTestRouter(() => <Link to='/'>Home</Link>)

    render(<RouterProvider router={router} />)

    const link = await screen.findByText('Home')
    expect(link.tagName).toBe('A')
  })

  test('resolves href from to prop', async () => {
    const router = createTestRouter(() => <Link to='/users'>Go to users</Link>)

    render(<RouterProvider router={router} />)

    const link = await screen.findByText('Go to users')
    expect(link).toHaveAttribute('href', '/users')
  })

  test('clears panel search params from href', async () => {
    const router = createTestRouter(
      () => <Link to='/'>Home</Link>,
      '/?left=%2Fcategories&right=%2F1',
    )

    render(<RouterProvider router={router} />)

    const link = await screen.findByText('Home')
    const href = link.getAttribute('href')!
    expect(href).not.toContain('left=')
    expect(href).not.toContain('right=')
  })

  test('passes className to the anchor', async () => {
    const router = createTestRouter(() => (
      <Link to='/' className='my-link'>
        Styled
      </Link>
    ))

    render(<RouterProvider router={router} />)

    const link = await screen.findByText('Styled')
    expect(link).toHaveClass('my-link')
  })

  test('renders children', async () => {
    const router = createTestRouter(() => (
      <Link to='/'>
        <span data-testid='child'>Inside link</span>
      </Link>
    ))

    render(<RouterProvider router={router} />)

    expect(await screen.findByTestId('child')).toBeInTheDocument()
  })

  test('resolves params in href', async () => {
    const router = createTestRouter(() => (
      <Link to='/users/$userId' params={{ userId: '42' }}>
        User 42
      </Link>
    ))

    render(<RouterProvider router={router} />)

    const link = await screen.findByText('User 42')
    expect(link).toHaveAttribute('href', '/users/42')
  })
})

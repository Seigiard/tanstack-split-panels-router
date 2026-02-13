import { describe, expect, test } from 'vitest'

import { buildPanelValue, parsePanelValue, resolvePath } from './panel-utils'

describe('parsePanelValue', () => {
  test('path without search', () => {
    expect(parsePanelValue('/categories')).toEqual({
      pathname: '/categories',
      searchString: '',
    })
  })

  test('path with search', () => {
    expect(parsePanelValue('/categories?skip=10&limit=5')).toEqual({
      pathname: '/categories',
      searchString: '?skip=10&limit=5',
    })
  })

  test('root path', () => {
    expect(parsePanelValue('/')).toEqual({
      pathname: '/',
      searchString: '',
    })
  })
})

describe('buildPanelValue', () => {
  test('path only', () => {
    expect(buildPanelValue('/categories')).toBe('/categories')
  })

  test('path with search', () => {
    expect(buildPanelValue('/categories', { skip: '10', limit: '5' })).toBe(
      '/categories?skip=10&limit=5',
    )
  })

  test('empty search object', () => {
    expect(buildPanelValue('/categories', {})).toBe('/categories')
  })

  test('filters empty string values', () => {
    expect(buildPanelValue('/categories', { skip: '10', limit: '' })).toBe(
      '/categories?skip=10',
    )
  })
})

describe('resolvePath', () => {
  test('static path', () => {
    expect(resolvePath('/categories')).toBe('/categories')
  })

  test('single param', () => {
    expect(resolvePath('/categories/$category', { category: 'phones' })).toBe(
      '/categories/phones',
    )
  })

  test('multiple params', () => {
    expect(
      resolvePath('/categories/$category/$productId', {
        category: 'phones',
        productId: '42',
      }),
    ).toBe('/categories/phones/42')
  })

  test('encodes param values', () => {
    expect(resolvePath('/categories/$category', { category: 'a b' })).toBe(
      '/categories/a%20b',
    )
  })

  test('throws on missing param', () => {
    expect(() => resolvePath('/categories/$category', {})).toThrow(
      'Missing param "category"',
    )
  })

  test('throws on missing param with descriptive message', () => {
    expect(() =>
      resolvePath('/categories/$category/$productId', { category: 'phones' }),
    ).toThrow('Missing param "productId"')
  })
})

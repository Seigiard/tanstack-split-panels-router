export function parsePanelValue(value: string): {
  pathname: string
  searchString: string
} {
  const qIndex = value.indexOf('?')
  if (qIndex === -1) return { pathname: value, searchString: '' }
  return {
    pathname: value.substring(0, qIndex),
    searchString: value.substring(qIndex),
  }
}

export function buildPanelValue(
  pathname: string,
  search?: Record<string, string>,
): string {
  if (!search || Object.keys(search).length === 0) return pathname
  const filtered = Object.fromEntries(
    Object.entries(search).filter(([, v]) => v !== ''),
  )
  if (Object.keys(filtered).length === 0) return pathname
  const qs = new URLSearchParams(filtered).toString()
  return `${pathname}?${qs}`
}

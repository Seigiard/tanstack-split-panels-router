export const wait = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms))

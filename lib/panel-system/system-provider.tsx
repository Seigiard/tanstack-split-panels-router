import type { PanelIdentity, PanelMap, PanelRouter } from './types'
import { useNavigate, useRouter, useSearch } from '@tanstack/react-router'
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react'

import { buildPanelValue, panelNavigate } from './panel-utils'

// ─── Context types ────────────────────────────────────────────────

export interface PanelSystemContextValue {
  panelNames: string[]
  mainRouter: ReturnType<typeof useRouter>
  getRouter: (name: string) => PanelRouter | null
  navigatePanel: (
    name: string,
    to: string,
    opts?: { search?: Record<string, string> },
  ) => void
  closePanel: (name: string) => void
  isPanelOpen: (name: string) => boolean
  navigateMain: (to: string) => void
}

export const PanelSystemContext = createContext<PanelSystemContextValue | null>(
  null,
)
export const PanelIdentityContext = createContext<PanelIdentity | null>(null)

// ─── Provider factory ─────────────────────────────────────────────

export function createSystemProvider<TPanels extends PanelMap>(
  panels: TPanels,
  onNavigate?: (
    panel: string,
    action: 'navigate' | 'close',
    path?: string,
  ) => void,
): React.ComponentType<{ children: React.ReactNode }> {
  const panelNames = Object.keys(panels)

  function PanelSystemProvider({ children }: { children: React.ReactNode }) {
    const mainRouter = useRouter()
    const navigate = useNavigate()
    const search = useSearch({ strict: false }) as Record<
      string,
      string | undefined
    >

    const prevRefs = useRef<Record<string, string | undefined>>({})

    // Lazy router initialization: get or create panel router
    const getRouter = useCallback(
      (name: string): PanelRouter | null => {
        const panel = panels[name]
        if (!panel) return null
        const panelValue = search[name]
        return panel.getRouter(panelValue || panel.defaultPath)
      },
      [search],
    )

    // Sync URL → panel routers
    useLayoutEffect(() => {
      for (const name of panelNames) {
        const current = search[name]
        const prev = prevRefs.current[name]
        if (current && current !== prev) {
          const router = getRouter(name)
          if (router) panelNavigate(router, current)
        }
        prevRefs.current[name] = current
      }
    }, [search, getRouter])

    const navigatePanel = useCallback(
      (
        name: string,
        to: string,
        opts?: { search?: Record<string, string> },
      ) => {
        const panelValue = opts?.search ? buildPanelValue(to, opts.search) : to
        onNavigate?.(name, 'navigate', panelValue)

        const router = getRouter(name)
        if (router) panelNavigate(router, panelValue)

        const nextSearch: Record<string, string | undefined> = {}
        for (const key of panelNames) {
          if (key === name) {
            nextSearch[key] = panelValue
          } else {
            nextSearch[key] = search[key]
          }
        }
        navigate({
          to: '/',
          search: nextSearch as Record<string, string>,
        })
      },
      [navigate, search, getRouter],
    )

    const closePanel = useCallback(
      (name: string) => {
        onNavigate?.(name, 'close')

        const nextSearch: Record<string, string | undefined> = {}
        for (const key of panelNames) {
          nextSearch[key] = key === name ? undefined : search[key]
        }
        navigate({
          to: '/',
          search: nextSearch as Record<string, string>,
        })
      },
      [navigate, search],
    )

    const isPanelOpen = useCallback(
      (name: string): boolean => search[name] !== undefined,
      [search],
    )

    const navigateMain = useCallback(
      (to: string) => {
        onNavigate?.('main', 'navigate', to)
        const clearSearch: Record<string, string | undefined> = {}
        for (const key of panelNames) {
          clearSearch[key] = undefined
        }
        navigate({
          to: to as '/',
          search: clearSearch as unknown as Record<string, string>,
        })
      },
      [navigate],
    )

    const contextValue = useMemo<PanelSystemContextValue>(
      () => ({
        panelNames,
        mainRouter,
        getRouter,
        navigatePanel,
        closePanel,
        isPanelOpen,
        navigateMain,
      }),
      [
        mainRouter,
        getRouter,
        navigatePanel,
        closePanel,
        isPanelOpen,
        navigateMain,
      ],
    )

    return (
      <PanelSystemContext.Provider value={contextValue}>
        {children}
      </PanelSystemContext.Provider>
    )
  }

  return PanelSystemProvider
}

// ─── Hooks ────────────────────────────────────────────────────────

export function useCurrentPanel(): PanelIdentity {
  const ctx = useContext(PanelIdentityContext)
  if (!ctx) {
    throw new Error('useCurrentPanel must be used inside a panel Outlet')
  }
  return ctx
}

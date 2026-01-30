import { useEffect, useRef } from 'react'
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  Outlet,
} from '@tanstack/react-router'
import { useLogEntries, type LogEntry } from '../lib/logger'

const bottomRoot = createRootRoute({
  component: () => <Outlet />,
})

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour12: false })
}

function entryColor(entry: LogEntry): string {
  if (entry.type === 'navigation') return 'text-blue-400'
  return 'text-muted-foreground'
}

const logsRoute = createRoute({
  getParentRoute: () => bottomRoot,
  path: '/logs',
  component: function LogsView() {
    const entries = useLogEntries()
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }, [entries.length])

    return (
      <div ref={scrollRef} className="overflow-y-auto max-h-full">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground font-mono">No log entries yet.</p>
        ) : (
          <div className="space-y-0.5">
            {entries.map((entry, i) => (
              <p key={i} className={`text-sm font-mono ${entryColor(entry)}`}>
                [{formatTime(entry.timestamp)}] {entry.message}
              </p>
            ))}
          </div>
        )}
      </div>
    )
  },
})

export const bottomPanelTree = bottomRoot.addChildren([logsRoute])

export function createBottomRouter(initialPath: string = '/logs') {
  return createRouter({
    routeTree: bottomPanelTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

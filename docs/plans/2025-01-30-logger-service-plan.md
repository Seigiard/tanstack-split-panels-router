# Logger Service — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Global in-app logger service that captures all navigation events and displays them in real-time in the bottom log panel.

**Branch:** `tanstack` (continue from current HEAD)

**Context:** Read `docs/context/splitstate-router.md` for architecture overview and known gotchas.

---

## Task 1: Create logger service singleton

**Files:** Create `lib/logger.ts`

**Step 1:** Create the `LogEntry` type and `Logger` class:

```ts
export interface LogEntry {
  timestamp: Date
  type?: string
  message: string
}

class Logger {
  private entries: LogEntry[] = []
  private listeners = new Set<() => void>()

  log(message: string, type?: string): void {
    this.entries = [...this.entries, { timestamp: new Date(), type, message }]
    this.listeners.forEach((listener) => listener())
  }

  getEntries(): LogEntry[] {
    return this.entries
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
}

export const logger = new Logger()
```

Note: `this.entries = [...this.entries, ...]` creates a new array reference on each log — required for `useSyncExternalStore` to detect changes via `getSnapshot`.

**Step 2:** Add the `useLogEntries()` hook in the same file:

```ts
import { useSyncExternalStore } from 'react'

export function useLogEntries(): LogEntry[] {
  return useSyncExternalStore(
    (cb) => logger.subscribe(cb),
    () => logger.getEntries(),
  )
}
```

**Step 3:** Verify: `bunx tsc --noEmit`

**Step 4:** Commit: `feat: logger service singleton with useSyncExternalStore hook`

---

## Task 2: Wire navigation events to logger

**Files:** `components/PanelShell.tsx`

**Step 1:** Import `logger` from `../lib/logger`.

**Step 2:** Add `logger.log()` calls inside each navigator function:

- `navigateLeft(to)` — add `logger.log('[left] → ' + to, 'navigation')`
- `navigateRight(to)` — add `logger.log('[right] → ' + to, 'navigation')`
- `navigateBottom(to)` — add `logger.log('[bottom] → ' + to, 'navigation')`
- `closeBottom()` — add `logger.log('[bottom] closed', 'navigation')`
- `navigateMain(to)` — add `logger.log('[main] → ' + to, 'navigation')`

Each `logger.log()` call goes at the top of the function, before any router/navigate calls.

**Step 3:** Verify: `bunx tsc --noEmit`

**Step 4:** Commit: `feat: wire panel navigation events to logger`

---

## Task 3: Live log panel with auto-scroll

**Files:** `routes/bottom-panel.tsx`

**Step 1:** Replace the static `LogsView` component with a live version:

```tsx
import { useEffect, useRef } from 'react'
import { useLogEntries } from '../lib/logger'

// inside logsRoute component:
function LogsView() {
  const entries = useLogEntries()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [entries.length])

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { hour12: false })
  }

  return (
    <div ref={scrollRef} className='overflow-y-auto max-h-full'>
      {entries.length === 0 ? (
        <p className='text-sm text-muted-foreground font-mono'>
          No log entries yet.
        </p>
      ) : (
        <div className='space-y-0.5'>
          {entries.map((entry, i) => (
            <p
              key={i}
              className={`text-sm font-mono ${
                entry.type === 'navigation'
                  ? 'text-blue-400'
                  : 'text-muted-foreground'
              }`}
            >
              [{formatTime(entry.timestamp)}] {entry.message}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 2:** Verify: `bunx tsc --noEmit` + `bun run build`

**Step 3:** Verify in browser:

- Open `/?left=/dash&right=/route1`
- Click "Logs" button → bottom panel opens with empty or initial log
- Click navigation buttons (Sub 1, Right → Route 2, etc.) → log entries appear in real-time
- New entries auto-scroll into view

**Step 4:** Commit: `feat: live log panel with auto-scroll and navigation events`

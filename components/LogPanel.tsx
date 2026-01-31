import { useEffect, useRef } from 'react'
import { useLogEntries, type LogEntry } from '../lib/logger'

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour12: false })
}

function entryColor(entry: LogEntry): string {
  if (entry.type === 'navigation') return 'text-blue-400'
  if (entry.type === 'lifecycle') return 'text-green-400'
  return 'text-muted-foreground'
}

export function LogPanel() {
  const entries = useLogEntries()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [entries.length])

  return (
    <div
      ref={scrollRef}
      className="h-32 overflow-y-auto border-t border-border bg-muted/30 px-4 py-2 shrink-0"
    >
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
}

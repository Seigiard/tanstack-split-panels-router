import { useEffect, useRef } from 'react'

import { useLogEntries } from '../lib/logger'

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour12: false })
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
      className='h-[30svh] shrink-0 space-y-0.5 overflow-y-auto border-t border-border bg-muted/30 px-4 py-2'
    >
      <Logs />
    </div>
  )
}

function Logs() {
  const entries = useLogEntries()

  if (entries.length === 0) {
    return (
      <p className='font-mono text-sm text-muted-foreground'>
        No log entries yet.
      </p>
    )
  }

  return (
    <>
      {entries.map((entry, i) => (
        <p key={i} className={'font-mono text-sm text-muted-foreground'}>
          [{formatTime(entry.timestamp)}] {entry.message}
        </p>
      ))}
    </>
  )
}

import { Fragment, useEffect, useRef } from 'react'

import { useLogEntries } from '../../lib/logger'

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
    <footer ref={scrollRef} className='log-panel'>
      <Logs />
    </footer>
  )
}

function Logs() {
  const entries = useLogEntries()

  const log =
    entries.length === 0
      ? 'No log entries yet.'
      : entries
          .map(
            (entry, i) => `[${formatTime(entry.timestamp)}] ${entry.message}`,
          )
          .join('\n')

  return <pre>{log}</pre>
}

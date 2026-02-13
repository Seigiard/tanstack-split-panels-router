import { useEffect, useRef } from 'react'

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
    <div ref={scrollRef} className='log-panel'>
      <Logs />
    </div>
  )
}

function Logs() {
  const entries = useLogEntries()

  if (entries.length === 0) {
    return <p>No log entries yet.</p>
  }

  return (
    <>
      {entries.map((entry, i) => (
        <p key={i}>
          [{formatTime(entry.timestamp)}] {entry.message}
        </p>
      ))}
    </>
  )
}

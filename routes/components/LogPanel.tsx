import { ComponentPropsWithoutRef, useEffect, useRef, useState } from 'react'
import { TbChevronDown, TbChevronUp } from 'react-icons/tb'

import { useLogEntries } from '../../lib/logger'

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour12: false })
}

export function LogPanel(props: ComponentPropsWithoutRef<'footer'>) {
  const [collapsed, setCollapsed] = useState(true)
  const entries = useLogEntries()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [entries.length])

  return (
    <footer data-collapsed={collapsed} ref={scrollRef} {...props}>
      <button className='icon-button' onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? <TbChevronDown /> : <TbChevronUp />}
      </button>
      {collapsed && <h4>Logs</h4>}
      {!collapsed && <Logs />}
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

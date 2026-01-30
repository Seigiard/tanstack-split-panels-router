import { useSyncExternalStore } from 'react'

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
    return () => { this.listeners.delete(listener) }
  }
}

export const logger = new Logger()

export function useLogEntries(): LogEntry[] {
  return useSyncExternalStore(
    (cb) => logger.subscribe(cb),
    () => logger.getEntries(),
  )
}

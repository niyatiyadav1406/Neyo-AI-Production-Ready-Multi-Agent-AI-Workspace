/** Client-side structured logger. Keeps the last MAX_BUFFER entries in memory. */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LogEntry = {
  /** Unix timestamp (ms) */
  ts: number
  level: LogLevel
  message: string
  context?: Record<string, unknown>
}

const MAX_BUFFER = 300

const buffer: LogEntry[] = []

// ─── Listeners ─────────────────────────────────────────────────────────────
// Allows components (e.g. MonitoringDashboard) to react to new log entries
// without coupling them to React state.

type Listener = (entry: LogEntry) => void
const listeners = new Set<Listener>()

export function onLog(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// ─── Core ──────────────────────────────────────────────────────────────────

function emit(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  const entry: LogEntry = { ts: Date.now(), level, message, ...(context ? { context } : {}) }

  buffer.push(entry)
  if (buffer.length > MAX_BUFFER) buffer.shift()

  listeners.forEach((fn) => fn(entry))

  if (level === 'error') {
    console.error(`[${level.toUpperCase()}]`, message, context ?? '')
  } else if (level === 'warn') {
    console.warn(`[${level.toUpperCase()}]`, message, context ?? '')
  } else if (import.meta.env.DEV) {
    console.log(`[${level.toUpperCase()}]`, message, context ?? '')
  }
}

// ─── Public API ────────────────────────────────────────────────────────────

export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => emit('debug', msg, ctx),
  info: (msg: string, ctx?: Record<string, unknown>) => emit('info', msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => emit('warn', msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => emit('error', msg, ctx),

  /** Snapshot of the in-memory log buffer (newest last). */
  getLogs(): readonly LogEntry[] {
    return buffer
  },

  clearLogs(): void {
    buffer.length = 0
    listeners.forEach((fn) =>
      fn({ ts: Date.now(), level: 'info', message: 'Log buffer cleared.' }),
    )
  },

  /** Count entries by level in the current buffer. */
  counts(): Record<LogLevel, number> {
    const result: Record<LogLevel, number> = { debug: 0, info: 0, warn: 0, error: 0 }
    for (const entry of buffer) result[entry.level]++
    return result
  },
}

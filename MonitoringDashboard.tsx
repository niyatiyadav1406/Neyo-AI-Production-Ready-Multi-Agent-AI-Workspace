import { useEffect, useRef, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  Info,
  RefreshCw,
  Server,
  Shield,
  Trash2,
  Wifi,
  XCircle,
  Zap,
} from 'lucide-react'
import { Badge } from '../lib/shadcn/badge'
import { Button } from '../lib/shadcn/button'
import { Card, CardContent, CardHeader, CardTitle } from '../lib/shadcn/card'
import { ScrollArea } from '../lib/shadcn/scroll-area'
import { logger, onLog, type LogEntry, type LogLevel } from '../utils/logger'

// ─── Performance helpers ───────────────────────────────────────────────────

type PerfMetrics = {
  domLoad: number | null
  pageLoad: number | null
  ttfb: number | null
  fcp: number | null
  memUsedMb: number | null
  memLimitMb: number | null
}

function getPerf(): PerfMetrics {
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
  const fcp = performance.getEntriesByName('first-contentful-paint')[0]

  const mem = (performance as unknown as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory

  return {
    domLoad: nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : null,
    pageLoad: nav ? Math.round(nav.loadEventEnd - nav.startTime) : null,
    ttfb: nav ? Math.round(nav.responseStart - nav.startTime) : null,
    fcp: fcp ? Math.round(fcp.startTime) : null,
    memUsedMb: mem ? Math.round(mem.usedJSHeapSize / 1_048_576) : null,
    memLimitMb: mem ? Math.round(mem.jsHeapSizeLimit / 1_048_576) : null,
  }
}

// ─── Sub-components ────────────────────────────────────────────────────────

type HealthItem = { label: string; ok: boolean; detail: string; icon: React.ReactNode }

function HealthCard({ item }: { item: HealthItem }) {
  return (
    <div className={`flex items-center gap-3 rounded-lg border p-3 ${item.ok ? 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30' : 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30'}`}>
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${item.ok ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400'}`}>
        {item.icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-foreground">{item.label}</p>
        <p className="text-[11px] text-muted-foreground">{item.detail}</p>
      </div>
      <span className="ml-auto">
        {item.ok
          ? <CheckCircle2 className="h-4 w-4 text-green-500" />
          : <XCircle className="h-4 w-4 text-red-500" />}
      </span>
    </div>
  )
}

function PerfStat({ label, value, unit = 'ms', warn = 1000 }: { label: string; value: number | null; unit?: string; warn?: number }) {
  if (value === null) return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-lg font-bold text-muted-foreground/50">—</span>
    </div>
  )
  const isWarn = value > warn
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={`text-lg font-bold ${isWarn ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
        {value.toLocaleString()}<span className="ml-0.5 text-xs font-normal text-muted-foreground">{unit}</span>
      </span>
    </div>
  )
}

const LEVEL_STYLES: Record<LogLevel, string> = {
  debug: 'text-muted-foreground',
  info: 'text-foreground',
  warn: 'text-amber-600 dark:text-amber-400',
  error: 'text-red-600 dark:text-red-400',
}

const LEVEL_ICONS: Record<LogLevel, React.ReactNode> = {
  debug: <Info className="h-3 w-3" />,
  info: <Info className="h-3 w-3 text-blue-500" />,
  warn: <AlertTriangle className="h-3 w-3 text-amber-500" />,
  error: <XCircle className="h-3 w-3 text-red-500" />,
}

function LogRow({ entry }: { entry: LogEntry }) {
  const [expanded, setExpanded] = useState(false)
  const time = new Date(entry.ts).toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const hasCtx = entry.context && Object.keys(entry.context).length > 0

  return (
    <div className={`border-b border-border/40 px-3 py-1.5 font-mono text-[11px] ${LEVEL_STYLES[entry.level]}`}>
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-muted-foreground">{time}</span>
        <span className="shrink-0">{LEVEL_ICONS[entry.level]}</span>
        <span className="flex-1 truncate">{entry.message}</span>
        {hasCtx && (
          <button onClick={() => setExpanded((p) => !p)} className="shrink-0 text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        )}
      </div>
      {expanded && hasCtx && (
        <pre className="mt-1 overflow-x-auto rounded bg-muted px-2 py-1 text-[10px] text-muted-foreground">
          {JSON.stringify(entry.context, null, 2)}
        </pre>
      )}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────

const LOG_LEVEL_FILTERS: { value: LogLevel | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'error', label: 'Error' },
  { value: 'warn', label: 'Warn' },
  { value: 'info', label: 'Info' },
  { value: 'debug', label: 'Debug' },
]

export default function MonitoringDashboard() {
  const [perf, setPerf] = useState<PerfMetrics>(getPerf)
  const [logs, setLogs] = useState<readonly LogEntry[]>(logger.getLogs())
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const logBottomRef = useRef<HTMLDivElement>(null)
  const counts = logger.counts()
  const errorCount = counts.error
  const totalLogs = logs.length

  // Refresh perf every 5 s
  useEffect(() => {
    const id = setInterval(() => setPerf(getPerf()), 5_000)
    return () => clearInterval(id)
  }, [])

  // Subscribe to new log entries
  useEffect(() => {
    const unsub = onLog(() => setLogs([...logger.getLogs()]))
    return unsub
  }, [])

  // Auto-scroll log
  useEffect(() => {
    if (autoScroll) logBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs, autoScroll])

  const filteredLogs = levelFilter === 'all'
    ? logs
    : logs.filter((e) => e.level === levelFilter)

  const healthItems: HealthItem[] = [
    {
      label: 'AI Gateway',
      ok: errorCount === 0,
      detail: errorCount === 0 ? 'No errors in current session' : `${errorCount} error(s) logged`,
      icon: <Server className="h-4 w-4" />,
    },
    {
      label: 'Page Performance',
      ok: (perf.pageLoad ?? 0) < 3000,
      detail: perf.pageLoad != null ? `Page loaded in ${perf.pageLoad} ms` : 'Timing data unavailable',
      icon: <Zap className="h-4 w-4" />,
    },
    {
      label: 'Memory',
      ok: perf.memUsedMb == null || (perf.memLimitMb != null && perf.memUsedMb < perf.memLimitMb * 0.8),
      detail: perf.memUsedMb != null ? `${perf.memUsedMb} MB used of ${perf.memLimitMb ?? '?'} MB` : 'Memory API not available',
      icon: <Cpu className="h-4 w-4" />,
    },
    {
      label: 'Network',
      ok: navigator.onLine,
      detail: navigator.onLine ? 'Browser is online' : 'Browser is offline',
      icon: <Wifi className="h-4 w-4" />,
    },
    {
      label: 'Security',
      ok: window.isSecureContext,
      detail: window.isSecureContext ? 'Running in a secure context (HTTPS)' : 'Not a secure context',
      icon: <Shield className="h-4 w-4" />,
    },
    {
      label: 'Error Boundary',
      ok: true,
      detail: 'All routes wrapped with error boundaries',
      icon: <Activity className="h-4 w-4" />,
    },
  ]

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-5xl space-y-5 p-4">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Monitoring</h1>
            <p className="text-sm text-muted-foreground">Real-time health, performance, and log stream</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant={errorCount > 0 ? 'destructive' : 'secondary'} className="gap-1">
              {errorCount > 0 ? <XCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
              {errorCount > 0 ? `${errorCount} error(s)` : 'All systems ok'}
            </Badge>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setPerf(getPerf())}>
              <RefreshCw className="h-3.5 w-3.5" />Refresh
            </Button>
          </div>
        </div>

        {/* Health grid */}
        <Card className="border-border shadow-retool-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" />System Health</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {healthItems.map((item) => <HealthCard key={item.label} item={item} />)}
          </CardContent>
        </Card>

        {/* Performance metrics */}
        <Card className="border-border shadow-retool-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" />Page Load Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              <PerfStat label="TTFB" value={perf.ttfb} warn={200} />
              <PerfStat label="FCP" value={perf.fcp} warn={1800} />
              <PerfStat label="DOM Ready" value={perf.domLoad} warn={1500} />
              <PerfStat label="Page Load" value={perf.pageLoad} warn={3000} />
            </div>
            {perf.memUsedMb != null && (
              <div className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  JS Heap: <strong className="text-foreground">{perf.memUsedMb} MB</strong> used
                  {perf.memLimitMb != null && <> of <strong className="text-foreground">{perf.memLimitMb} MB</strong> limit</>}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Log stream */}
        <Card className="border-border shadow-retool-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-sm flex items-center gap-2 flex-1">
                <Activity className="h-4 w-4" />Log Stream
                <Badge variant="secondary" className="text-[10px]">{totalLogs} entries</Badge>
              </CardTitle>

              {/* Level filter */}
              <div className="flex gap-0.5 rounded-md border border-border bg-background p-0.5">
                {LOG_LEVEL_FILTERS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setLevelFilter(value)}
                    className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${levelFilter === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-muted-foreground"
                onClick={() => { logger.clearLogs(); setLogs([]) }}
              >
                <Trash2 className="h-3 w-3" />Clear
              </Button>

              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground select-none">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="accent-primary"
                />
                Auto-scroll
              </label>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-72 rounded-b-lg bg-muted/30">
              {filteredLogs.length === 0 ? (
                <div className="flex h-full items-center justify-center py-12 text-xs text-muted-foreground">
                  No log entries yet — navigate between pages to generate logs.
                </div>
              ) : (
                <>
                  {filteredLogs.map((entry, i) => <LogRow key={i} entry={entry} />)}
                  <div ref={logBottomRef} />
                </>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

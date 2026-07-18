import { useRef, useState } from 'react'
import {
  Bot, CheckCircle2, ChevronDown, ChevronUp, Clock,
  Code2, Copy, Eye, FileSearch, Network, Play, RotateCcw,
  Shield, TestTube2,
} from 'lucide-react'
import { useRunAgent } from '../hooks/backend/agents'
import { Badge } from '../lib/shadcn/badge'
import { Button } from '../lib/shadcn/button'
import { Card, CardContent, CardHeader, CardTitle } from '../lib/shadcn/card'
import { Progress } from '../lib/shadcn/progress'
import { Textarea } from '../lib/shadcn/textarea'
import type { AgentType } from '../../backend/agents/runAgent'

type AgentStatus = 'idle' | 'running' | 'done' | 'error'
type AgentResult = { output: string; keyPoints: string[]; ms: number }

type AgentState = {
  type: AgentType
  name: string
  icon: React.ReactNode
  description: string
  status: AgentStatus
  result: AgentResult | null
  expanded: boolean
}

const AGENT_DEFS: Omit<AgentState, 'status' | 'result' | 'expanded'>[] = [
  { type: 'research', name: 'Research Agent', icon: <FileSearch className="h-4 w-4" />, description: 'Gathers context, technologies, and patterns' },
  { type: 'design', name: 'Design Agent', icon: <Eye className="h-4 w-4" />, description: 'Creates architecture and component structure' },
  { type: 'code', name: 'Coding Agent', icon: <Code2 className="h-4 w-4" />, description: 'Writes production-quality implementation' },
  { type: 'review', name: 'Review Agent', icon: <Shield className="h-4 w-4" />, description: 'Audits for bugs, security, and performance' },
  { type: 'test', name: 'Test Agent', icon: <TestTube2 className="h-4 w-4" />, description: 'Generates comprehensive test suite' },
]

const EXAMPLE_TASKS = [
  'Build a React todo list with drag-and-drop reordering',
  'Create a REST API for user authentication with JWT',
  'Design a real-time chat application using WebSockets',
  'Implement a caching layer with Redis for a Node.js app',
]

function makeInitial(): AgentState[] {
  return AGENT_DEFS.map((def) => ({ ...def, status: 'idle', result: null, expanded: false }))
}

function StatusBadge({ status }: { status: AgentStatus }) {
  if (status === 'idle') return <Badge variant="outline" className="text-[10px]">Waiting</Badge>
  if (status === 'running') return <Badge className="animate-pulse bg-amber-500 text-white text-[10px]">Running…</Badge>
  if (status === 'done') return <Badge className="bg-green-500 text-white text-[10px]">Done</Badge>
  return <Badge variant="destructive" className="text-[10px]">Error</Badge>
}

export default function MultiAgent() {
  const [task, setTask] = useState('')
  const [agents, setAgents] = useState<AgentState[]>(makeInitial)
  const [running, setRunning] = useState(false)
  const contextRef = useRef<string>('')

  const { trigger } = useRunAgent()

  const reset = () => {
    setAgents(makeInitial())
    setRunning(false)
    contextRef.current = ''
  }

  const runPipeline = async () => {
    if (!task.trim() || running) return
    reset()
    setRunning(true)
    contextRef.current = ''

    const agentSeq: AgentType[] = ['research', 'design', 'code', 'review', 'test']

    for (let i = 0; i < agentSeq.length; i++) {
      const agentType = agentSeq[i]!
      // Set running
      setAgents((prev) => prev.map((a, idx) => idx === i ? { ...a, status: 'running', expanded: true } : a))

      const t0 = Date.now()
      try {
        const res = await trigger({
          agentType,
          task: task.trim(),
          context: contextRef.current,
        })

        if (res) {
          const ms = Date.now() - t0
          contextRef.current = res.output
          setAgents((prev) => prev.map((a, idx) =>
            idx === i ? { ...a, status: 'done', result: { output: res.output, keyPoints: res.keyPoints, ms } } : a
          ))
        }
      } catch {
        setAgents((prev) => prev.map((a, idx) => idx === i ? { ...a, status: 'error' } : a))
        break
      }
    }

    setRunning(false)
  }

  const doneCount = agents.filter((a) => a.status === 'done').length
  const progress = (doneCount / agents.length) * 100

  return (
    <div className="mx-auto max-w-3xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Network className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Multi-Agent Collaboration</h1>
          <p className="text-sm text-muted-foreground">5 specialized agents work together to complete your task</p>
        </div>
      </div>

      {/* Input */}
      <Card className="border-border shadow-retool-sm">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Task Description</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Describe what you want to build or solve..."
            value={task}
            onChange={(e) => setTask(e.target.value)}
            rows={3}
            disabled={running}
          />
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_TASKS.map((ex) => (
              <button key={ex} onClick={() => setTask(ex)} disabled={running}
                className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground hover:bg-accent transition-colors disabled:opacity-50">
                {ex.length > 40 ? ex.slice(0, 40) + '…' : ex}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={runPipeline} disabled={!task.trim() || running} className="gap-2 flex-1">
              <Play className="h-4 w-4" />{running ? 'Pipeline running…' : 'Run Agent Pipeline'}
            </Button>
            {!running && doneCount > 0 && (
              <Button variant="outline" onClick={reset} className="gap-2"><RotateCcw className="h-4 w-4" />Reset</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      {(running || doneCount > 0) && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{doneCount} of {agents.length} agents complete</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Agent cards */}
      <div className="space-y-3">
        {agents.map((agent, idx) => (
          <Card key={agent.type}
            className={`border shadow-retool-sm transition-all ${agent.status === 'running' ? 'border-amber-400 dark:border-amber-600' : agent.status === 'done' ? 'border-green-300 dark:border-green-700' : 'border-border'}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                {/* Step indicator */}
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${agent.status === 'done' ? 'bg-green-500 text-white' : agent.status === 'running' ? 'bg-amber-500 text-white animate-pulse' : 'bg-secondary text-secondary-foreground'}`}>
                  {agent.status === 'done' ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                </div>

                <div className="flex flex-1 items-center gap-2">
                  <span className="text-muted-foreground">{agent.icon}</span>
                  <div>
                    <p className="text-sm font-semibold leading-none">{agent.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{agent.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {agent.result && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{(agent.result.ms / 1000).toFixed(1)}s</span>}
                  <StatusBadge status={agent.status} />
                  {agent.result && (
                    <button onClick={() => setAgents((p) => p.map((a, i) => i === idx ? { ...a, expanded: !a.expanded } : a))}
                      className="rounded p-1 text-muted-foreground hover:bg-accent">
                      {agent.expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            </CardHeader>

            {agent.status === 'running' && (
              <CardContent className="pt-0">
                <div className="flex gap-1.5 items-center text-xs text-amber-600 dark:text-amber-400">
                  <Bot className="h-3.5 w-3.5 animate-bounce" />
                  <span>Agent is working…</span>
                  <div className="flex gap-0.5 ml-1">{[0,1,2].map((i) => <div key={i} className="h-1 w-1 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>
                </div>
              </CardContent>
            )}

            {agent.result && agent.expanded && (
              <CardContent className="pt-0 space-y-3">
                {agent.result.keyPoints.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {agent.result.keyPoints.map((pt) => (
                      <Badge key={pt} variant="secondary" className="text-[10px] font-normal">{pt}</Badge>
                    ))}
                  </div>
                )}
                <div className="relative rounded-lg bg-muted/60 p-3">
                  <button onClick={() => navigator.clipboard.writeText(agent.result?.output ?? '')}
                    className="absolute right-2 top-2 rounded p-1 text-muted-foreground hover:bg-accent">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <pre className="overflow-x-auto text-xs text-foreground whitespace-pre-wrap max-h-60">{agent.result.output}</pre>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Pipeline flow visualization */}
      {doneCount === 0 && !running && (
        <div className="flex items-center justify-center gap-1.5 py-4">
          {AGENT_DEFS.map((a, i) => (
            <div key={a.type} className="flex items-center gap-1.5">
              <div className="flex flex-col items-center gap-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">{a.icon}</div>
                <span className="text-[9px] text-muted-foreground">{a.name.split(' ')[0]}</span>
              </div>
              {i < AGENT_DEFS.length - 1 && <div className="h-px w-6 bg-border" />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

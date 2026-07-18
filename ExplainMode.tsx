import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle, ArrowRight, BookOpen, Brain, ChevronDown, ChevronUp,
  CircleHelp, Copy, GitBranch, Lightbulb, Loader2, Send, Sparkles,
} from 'lucide-react'
import { useExplain } from '../hooks/backend/explainer'
import { Badge } from '../lib/shadcn/badge'
import { Button } from '../lib/shadcn/button'
import { Card, CardContent } from '../lib/shadcn/card'
import { Input } from '../lib/shadcn/input'
import { Progress } from '../lib/shadcn/progress'
import type { ExplainResult } from '../../backend/explainer/explain'

type ExplainEntry = {
  id: string
  question: string
  result: ExplainResult
  expanded: boolean
}

const EXAMPLE_QUESTIONS = [
  'How does garbage collection work in Python?',
  'What is the CAP theorem in distributed systems?',
  'Explain transformer attention mechanism',
  'Why is Quicksort O(n log n) on average?',
  'What causes race conditions in concurrent code?',
]

function ConfidenceBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/30 dark:border-green-800'
    : score >= 60 ? 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-800'
    : 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/30 dark:border-red-800'
  const label = score >= 80 ? 'High confidence' : score >= 60 ? 'Moderate confidence' : 'Low confidence'
  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${color}`}>
      <CircleHelp className="h-4 w-4 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-xs font-semibold">{label}</span>
          <span className="text-sm font-bold">{score}%</span>
        </div>
        <Progress value={score} className="h-1.5" />
      </div>
    </div>
  )
}

function ExplainCard({ entry, onToggle }: { entry: ExplainEntry; onToggle: () => void }) {
  const { result } = entry
  return (
    <Card className="border-border shadow-retool-sm">
      <CardContent className="pt-4 space-y-4">
        {/* Question */}
        <div className="flex items-start gap-2">
          <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">{entry.question}</p>
        </div>

        {/* Confidence */}
        <ConfidenceBadge score={result.confidence} />

        {/* Answer */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />Answer
          </div>
          <div className="relative rounded-lg bg-muted/50 p-3.5">
            <button onClick={() => navigator.clipboard.writeText(result.answer)}
              className="absolute right-2 top-2 rounded p-1 text-muted-foreground hover:bg-accent">
              <Copy className="h-3 w-3" />
            </button>
            <p className="text-sm text-foreground leading-relaxed pr-6">{result.answer}</p>
          </div>
        </div>

        {/* Topic badge */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">{result.topic}</Badge>
          <span className="text-xs text-muted-foreground">{(result.processingMs / 1000).toFixed(1)}s processing</span>
        </div>

        {/* Expandable sections */}
        <button onClick={onToggle} className="flex w-full items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors">
          <span>{entry.expanded ? 'Hide details' : 'Show reasoning, sources & alternatives'}</span>
          {entry.expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {entry.expanded && (
          <div className="space-y-3 border-t border-border pt-3">
            {/* Reasoning */}
            {result.reasoning.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Brain className="h-3.5 w-3.5 text-primary" />Reasoning chain
                </div>
                <div className="space-y-1.5">
                  {result.reasoning.map((step, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{i + 1}</span>
                      <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sources */}
            {result.sources.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <BookOpen className="h-3.5 w-3.5 text-primary" />Knowledge sources
                </div>
                <div className="space-y-1">
                  {result.sources.map((src, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ArrowRight className="h-3 w-3 shrink-0 text-primary" />{src}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alternatives */}
            {result.alternatives.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <GitBranch className="h-3.5 w-3.5 text-primary" />Alternative approaches
                </div>
                <div className="space-y-1.5">
                  {result.alternatives.map((alt, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-md bg-muted/40 p-2.5 text-xs text-muted-foreground">
                      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />{alt}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function ExplainMode() {
  const [question, setQuestion] = useState('')
  const [entries, setEntries] = useState<ExplainEntry[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const { trigger, loading } = useExplain()

  const submit = async () => {
    const q = question.trim()
    if (!q || loading) return
    setQuestion('')

    const result = await trigger({ question: q })
    if (result) {
      setEntries((prev) => [...prev, {
        id: Date.now().toString(),
        question: q,
        result: result as ExplainResult,
        expanded: false,
      }])
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries.length])

  const toggleExpand = (id: string) => {
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, expanded: !e.expanded } : e))
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">Explainability Mode</h1>
            <p className="text-xs text-muted-foreground">See confidence scores, reasoning chains, sources & alternatives</p>
          </div>
          <div className="ml-auto flex gap-2">
            <Badge variant="outline" className="gap-1 text-xs"><AlertCircle className="h-3 w-3" />Transparent AI</Badge>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Brain className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Ask anything, see everything</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">Every answer comes with a confidence score, step-by-step reasoning, sources, and alternative approaches.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {EXAMPLE_QUESTIONS.map((q) => (
                <button key={q} onClick={() => setQuestion(q)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/30 hover:bg-accent hover:text-foreground transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {entries.map((entry) => (
          <ExplainCard key={entry.id} entry={entry} onToggle={() => toggleExpand(entry.id)} />
        ))}

        {loading && (
          <Card className="border-border shadow-retool-sm">
            <CardContent className="flex items-center gap-3 py-4">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Analyzing with full transparency…</span>
            </CardContent>
          </Card>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Ask any question to see reasoning, confidence & sources…"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) submit() }}
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={submit} disabled={!question.trim() || loading} size="icon">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

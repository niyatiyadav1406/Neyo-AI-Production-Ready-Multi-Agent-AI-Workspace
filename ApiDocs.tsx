import { useState } from 'react'
import {
  BookOpen,
  Bot,
  ChevronRight,
  Code2,
  FileSearch,
  GraduationCap,
  Image,
  MessageSquare,
  Search,
  Sparkles,
  Zap,
} from 'lucide-react'
import { Badge } from '../lib/shadcn/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../lib/shadcn/card'
import { Input } from '../lib/shadcn/input'
import { ScrollArea } from '../lib/shadcn/scroll-area'

// ─── Types ─────────────────────────────────────────────────────────────────

type ParamDef = {
  name: string
  type: string
  required: boolean
  description: string
}

type Endpoint = {
  id: string
  group: string
  name: string
  fn: string
  icon: React.ReactNode
  description: string
  params: ParamDef[]
  returns: string
  exampleRequest: string
  exampleResponse: string
  rateLimitNote?: string
  validationNote?: string
}

// ─── Endpoint catalogue ────────────────────────────────────────────────────

const ENDPOINTS: Endpoint[] = [
  {
    id: 'reply',
    group: 'Assistant',
    name: 'AI Chat Reply',
    fn: 'assistant/reply',
    icon: <MessageSquare className="h-4 w-4" />,
    description: 'Send a message to the AI assistant. Supports conversation history, file attachments, multi-language output, and model selection across OpenAI, Anthropic, and Gemini.',
    params: [
      { name: 'message', type: 'string', required: false, description: 'User message (max 10 000 chars). Defaults to an attachment review request if attachments are provided.' },
      { name: 'language', type: 'string', required: false, description: 'Desired output language (e.g. "Spanish"). Detected automatically when omitted.' },
      { name: 'history', type: 'ChatTurn[]', required: false, description: 'Previous conversation turns. Up to the last 12 are forwarded to the model.' },
      { name: 'attachments', type: 'Attachment[]', required: false, description: 'Uploaded files with optional extracted text (PDF/image OCR). Max 4.' },
      { name: 'modelId', type: 'string', required: false, description: 'Model identifier (e.g. "gpt-4o-mini", "claude-sonnet-4-6"). Defaults to system default.' },
    ],
    returns: 'ReplyPayload — reply text, detected/target language info, provider metadata.',
    rateLimitNote: '30 requests / 60 s per session.',
    validationNote: 'message ≤ 10 000 chars.',
    exampleRequest: `{
  "message": "Explain closures in JavaScript.",
  "language": "English",
  "modelId": "gpt-4o-mini",
  "history": []
}`,
    exampleResponse: `{
  "reply": "A closure is a function that retains access to its...",
  "detectedLanguage": "English",
  "targetLanguage": "English",
  "provider": "openai",
  "modelId": "gpt-4o-mini",
  "isMockProvider": false
}`,
  },
  {
    id: 'codeAssistant',
    group: 'Assistant',
    name: 'Code Assistant',
    fn: 'assistant/codeAssistant',
    icon: <Code2 className="h-4 w-4" />,
    description: 'Generate complete, production-ready code from a natural-language description. Returns the full implementation with inline comments and a usage example.',
    params: [
      { name: 'prompt', type: 'string', required: true, description: 'Description of the code to write (max 8 000 chars).' },
      { name: 'language', type: 'string', required: true, description: 'Programming language or stack (e.g. "TypeScript", "Python", "React").' },
      { name: 'modelId', type: 'string', required: false, description: 'Model to use. Lower temperature (0.25) for deterministic code output.' },
    ],
    returns: 'CodeAssistantPayload — generated code string, detected language, provider metadata.',
    rateLimitNote: '20 requests / 60 s per session.',
    validationNote: 'prompt ≤ 8 000 chars, language required.',
    exampleRequest: `{
  "prompt": "A React hook that debounces a value by N ms",
  "language": "TypeScript",
  "modelId": "gpt-4o-mini"
}`,
    exampleResponse: `{
  "result": "import { useState, useEffect } from 'react'\\n\\nexport function useDebounce...",
  "language": "TypeScript",
  "provider": "openai",
  "isMockProvider": false
}`,
  },
  {
    id: 'imagePrompt',
    group: 'Assistant',
    name: 'Image Prompt Generator',
    fn: 'assistant/imagePrompt',
    icon: <Image className="h-4 w-4" />,
    description: 'Transform a rough idea into a polished AI image generation prompt including subject, composition, lighting, mood, and detail level — ready for Flux, DALL-E, or Stable Diffusion.',
    params: [
      { name: 'prompt', type: 'string', required: true, description: 'Raw user idea or description (max 4 000 chars).' },
      { name: 'modelId', type: 'string', required: false, description: 'Model to use. Higher temperature (0.7) for creative variation.' },
    ],
    returns: 'ImagePromptPayload — enhanced prompt string, language detection, provider metadata.',
    rateLimitNote: '20 requests / 60 s per session.',
    validationNote: 'prompt ≤ 4 000 chars.',
    exampleRequest: `{
  "prompt": "A futuristic city at night with neon lights",
  "modelId": "gpt-4o-mini"
}`,
    exampleResponse: `{
  "prompt": "Towering neo-noir cityscape at midnight, rain-slicked streets...",
  "detectedLanguage": "English",
  "provider": "openai",
  "isMockProvider": false
}`,
  },
  {
    id: 'runAgent',
    group: 'Multi-Agent',
    name: 'Run Agent',
    fn: 'agents/runAgent',
    icon: <Bot className="h-4 w-4" />,
    description: 'Execute one step in the multi-agent pipeline. Each agent specialises in a phase: Research → Design → Code → Review → Test.',
    params: [
      { name: 'agentType', type: "'research' | 'design' | 'code' | 'review' | 'test'", required: true, description: 'Which specialised agent to invoke.' },
      { name: 'task', type: 'string', required: true, description: 'The top-level user task description.' },
      { name: 'context', type: 'string', required: true, description: 'Output from the previous agent step (or empty string for the first step).' },
      { name: 'modelId', type: 'string', required: false, description: 'Model override.' },
    ],
    returns: 'RunAgentResult — agentType, agentName, full output markdown, extracted keyPoints[].',
    exampleRequest: `{
  "agentType": "research",
  "task": "Build a real-time notification system",
  "context": "",
  "modelId": "gpt-4o-mini"
}`,
    exampleResponse: `{
  "agentType": "research",
  "agentName": "Research Agent",
  "output": "## Research Findings\\n\\n**Key Technologies:** ...",
  "keyPoints": ["WebSockets for real-time push", "Redis pub/sub as broker"]
}`,
  },
  {
    id: 'generateQuiz',
    group: 'AI Tutor',
    name: 'Generate Quiz',
    fn: 'tutor/generateQuiz',
    icon: <GraduationCap className="h-4 w-4" />,
    description: 'Generate a multiple-choice quiz for a topic and difficulty level. Used by the AI Tutor page.',
    params: [
      { name: 'topic', type: 'string', required: true, description: 'Subject or concept to quiz on.' },
      { name: 'difficulty', type: "'beginner' | 'intermediate' | 'advanced'", required: true, description: 'Difficulty level.' },
      { name: 'count', type: 'number', required: false, description: 'Number of questions (default 5).' },
      { name: 'modelId', type: 'string', required: false, description: 'Model override.' },
    ],
    returns: 'QuizPayload — array of question objects with options, correct answer, and explanation.',
    exampleRequest: `{
  "topic": "React Hooks",
  "difficulty": "intermediate",
  "count": 5
}`,
    exampleResponse: `{
  "questions": [{
    "question": "What hook replaces componentDidMount?",
    "options": ["useState","useEffect","useRef","useMemo"],
    "answer": "useEffect",
    "explanation": "useEffect with an empty dep array runs once after mount."
  }]
}`,
  },
  {
    id: 'generateStudyPlan',
    group: 'AI Tutor',
    name: 'Generate Study Plan',
    fn: 'tutor/generateStudyPlan',
    icon: <Sparkles className="h-4 w-4" />,
    description: 'Create a personalised study plan for a topic and timeframe. Returns daily/weekly tasks with resources.',
    params: [
      { name: 'topic', type: 'string', required: true, description: 'What the user wants to learn.' },
      { name: 'level', type: "'beginner' | 'intermediate' | 'advanced'", required: true, description: 'Current skill level.' },
      { name: 'daysAvailable', type: 'number', required: true, description: 'Number of days to spread the plan over.' },
      { name: 'modelId', type: 'string', required: false, description: 'Model override.' },
    ],
    returns: 'StudyPlanPayload — structured plan with days, tasks, and suggested resources.',
    exampleRequest: `{
  "topic": "TypeScript",
  "level": "beginner",
  "daysAvailable": 14
}`,
    exampleResponse: `{
  "plan": {
    "title": "14-Day TypeScript Mastery",
    "days": [
      { "day": 1, "focus": "Types & Interfaces", "tasks": [...] }
    ]
  }
}`,
  },
  {
    id: 'explain',
    group: 'Explainability',
    name: 'Explain Mode',
    fn: 'explainer/explain',
    icon: <FileSearch className="h-4 w-4" />,
    description: 'Generate an explainability analysis: confidence score, reasoning chain, alternative interpretations, and potential biases for an AI response.',
    params: [
      { name: 'query', type: 'string', required: true, description: 'The original user query.' },
      { name: 'response', type: 'string', required: true, description: 'The AI response to explain.' },
      { name: 'modelId', type: 'string', required: false, description: 'Model override.' },
    ],
    returns: 'ExplainPayload — confidence score, reasoning steps, alternatives, and bias flags.',
    exampleRequest: `{
  "query": "Is Python better than JavaScript?",
  "response": "Both languages have their strengths..."
}`,
    exampleResponse: `{
  "confidence": 0.82,
  "reasoning": ["Considered use-case context", "Weighed community size"],
  "alternatives": ["Could emphasise TypeScript safety"],
  "biasFlags": ["Technology preference framing"]
}`,
  },
]

// ─── Sub-components ────────────────────────────────────────────────────────

const GROUP_COLORS: Record<string, string> = {
  Assistant: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900',
  'Multi-Agent': 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900',
  'AI Tutor': 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900',
  Explainability: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900',
}

function ParamsTable({ params }: { params: ParamDef[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Parameter</th>
            <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Type</th>
            <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Req.</th>
            <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.name} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
              <td className="px-3 py-2 font-mono font-semibold text-foreground">{p.name}</td>
              <td className="px-3 py-2 font-mono text-primary">{p.type}</td>
              <td className="px-3 py-2">
                {p.required
                  ? <span className="text-red-500 font-bold">✱</span>
                  : <span className="text-muted-foreground">—</span>}
              </td>
              <td className="px-3 py-2 text-muted-foreground leading-relaxed">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-muted px-4 py-3 text-[11px] font-mono text-foreground/90 leading-relaxed">
      {code}
    </pre>
  )
}

function EndpointDetail({ ep }: { ep: Endpoint }) {
  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {ep.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className="text-base font-bold">{ep.name}</h2>
            <Badge className={`text-[10px] border ${GROUP_COLORS[ep.group] ?? ''}`}>{ep.group}</Badge>
          </div>
          <code className="text-[11px] text-muted-foreground font-mono">{ep.fn}</code>
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">{ep.description}</p>

      {/* Constraints */}
      {(ep.rateLimitNote || ep.validationNote) && (
        <div className="flex flex-wrap gap-2">
          {ep.rateLimitNote && (
            <div className="flex items-center gap-1.5 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1.5 text-xs text-amber-700 dark:text-amber-400">
              <Zap className="h-3 w-3" />{ep.rateLimitNote}
            </div>
          )}
          {ep.validationNote && (
            <div className="flex items-center gap-1.5 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-2.5 py-1.5 text-xs text-blue-700 dark:text-blue-400">
              <ChevronRight className="h-3 w-3" />{ep.validationNote}
            </div>
          )}
        </div>
      )}

      {/* Parameters */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Parameters</h3>
        <ParamsTable params={ep.params} />
      </div>

      {/* Returns */}
      <div className="space-y-1.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Returns</h3>
        <p className="text-xs text-foreground">{ep.returns}</p>
      </div>

      {/* Examples */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Example Request</h3>
          <CodeBlock code={ep.exampleRequest} />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Example Response</h3>
          <CodeBlock code={ep.exampleResponse} />
        </div>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function ApiDocs() {
  const [selected, setSelected] = useState<string>(ENDPOINTS[0]?.id ?? '')
  const [search, setSearch] = useState('')

  const filtered = ENDPOINTS.filter(
    (ep) =>
      !search ||
      ep.name.toLowerCase().includes(search.toLowerCase()) ||
      ep.group.toLowerCase().includes(search.toLowerCase()) ||
      ep.fn.toLowerCase().includes(search.toLowerCase()),
  )

  const groups = Array.from(new Set(filtered.map((ep) => ep.group)))
  const activeEp = ENDPOINTS.find((ep) => ep.id === selected)

  return (
    <div className="flex h-full overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border md:flex">
        {/* Header */}
        <div className="border-b border-border p-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <BookOpen className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold">API Reference</span>
            <Badge variant="secondary" className="ml-auto text-[9px]">{ENDPOINTS.length} endpoints</Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-8 h-8 text-xs" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1">
          <nav className="p-2 space-y-3">
            {groups.map((group) => (
              <div key={group}>
                <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{group}</p>
                {filtered.filter((ep) => ep.group === group).map((ep) => (
                  <button
                    key={ep.id}
                    onClick={() => setSelected(ep.id)}
                    className={`w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${selected === ep.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
                  >
                    {ep.icon}
                    {ep.name}
                  </button>
                ))}
              </div>
            ))}

            {filtered.length === 0 && (
              <p className="px-2 py-4 text-center text-xs text-muted-foreground">No endpoints match your search.</p>
            )}
          </nav>
        </ScrollArea>
      </aside>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-5">
          {activeEp ? (
            <Card className="border-border shadow-retool-sm">
              <CardContent className="pt-5">
                <EndpointDetail ep={activeEp} />
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-sm">Select an endpoint from the sidebar</CardTitle>
              </CardHeader>
            </Card>
          )}

          {/* Mobile endpoint list */}
          <div className="mt-4 md:hidden space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">All Endpoints</p>
            {ENDPOINTS.map((ep) => (
              <button
                key={ep.id}
                onClick={() => setSelected(ep.id)}
                className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left text-xs transition-colors ${selected === ep.id ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/30'}`}
              >
                {ep.icon}
                <div>
                  <p className="font-medium text-foreground">{ep.name}</p>
                  <p className="text-muted-foreground font-mono">{ep.fn}</p>
                </div>
                <Badge className={`ml-auto text-[9px] border ${GROUP_COLORS[ep.group] ?? ''}`}>{ep.group}</Badge>
              </button>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

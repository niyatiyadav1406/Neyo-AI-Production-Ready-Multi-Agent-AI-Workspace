import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle, BookOpen, CheckCircle2, ChevronRight,
  Clock, Lightbulb, MessageCircle, RotateCcw, Send,
  Sparkles, Target, TrendingUp, User, XCircle,
} from 'lucide-react'
import { useChatTutor, useGenerateQuiz, useGenerateStudyPlan } from '../hooks/backend/tutor'
import { Badge } from '../lib/shadcn/badge'
import { Button } from '../lib/shadcn/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../lib/shadcn/card'
import { Progress } from '../lib/shadcn/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../lib/shadcn/select'
import { Input } from '../lib/shadcn/input'
import type { QuizQuestion } from '../../backend/tutor/generateQuiz'
import type { StudyPlanResult } from '../../backend/tutor/generateStudyPlan'
import type { TutorResponse } from '../../backend/tutor/chatTutor'

type Phase = 'setup' | 'quiz' | 'results' | 'plan'
type Difficulty = 'beginner' | 'intermediate' | 'advanced'
type Answer = { questionId: string; chosen: number; correct: boolean; subtopic: string }
type ChatMessage = { role: 'user' | 'assistant'; content: string; keyPoints?: string[]; followUps?: string[] }

const SUGGESTED_TOPICS = ['Python', 'React', 'TypeScript', 'Machine Learning', 'Data Structures', 'SQL', 'System Design']

// ── Chat Tutor Panel ────────────────────────────────────────────────────────

type ChatPanelProps = { topic: string; level: Difficulty }

function ChatTutorPanel({ topic, level }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: `Hi! I'm your AI tutor for **${topic}**. Ask me anything about this topic — concepts, examples, or how things work. I'll explain at the ${level} level.` },
  ])
  const [input, setInput] = useState('')
  const [showKeyPoints, setShowKeyPoints] = useState<number | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const { trigger: chat, loading } = useChatTutor()

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')

    const userMsg: ChatMessage = { role: 'user', content: msg }
    setMessages((prev) => [...prev, userMsg])

    const history = messages.map((m) => ({ role: m.role, content: m.content }))
    const result = await chat({ message: msg, topic, level, history })

    if (result) {
      const res = result as TutorResponse
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: res.reply,
        keyPoints: res.keyPoints,
        followUps: res.followUpQuestions,
      }])
    }
  }

  return (
    <div className="flex h-full flex-col border border-border rounded-xl bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-3 bg-primary/5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <MessageCircle className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">AI Tutor Chat</p>
          <p className="text-[11px] text-muted-foreground">{topic} · {level}</p>
        </div>
        <Badge variant="outline" className="ml-auto text-[10px] gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />Live
        </Badge>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
            <div className={`max-w-[85%] space-y-2`}>
              <div className={`rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-tr-sm'
                  : 'bg-muted text-foreground rounded-tl-sm'
              }`}>
                {msg.content}
              </div>

              {/* Key points */}
              {msg.keyPoints && msg.keyPoints.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowKeyPoints(showKeyPoints === idx ? null : idx)}
                    className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 font-medium"
                  >
                    <Lightbulb className="h-3 w-3" />
                    {showKeyPoints === idx ? 'Hide' : 'Show'} key points
                  </button>
                  {showKeyPoints === idx && (
                    <div className="mt-1.5 rounded-lg border border-border bg-background p-2.5 space-y-1.5">
                      {msg.keyPoints.map((kp, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="h-3 w-3 shrink-0 text-green-500 mt-0.5" />
                          <span className="text-[11px] text-foreground">{kp}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Follow-up suggestions */}
              {msg.role === 'assistant' && msg.followUps && msg.followUps.length > 0 && idx === messages.length - 1 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {msg.followUps.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      className="rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-[11px] text-primary hover:bg-primary/10 transition-colors text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary mt-0.5">
                <User className="h-3.5 w-3.5 text-secondary-foreground" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5 justify-start">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
            </div>
            <div className="rounded-xl rounded-tl-sm bg-muted px-3.5 py-2.5">
              <div className="flex gap-1 items-center h-5">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <Input
            placeholder={`Ask anything about ${topic}…`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) sendMessage() }}
            disabled={loading}
            className="flex-1 text-sm"
          />
          <Button size="sm" onClick={() => sendMessage()} disabled={!input.trim() || loading} className="gap-1.5 shrink-0">
            <Send className="h-3.5 w-3.5" />
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Main AITutor page ────────────────────────────────────────────────────────

export default function AITutor() {
  const [phase, setPhase] = useState<Phase>('setup')
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [studyPlan, setStudyPlan] = useState<StudyPlanResult | null>(null)

  const { trigger: generateQuiz, loading: quizLoading } = useGenerateQuiz()
  const { trigger: genPlan, loading: planLoading } = useGenerateStudyPlan()

  const startQuiz = async () => {
    if (!topic.trim()) return
    const result = await generateQuiz({ topic: topic.trim(), difficulty, numQuestions: 5 })
    if (result?.questions.length) {
      setQuestions(result.questions)
      setCurrentQ(0)
      setAnswers([])
      setSelectedOption(null)
      setShowExplanation(false)
      setPhase('quiz')
    }
  }

  const handleAnswer = (optionIndex: number) => {
    if (selectedOption !== null) return
    setSelectedOption(optionIndex)
    setShowExplanation(true)
  }

  const nextQuestion = () => {
    const q = questions[currentQ]
    if (!q || selectedOption === null) return
    setAnswers((prev) => [...prev, {
      questionId: q.id, chosen: selectedOption,
      correct: selectedOption === q.correctIndex, subtopic: q.subtopic,
    }])
    if (currentQ + 1 < questions.length) {
      setCurrentQ(currentQ + 1)
      setSelectedOption(null)
      setShowExplanation(false)
    } else {
      setPhase('results')
    }
  }

  const score = Math.round((answers.filter((a) => a.correct).length / Math.max(questions.length, 1)) * 100)
  const weakTopics = [...new Set(answers.filter((a) => !a.correct).map((a) => a.subtopic))]

  const buildPlan = async () => {
    const result = await genPlan({ topic, weakTopics, level: difficulty, score })
    if (result) { setStudyPlan(result as StudyPlanResult); setPhase('plan') }
  }

  const reset = () => { setPhase('setup'); setQuestions([]); setAnswers([]); setStudyPlan(null) }
  const q = questions[currentQ]
  const progress = questions.length ? ((currentQ + (selectedOption !== null ? 1 : 0)) / questions.length) * 100 : 0

  // ── SETUP ──
  if (phase === 'setup') {
    return (
      <div className="flex h-full gap-0 overflow-hidden">
        {/* Left: setup form */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-xl">
            <div className="mb-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <BookOpen className="h-8 w-8" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-foreground">AI Tutor</h1>
              <p className="mt-2 text-muted-foreground">Enter any topic, take a quiz, and get a personalized study plan.</p>
            </div>

            <Card className="border-border shadow-retool-sm">
              <CardHeader><CardTitle>What do you want to learn?</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Input placeholder="e.g. Python, Machine Learning, React Hooks..." value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') startQuiz() }}
                    className="text-base" />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {SUGGESTED_TOPICS.map((t) => (
                      <button key={t} onClick={() => setTopic(t)}
                        className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground hover:bg-accent transition-colors">
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Difficulty level</label>
                  <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">🌱 Beginner — Just getting started</SelectItem>
                      <SelectItem value="intermediate">⚡ Intermediate — Know the basics</SelectItem>
                      <SelectItem value="advanced">🔥 Advanced — Deep knowledge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={startQuiz} disabled={!topic.trim() || quizLoading} className="w-full gap-2" size="lg">
                  {quizLoading ? (<><Sparkles className="h-4 w-4 animate-spin" />Generating quiz...</>) : (<><Sparkles className="h-4 w-4" />Start Quiz</>)}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right: Chat tutor panel */}
        {topic.trim() && (
          <div className="w-[380px] shrink-0 border-l border-border p-4 flex flex-col overflow-hidden">
            <ChatTutorPanel topic={topic.trim() || 'General Learning'} level={difficulty} />
          </div>
        )}

        {!topic.trim() && (
          <div className="w-[380px] shrink-0 border-l border-border p-6 flex flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">AI Tutor Chat</p>
            <p className="text-xs text-muted-foreground leading-relaxed">Enter a topic on the left to unlock the live chat tutor. Ask any question and get instant explanations.</p>
          </div>
        )}
      </div>
    )
  }

  // ── QUIZ ──
  if (phase === 'quiz' && q) {
    return (
      <div className="flex h-full gap-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-2xl">
            <div className="mb-4 flex items-center justify-between">
              <Badge variant="outline">{topic} · {difficulty}</Badge>
              <span className="text-sm text-muted-foreground">Question {currentQ + 1} of {questions.length}</span>
            </div>
            <Progress value={progress} className="mb-6 h-2" />

            <Card className="border-border shadow-retool-sm">
              <CardHeader>
                <CardTitle className="text-lg leading-snug">{q.question}</CardTitle>
                <CardDescription>{q.subtopic}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {q.options.map((option, idx) => {
                  let cls = 'w-full rounded-lg border border-border bg-card p-3.5 text-left text-sm transition-all hover:border-primary/50 hover:bg-accent cursor-pointer'
                  if (selectedOption !== null) {
                    if (idx === q.correctIndex) cls = 'w-full rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-950/30 p-3.5 text-left text-sm text-green-700 dark:text-green-400'
                    else if (idx === selectedOption) cls = 'w-full rounded-lg border-2 border-red-400 bg-red-50 dark:bg-red-950/30 p-3.5 text-left text-sm text-red-700 dark:text-red-400'
                    else cls = 'w-full rounded-lg border border-border bg-card/50 p-3.5 text-left text-sm text-muted-foreground cursor-default opacity-60'
                  }
                  return (
                    <button key={idx} className={cls} onClick={() => handleAnswer(idx)} disabled={selectedOption !== null}>
                      <span className="flex items-center gap-3">
                        {selectedOption !== null && idx === q.correctIndex && <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />}
                        {selectedOption !== null && idx === selectedOption && idx !== q.correctIndex && <XCircle className="h-4 w-4 shrink-0 text-red-400" />}
                        {(selectedOption === null || (idx !== q.correctIndex && idx !== selectedOption)) && <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-xs font-medium">{String.fromCharCode(65 + idx)}</span>}
                        <span>{option}</span>
                      </span>
                    </button>
                  )
                })}

                {showExplanation && (
                  <div className="mt-2 flex gap-2.5 rounded-lg border border-border bg-muted/50 p-3.5">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <p className="text-sm text-foreground">{q.explanation}</p>
                  </div>
                )}

                {selectedOption !== null && (
                  <Button onClick={nextQuestion} className="w-full gap-2 mt-2">
                    {currentQ + 1 < questions.length ? (<>Next Question <ChevronRight className="h-4 w-4" /></>) : 'See Results'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Side chat during quiz */}
        <div className="w-[360px] shrink-0 border-l border-border p-4 flex flex-col overflow-hidden">
          <ChatTutorPanel topic={topic} level={difficulty} />
        </div>
      </div>
    )
  }

  // ── RESULTS ──
  if (phase === 'results') {
    const correct = answers.filter((a) => a.correct).length
    return (
      <div className="flex h-full gap-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-2xl space-y-4">
            <div className="text-center">
              <div className={`text-6xl font-bold mb-1 ${score >= 80 ? 'text-green-500' : score >= 60 ? 'text-amber-500' : 'text-red-500'}`}>{score}%</div>
              <p className="text-muted-foreground">{correct} of {questions.length} correct</p>
            </div>

            {weakTopics.length > 0 && (
              <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
                <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400"><AlertTriangle className="h-4 w-4" />Weak areas detected</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-1.5">{weakTopics.map((t) => <Badge key={t} className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">{t}</Badge>)}</CardContent>
              </Card>
            )}

            <div className="space-y-2">
              {answers.map((a, i) => {
                const ques = questions.find((qq) => qq.id === a.questionId)
                return (
                  <div key={i} className={`flex items-start gap-3 rounded-lg border p-3 ${a.correct ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20' : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20'}`}>
                    {a.correct ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />}
                    <div className="min-w-0"><p className="text-sm font-medium">{ques?.question}</p><p className="mt-0.5 text-xs text-muted-foreground">{ques?.options[ques.correctIndex]}</p></div>
                  </div>
                )
              })}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-2" onClick={reset}><RotateCcw className="h-4 w-4" />Try Again</Button>
              <Button className="flex-1 gap-2" onClick={buildPlan} disabled={planLoading}>
                {planLoading ? <Sparkles className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
                {planLoading ? 'Building plan...' : 'Get Study Plan'}
              </Button>
            </div>
          </div>
        </div>

        {/* Side chat on results */}
        <div className="w-[360px] shrink-0 border-l border-border p-4 flex flex-col overflow-hidden">
          <ChatTutorPanel topic={topic} level={difficulty} />
        </div>
      </div>
    )
  }

  // ── PLAN ──
  if (phase === 'plan' && studyPlan) {
    return (
      <div className="flex h-full gap-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div><h2 className="text-xl font-bold">Your Study Plan</h2><p className="text-sm text-muted-foreground">{studyPlan.summary}</p></div>
              <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />{studyPlan.estimatedHours}h total</Badge>
            </div>

            {studyPlan.plan.map((item, i) => (
              <Card key={i} className="border-border shadow-retool-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">{item.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.priority === 'high' ? 'destructive' : item.priority === 'medium' ? 'secondary' : 'outline'} className="text-[10px]">{item.priority}</Badge>
                      <span className="text-xs text-muted-foreground">{item.duration}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  {item.resources.length > 0 && <div className="flex flex-wrap gap-1">{item.resources.map((r) => <Badge key={r} variant="outline" className="text-[10px]">{r}</Badge>)}</div>}
                </CardContent>
              </Card>
            ))}

            {studyPlan.nextSteps.length > 0 && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Target className="h-4 w-4 text-primary" />Next Steps</CardTitle></CardHeader>
                <CardContent className="space-y-1.5">{studyPlan.nextSteps.map((s, i) => <div key={i} className="flex items-center gap-2 text-sm"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">{i + 1}</span>{s}</div>)}</CardContent>
              </Card>
            )}

            <Button variant="outline" className="w-full gap-2" onClick={reset}><RotateCcw className="h-4 w-4" />Start New Quiz</Button>
          </div>
        </div>

        {/* Side chat on plan */}
        <div className="w-[360px] shrink-0 border-l border-border p-4 flex flex-col overflow-hidden">
          <ChatTutorPanel topic={topic} level={difficulty} />
        </div>
      </div>
    )
  }

  return null
}

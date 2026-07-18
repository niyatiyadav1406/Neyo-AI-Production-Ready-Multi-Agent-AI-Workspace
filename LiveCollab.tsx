import { useEffect, useRef, useState } from 'react'
import { Bot, Loader2, Send, Users, Wifi } from 'lucide-react'
import { useReply } from '../hooks/backend/assistant'
import { Badge } from '../lib/shadcn/badge'
import { Button } from '../lib/shadcn/button'
import { Input } from '../lib/shadcn/input'
import { ScrollArea } from '../lib/shadcn/scroll-area'

type Participant = { id: string; name: string; color: string; avatar: string; role: 'user' | 'bot' | 'ai' }
type Message = { id: string; participantId: string; text: string; ts: Date; isTyping?: boolean }

const PARTICIPANTS: Participant[] = [
  { id: 'you', name: 'You', color: 'bg-primary text-primary-foreground', avatar: 'Y', role: 'user' },
  { id: 'alex', name: 'Alex', color: 'bg-blue-500 text-white', avatar: 'A', role: 'bot' },
  { id: 'sam', name: 'Sam', color: 'bg-purple-500 text-white', avatar: 'S', role: 'bot' },
  { id: 'ai', name: 'AI Assistant', color: 'bg-emerald-500 text-white', avatar: '✦', role: 'ai' },
]

const BOT_RESPONSES: Record<string, string[]> = {
  alex: [
    "That's a great point! I was just thinking the same thing.",
    "Interesting approach — have you considered the performance implications?",
    "I agree with the AI's suggestion here. Let me add some context...",
    "Nice! I've used this pattern before and it works really well.",
    "Good question. I think the key challenge here is scalability.",
  ],
  sam: [
    "From a UX perspective, this could be simplified further.",
    "Let me share what I found when I researched this last week...",
    "The AI's answer is solid. I'd also add error handling to the mix.",
    "This reminds me of a similar problem we solved using memoization.",
    "Agreed! And don't forget to write tests for the edge cases.",
  ],
}

const TOPIC_STARTERS = [
  'How should we approach building a real-time notification system?',
  'What are best practices for managing global state in React?',
  'How do we design a scalable database schema for this feature?',
  'What testing strategy should we use for this project?',
]

export default function LiveCollab() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1', participantId: 'alex', ts: new Date(Date.now() - 120000),
      text: "Hey everyone! Ready to brainstorm? I have some ideas about the architecture.",
    },
    {
      id: '2', participantId: 'sam', ts: new Date(Date.now() - 90000),
      text: "Yes! Let's bring in the AI assistant to help us think through the options.",
    },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState<string[]>([])
  const [session] = useState(() => `Session #${Math.floor(Math.random() * 9000) + 1000}`)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { trigger: aiReply, loading: aiLoading } = useReply()

  const getParticipant = (id: string) => PARTICIPANTS.find((p) => p.id === id)!

  const addMessage = (participantId: string, text: string) => {
    setMessages((prev) => [...prev, {
      id: Date.now().toString() + participantId,
      participantId,
      text,
      ts: new Date(),
    }])
  }

  const simulateBotResponse = (botId: 'alex' | 'sam', delay: number) => {
    setTimeout(() => {
      setTyping((prev) => [...prev, botId])
      setTimeout(() => {
        setTyping((prev) => prev.filter((id) => id !== botId))
        const responses = BOT_RESPONSES[botId]!
        addMessage(botId, responses[Math.floor(Math.random() * responses.length)]!)
      }, 1500 + Math.random() * 1000)
    }, delay)
  }

  const send = async () => {
    const text = input.trim()
    if (!text || aiLoading) return
    setInput('')
    addMessage('you', text)

    // Simulate bot typing indicators
    simulateBotResponse('alex', 800)
    simulateBotResponse('sam', 2500)

    // AI responds
    setTimeout(async () => {
      setTyping((prev) => [...prev, 'ai'])
      const history = messages.slice(-6).map((m) => ({
        role: (m.participantId === 'ai' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: `${getParticipant(m.participantId).name}: ${m.text}`,
      }))
      const result = await aiReply({ message: text, history })
      setTyping((prev) => prev.filter((id) => id !== 'ai'))
      if (result?.reply) addMessage('ai', result.reply)
    }, 1200)
  }

  const useStarter = async (starter: string) => {
    setInput('')
    addMessage('you', starter)
    simulateBotResponse('alex', 600)
    simulateBotResponse('sam', 2000)
    setTimeout(async () => {
      setTyping((prev) => [...prev, 'ai'])
      const result = await aiReply({ message: starter, history: [] })
      setTyping((prev) => prev.filter((id) => id !== 'ai'))
      if (result?.reply) addMessage('ai', result.reply)
    }, 1000)
  }

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, typing.length])

  const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">Live Collaboration</h1>
            <p className="text-xs text-muted-foreground">{session} · {PARTICIPANTS.length} participants</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge className="gap-1 bg-green-500/15 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 text-xs">
              <Wifi className="h-3 w-3" />Live
            </Badge>
            <div className="flex -space-x-2">
              {PARTICIPANTS.map((p) => (
                <div key={p.id} className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-background text-[10px] font-bold ${p.color}`}>
                  {p.avatar}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-3 p-4">
          {/* Topic starters */}
          {messages.length <= 2 && (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center">
              <p className="text-xs text-muted-foreground mb-3">Suggested conversation starters:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {TOPIC_STARTERS.map((starter) => (
                  <button key={starter} onClick={() => useStarter(starter)}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                    {starter}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const participant = getParticipant(msg.participantId)
            const isYou = msg.participantId === 'you'
            return (
              <div key={msg.id} className={`flex gap-3 ${isYou ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${participant.color}`}>
                  {participant.avatar}
                </div>
                <div className={`flex max-w-[75%] flex-col gap-1 ${isYou ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">{participant.name}</span>
                    {participant.role === 'ai' && <Bot className="h-3 w-3 text-emerald-500" />}
                    <span className="text-[10px] text-muted-foreground">{formatTime(msg.ts)}</span>
                  </div>
                  <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    isYou ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : participant.role === 'ai' ? 'bg-emerald-50 border border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-100 rounded-tl-sm'
                    : 'bg-card border border-border text-foreground rounded-tl-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Typing indicators */}
          {typing.map((id) => {
            const participant = getParticipant(id)
            return (
              <div key={id} className="flex gap-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${participant.color}`}>
                  {participant.avatar}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">{participant.name}</span>
                  <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )
          })}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border bg-card p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Say something to the group…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) send() }}
            disabled={aiLoading}
          />
          <Button onClick={send} disabled={!input.trim() || aiLoading} size="icon">
            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">Alex, Sam, and the AI assistant are listening in real time</p>
      </div>
    </div>
  )
}

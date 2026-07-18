import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
} from 'react'
import {
  AlertCircle,
  Brain,
  CheckCircle2,
  Code2,
  Copy,
  FileSearch,
  FileText,
  Image as ImageIcon,
  Loader2,
  MessageSquareText,
  Mic2,
  Paintbrush2,
  Paperclip,
  Play,
  RefreshCw,
  ScanText,
  Settings2,
  Sparkles,
  Square,
  Volume2,
  Wand2,
  X,
} from 'lucide-react'

import {
  useCodeAssistant,
  useImagePrompt,
  useReply,
} from '../hooks/backend/assistant'
import { Alert, AlertDescription, AlertTitle } from '../lib/shadcn/alert'
import { Badge } from '../lib/shadcn/badge'
import { Button } from '../lib/shadcn/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../lib/shadcn/card'
import { Label } from '../lib/shadcn/label'
import { Progress } from '../lib/shadcn/progress'
import { ScrollArea } from '../lib/shadcn/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../lib/shadcn/select'
import { Slider } from '../lib/shadcn/slider'
import { Switch } from '../lib/shadcn/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../lib/shadcn/tabs'
import { Textarea } from '../lib/shadcn/textarea'
import {
  buildAttachmentInsights,
  extractImageText,
  extractPdfText,
  getModelOption,
  getPdfEngineLabel,
  MODEL_OPTIONS,
  type AttachmentInsight,
  type ModelOption,
  type ProviderId,
} from '../utils/assistantFeatures'
import {
  DASHBOARD_PALETTES,
  getPreviewPalette,
  type DashboardPalette,
} from '../utils/dashboardPalettes'

type ReplyResult = {
  reply: string
  detectedLanguage: string
  detectedLocale: string
  sourceLanguage: string
  sourceLocale: string
  targetLanguage: string
  targetLocale: string
  sourceText: string
  provider: ProviderId
  modelId: string
  providerLabel: string
  isMockProvider: boolean
}

type CodeAssistantResult = {
  result: string
  language: string
  detectedLanguage: string
  detectedLocale: string
  provider: ProviderId
  modelId: string
  providerLabel: string
  isMockProvider: boolean
}

type ImagePromptResult = {
  prompt: string
  detectedLanguage: string
  detectedLocale: string
  provider: ProviderId
  modelId: string
  providerLabel: string
  isMockProvider: boolean
}

type ChatTurn = {
  role: 'user' | 'assistant'
  content: string
  language: string
}

type AttachmentDraft = {
  id: string
  name: string
  mimeType: string
  sizeBytes: number
  extractedText?: string
  previewUrl?: string
  insights: AttachmentInsight[]
  processingLabel: string
  processingError?: string
}

type AttachmentProcessingState = {
  inProgress: boolean
  completedCount: number
  totalCount: number
}

type BrowserSpeechRecognitionAlternative = {
  transcript: string
}

type BrowserSpeechRecognitionResult = {
  isFinal: boolean
  [index: number]: BrowserSpeechRecognitionAlternative | undefined
}

type BrowserSpeechRecognitionResultList = {
  length: number
  [index: number]: BrowserSpeechRecognitionResult | undefined
}

type BrowserSpeechRecognitionEvent = {
  results: BrowserSpeechRecognitionResultList
}

type BrowserSpeechRecognitionErrorEvent = {
  error: string
}

type BrowserSpeechRecognition = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: (() => void) | null
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor
  }
}

const DEFAULT_MESSAGE = ''
const SAMPLE_PREVIEW_TEXT = 'Hi, I am Neyo, your AI assistant. I can answer questions, help you code, and generate images from your ideas.'

const MOTIVATION_QUOTES = [
  'The best way to predict the future is to build it.',
  'Small steps every day lead to extraordinary results.',
  'You are one idea away from changing everything.',
  'Clarity comes from action, not thinking.',
  'Build something today that your future self will thank you for.',
  'Every great achievement starts with a single question.',
  'Ship it, iterate, improve — momentum is everything.',
  'The gap between where you are and where you want to be is called work.',
  'Ideas are cheap. Execution is everything.',
  'Think big. Start small. Move fast.',
  'The only limit is the one you stop trying to break.',
  'Progress, not perfection.',
] as const
const MAX_ATTACHMENT_COUNT = 4
const MAX_TEXT_EXTRACTION_BYTES = 500_000
const MAX_ATTACHMENTS_FOR_AI = 4
const THEME_ROTATION_MS = 30_000
const CODE_LANGUAGES = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'C++',
  'C#',
  'Go',
  'Rust',
  'PHP',
  'Ruby',
  'Swift',
  'Kotlin',
  'SQL',
  'HTML',
  'CSS',
  'Shell',
]

function createAttachmentId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `attachment-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function getLanguageScore(candidateLocale: string, targetLocale: string): number {
  const candidate = candidateLocale.toLowerCase()
  const target = targetLocale.toLowerCase()
  if (candidate === target) return 3
  const candidateBase = candidate.split('-')[0]
  const targetBase = target.split('-')[0]
  if (candidateBase && targetBase && candidateBase === targetBase) return 2
  return 0
}

function sortVoicesForLocale(voices: SpeechSynthesisVoice[], targetLocale: string): SpeechSynthesisVoice[] {
  return voices.slice().sort((voiceA, voiceB) => {
    const scoreDifference = getLanguageScore(voiceB.lang, targetLocale) - getLanguageScore(voiceA.lang, targetLocale)
    if (scoreDifference !== 0) return scoreDifference
    if (voiceA.default !== voiceB.default) return voiceA.default ? -1 : 1
    return voiceA.name.localeCompare(voiceB.name)
  })
}

function formatFileSize(sizeBytes: number): string {
  if (sizeBytes < 1024) return `${sizeBytes} B`
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
}

function isTextLikeFile(file: File): boolean {
  return (
    file.type.startsWith('text/') ||
    file.type === 'application/json' ||
    file.type === 'application/xml' ||
    file.type === 'text/csv' ||
    file.name.endsWith('.md') ||
    file.name.endsWith('.csv') ||
    file.name.endsWith('.log')
  )
}

function buildThemeShellStyle(palette: DashboardPalette, darkMode: boolean): CSSProperties {
  return {
    backgroundImage: darkMode ? palette.darkBackground : palette.lightBackground,
    backgroundColor: darkMode ? 'rgba(10, 10, 20, 0.9)' : 'rgba(255, 255, 255, 0.88)',
  }
}

function buildGlowStyle(palette: DashboardPalette, darkMode: boolean, position: 'left' | 'right'): CSSProperties {
  return {
    background: darkMode ? palette.darkGlow : palette.lightGlow,
    filter: 'blur(48px)',
    [position]: '-8rem',
  }
}

/** Build a Pollinations.ai image URL from an enhanced prompt */
function buildPollinationsUrl(prompt: string, seed: number): string {
  const encoded = encodeURIComponent(prompt)
  return `https://image.pollinations.ai/prompt/${encoded}?width=768&height=512&nologo=true&model=flux&seed=${seed}`
}

export default function AssistantWorkspace() {
  const { trigger, loading, error } = useReply()
  const {
    trigger: triggerCodeAssistant,
    loading: codeLoading,
    error: codeError,
  } = useCodeAssistant()
  const {
    trigger: triggerImagePrompt,
    loading: imagePromptLoading,
    error: imagePromptError,
  } = useImagePrompt()

  const [message, setMessage] = useState(DEFAULT_MESSAGE)
  const [replyData, setReplyData] = useState<ReplyResult | null>(null)
  const [conversation, setConversation] = useState<ChatTurn[]>([])
  const [selectedModelId, setSelectedModelId] = useState('gpt-4o-mini')
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([])
  const [attachmentState, setAttachmentState] = useState<AttachmentProcessingState>({
    inProgress: false,
    completedCount: 0,
    totalCount: 0,
  })
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [rate, setRate] = useState(0.9)
  const [pitch, setPitch] = useState(1)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('auto')
  const [speechSupported, setSpeechSupported] = useState(false)
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('assistant')
  const [activePaletteIndex, setActivePaletteIndex] = useState(0)
  const [prefersDark, setPrefersDark] = useState(false)
  const [motiIdx, setMotiIdx] = useState(() => Math.floor(Math.random() * MOTIVATION_QUOTES.length))

  // Rotate motivation quote every 60 s
  useEffect(() => {
    const id = window.setInterval(
      () => setMotiIdx((prev) => (prev + 1) % MOTIVATION_QUOTES.length),
      60_000,
    )
    return () => window.clearInterval(id)
  }, [])

  // Code writer state
  const [codePrompt, setCodePrompt] = useState('')
  const [codeLanguage, setCodeLanguage] = useState('TypeScript')
  const [codeResult, setCodeResult] = useState<CodeAssistantResult | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)

  // Image generator state
  const [imageIdea, setImageIdea] = useState('')
  const [imageResult, setImageResult] = useState<ImagePromptResult | null>(null)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [imageLoadState, setImageLoadState] = useState<'idle' | 'loading-image' | 'loaded' | 'error'>('idle')
  const [imageSeed, setImageSeed] = useState(0)
  const [copiedImagePrompt, setCopiedImagePrompt] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null)
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const attachmentsRef = useRef<AttachmentDraft[]>([])
  const latestMessageRef = useRef(message)
  const finalTranscriptRef = useRef('')
  const interimTranscriptRef = useRef('')
  const shouldSubmitAfterListeningRef = useRef(false)
  const speakTimeoutRef = useRef<number | null>(null)
  const speechPrimedRef = useRef(false)

  const selectedModel = useMemo<ModelOption>(() => {
    return getModelOption(selectedModelId) ?? MODEL_OPTIONS[0]!
  }, [selectedModelId])

  const replyLocale = replyData?.targetLocale ?? replyData?.detectedLocale ?? 'en-US'
  const orderedVoices = useMemo(() => sortVoicesForLocale(voices, replyLocale), [replyLocale, voices])

  const selectedVoice = useMemo(() => {
    const recommendedVoice = orderedVoices[0] ?? null
    if (selectedVoiceURI === 'auto') return recommendedVoice
    return voices.find((voice) => voice.voiceURI === selectedVoiceURI) ?? recommendedVoice
  }, [orderedVoices, selectedVoiceURI, voices])

  const currentPalette = DASHBOARD_PALETTES[activePaletteIndex] ?? DASHBOARD_PALETTES[0]!
  const assistantPreviewPalette = useMemo(() => getPreviewPalette(message || 'assistant'), [message])
  const codePreviewPalette = useMemo(() => getPreviewPalette(codePrompt || codeLanguage), [codeLanguage, codePrompt])
  const imagePreviewPalette = useMemo(() => getPreviewPalette(imageIdea || 'image'), [imageIdea])
  const liveTranscriptPreview = `${finalTranscriptRef.current} ${interimTranscript}`.trim()
  const replyText = replyData?.reply ?? ''

  const dashboardStyle = useMemo(() => buildThemeShellStyle(currentPalette, prefersDark), [currentPalette, prefersDark])
  const assistantPreviewStyle = useMemo(() => buildThemeShellStyle(assistantPreviewPalette, prefersDark), [assistantPreviewPalette, prefersDark])
  const codePreviewStyle = useMemo(() => buildThemeShellStyle(codePreviewPalette, prefersDark), [codePreviewPalette, prefersDark])
  const imagePreviewStyle = useMemo(() => buildThemeShellStyle(imagePreviewPalette, prefersDark), [imagePreviewPalette, prefersDark])
  const leftGlowStyle = useMemo(() => buildGlowStyle(currentPalette, prefersDark, 'left'), [currentPalette, prefersDark])
  const rightGlowStyle = useMemo(() => buildGlowStyle(currentPalette, prefersDark, 'right'), [currentPalette, prefersDark])

  useEffect(() => { latestMessageRef.current = message }, [message])
  useEffect(() => { attachmentsRef.current = attachments }, [attachments])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const syncDarkMode = () => {
      setPrefersDark(document.documentElement.classList.contains('dark') || mediaQuery.matches)
    }
    syncDarkMode()
    mediaQuery.addEventListener('change', syncDarkMode)
    const observer = new MutationObserver(syncDarkMode)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => {
      mediaQuery.removeEventListener('change', syncDarkMode)
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActivePaletteIndex((currentIndex) => (currentIndex + 1) % DASHBOARD_PALETTES.length)
    }, THEME_ROTATION_MS)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach((attachment) => {
        if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl)
      })
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSpeechSupported(false)
      return
    }
    setSpeechSupported(true)
    const synth = window.speechSynthesis
    const loadVoices = () => {
      const nextVoices = synth.getVoices().slice().sort((a, b) => a.name.localeCompare(b.name))
      setVoices(nextVoices)
    }
    loadVoices()
    synth.onvoiceschanged = loadVoices
    return () => {
      synth.onvoiceschanged = null
      synth.cancel()
      activeUtteranceRef.current = null
      if (speakTimeoutRef.current !== null) {
        window.clearTimeout(speakTimeoutRef.current)
        speakTimeoutRef.current = null
      }
    }
  }, [])

  const stopSpeaking = useCallback(() => {
    if (!speechSupported || typeof window === 'undefined') return
    if (speakTimeoutRef.current !== null) {
      window.clearTimeout(speakTimeoutRef.current)
      speakTimeoutRef.current = null
    }
    activeUtteranceRef.current = null
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [speechSupported])

  const primeSpeechSynthesis = useCallback(() => {
    if (!speechSupported || speechPrimedRef.current || typeof window === 'undefined') return
    const synth = window.speechSynthesis
    const utterance = new SpeechSynthesisUtterance('')
    utterance.volume = 0
    speechPrimedRef.current = true
    synth.speak(utterance)
    synth.cancel()
  }, [speechSupported])

  const speakText = useCallback(
    (text: string, locale?: string) => {
      if (!text || !speechSupported || typeof window === 'undefined') return
      stopSpeaking()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = locale ?? replyLocale
      utterance.rate = rate
      utterance.pitch = pitch
      if (selectedVoice) utterance.voice = selectedVoice
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => {
        activeUtteranceRef.current = null
        setIsSpeaking(false)
      }
      utterance.onerror = () => {
        activeUtteranceRef.current = null
        setIsSpeaking(false)
      }
      activeUtteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
    },
    [pitch, rate, replyLocale, selectedVoice, speechSupported, stopSpeaking],
  )

  const handleAsk = useCallback(
    async (overrideMessage?: string) => {
      const nextMessage = (overrideMessage ?? latestMessageRef.current).trim()
      if (!nextMessage && attachmentsRef.current.length === 0) {
        setStatusMessage(null)
        setLocalError('Enter a question or attach a file first.')
        return
      }
      if (loading) {
        setStatusMessage('Still working on your last request…')
        setLocalError('Please wait for the current answer to finish.')
        return
      }
      latestMessageRef.current = nextMessage
      setMessage(nextMessage)
      setLocalError(null)
      setStatusMessage(`Generating an answer with ${selectedModel.label}…`)

      try {
        const result = (await trigger({
          message: nextMessage,
          modelId: selectedModelId,
          history: conversation.map((turn) => ({ role: turn.role, content: turn.content })),
          ...(attachmentsRef.current.length > 0
            ? {
                attachments: attachmentsRef.current.slice(0, MAX_ATTACHMENTS_FOR_AI).map((a) => ({
                  name: a.name,
                  mimeType: a.mimeType,
                  sizeBytes: a.sizeBytes,
                  ...(a.extractedText ? { extractedText: a.extractedText } : {}),
                })),
              }
            : {}),
        }).result) as ReplyResult

        setReplyData(result)
        setStatusMessage(`Answer ready from ${result.providerLabel}.`)
        setConversation((current) => {
          const nextTurns: ChatTurn[] = [
            ...current,
            { role: 'user', content: result.sourceText, language: result.sourceLanguage },
            { role: 'assistant', content: result.reply, language: result.targetLanguage },
          ]
          return nextTurns.slice(-16)
        })
        if (autoSpeak) speakText(result.reply, result.targetLocale)
      } catch (requestError) {
        const nextError = requestError instanceof Error ? requestError.message : 'The assistant could not respond.'
        setStatusMessage(null)
        setLocalError(nextError)
      }
    },
    [autoSpeak, conversation, loading, selectedModel, selectedModelId, speakText, trigger],
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      setSpeechRecognitionSupported(false)
      return
    }
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!Recognition) {
      setSpeechRecognitionSupported(false)
      return
    }
    setSpeechRecognitionSupported(true)
    const recognition = new Recognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = replyLocale
    recognition.onstart = () => {
      finalTranscriptRef.current = ''
      interimTranscriptRef.current = ''
      shouldSubmitAfterListeningRef.current = true
      setIsListening(true)
      setInterimTranscript('')
      setLocalError(null)
    }
    recognition.onresult = (event) => {
      let nextFinal = ''
      let nextInterim = ''
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i]
        const transcript = result?.[0]?.transcript?.trim() ?? ''
        if (!transcript) continue
        if (result?.isFinal) nextFinal += `${transcript} `
        else nextInterim += `${transcript} `
      }
      const normalizedFinal = nextFinal.trim()
      const normalizedInterim = nextInterim.trim()
      if (normalizedFinal) {
        finalTranscriptRef.current = normalizedFinal
        latestMessageRef.current = normalizedFinal
        setMessage(normalizedFinal)
      }
      interimTranscriptRef.current = normalizedInterim
      setInterimTranscript(normalizedInterim)
    }
    recognition.onerror = (event) => {
      shouldSubmitAfterListeningRef.current = false
      interimTranscriptRef.current = ''
      setIsListening(false)
      setInterimTranscript('')
      if (event.error === 'aborted') return
      if (event.error === 'not-allowed') {
        setLocalError('Microphone permission is blocked. Allow microphone access to use voice input.')
        return
      }
      if (event.error === 'no-speech') {
        setLocalError('No speech detected. Try again and speak closer to the microphone.')
        return
      }
      setLocalError('Voice input is unavailable right now. Try typing instead.')
    }
    recognition.onend = () => {
      const combined = `${finalTranscriptRef.current} ${interimTranscriptRef.current}`.trim()
      const shouldSubmit = shouldSubmitAfterListeningRef.current && Boolean(combined)
      shouldSubmitAfterListeningRef.current = false
      interimTranscriptRef.current = ''
      setIsListening(false)
      setInterimTranscript('')
      if (combined) {
        latestMessageRef.current = combined
        setMessage(combined)
      }
      finalTranscriptRef.current = ''
      if (shouldSubmit) void handleAsk(combined)
    }
    recognitionRef.current = recognition
    return () => {
      recognition.onstart = null
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      try { recognition.abort() } catch (_error) { /* ignore */ }
      recognitionRef.current = null
    }
  }, [handleAsk, replyLocale])

  const startListening = () => {
    primeSpeechSynthesis()
    if (!speechRecognitionSupported) {
      setLocalError('Voice input is not supported in this browser.')
      return
    }
    const recognition = recognitionRef.current
    if (!recognition) {
      setLocalError('Voice input is not ready yet. Try again in a moment.')
      return
    }
    stopSpeaking()
    recognition.lang = replyLocale
    setLocalError(null)
    try { recognition.start() } catch (_error) {
      setLocalError('Voice input is already running. Speak now or stop the microphone first.')
    }
  }

  const stopListening = () => {
    const recognition = recognitionRef.current
    if (!recognition) return
    try { recognition.stop() } catch (_error) {
      setIsListening(false)
      setInterimTranscript('')
    }
  }

  const clearAttachments = useCallback(() => {
    setAttachments((current) => {
      current.forEach((a) => { if (a.previewUrl) URL.revokeObjectURL(a.previewUrl) })
      return []
    })
  }, [])

  const buildAttachmentDraft = useCallback(async (file: File): Promise<AttachmentDraft> => {
    const mimeType = file.type || 'application/octet-stream'
    const previewUrl = mimeType.startsWith('image/') ? URL.createObjectURL(file) : undefined

    try {
      let extractedText = ''
      let processingLabel = 'Attached for context.'

      if (mimeType === 'application/pdf') {
        processingLabel = `Summarized with ${getPdfEngineLabel()}.`
        extractedText = await extractPdfText(file)
      } else if (mimeType.startsWith('image/')) {
        processingLabel = 'Image attached.'
        extractedText = await extractImageText(file)
      } else if (isTextLikeFile(file) && file.size <= MAX_TEXT_EXTRACTION_BYTES) {
        processingLabel = 'Text content included with the prompt.'
        extractedText = (await file.text()).slice(0, 12_000)
      } else if (isTextLikeFile(file)) {
        processingLabel = 'File is attached, but it is too large for direct text extraction.'
      }

      return {
        id: createAttachmentId(),
        name: file.name,
        mimeType,
        sizeBytes: file.size,
        ...(previewUrl ? { previewUrl } : {}),
        ...(extractedText ? { extractedText } : {}),
        insights: buildAttachmentInsights({
          fileName: file.name,
          mimeType,
          ...(extractedText ? { extractedText } : {}),
        }),
        processingLabel,
      }
    } catch (_error) {
      return {
        id: createAttachmentId(),
        name: file.name,
        mimeType,
        sizeBytes: file.size,
        ...(previewUrl ? { previewUrl } : {}),
        insights: [],
        processingLabel: 'Could not process this file.',
        processingError: 'Try a different file or ask the assistant without extraction.',
      }
    }
  }, [])

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? [])
      if (files.length === 0) return
      const available = MAX_ATTACHMENT_COUNT - attachmentsRef.current.length
      const toProcess = files.slice(0, available)
      if (toProcess.length === 0) return
      setAttachmentState({ inProgress: true, completedCount: 0, totalCount: toProcess.length })
      const results: AttachmentDraft[] = []
      for (const file of toProcess) {
        const draft = await buildAttachmentDraft(file)
        results.push(draft)
        setAttachmentState((current) => ({ ...current, completedCount: current.completedCount + 1 }))
      }
      setAttachments((current) => [...current, ...results].slice(0, MAX_ATTACHMENT_COUNT))
      setAttachmentState({ inProgress: false, completedCount: 0, totalCount: 0 })
      event.target.value = ''
    },
    [buildAttachmentDraft],
  )

  const removeAttachment = useCallback((id: string) => {
    setAttachments((current) => {
      const removed = current.find((a) => a.id === id)
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl)
      return current.filter((a) => a.id !== id)
    })
  }, [])

  // ── Code writer handler ──────────────────────────────────────────────────
  const handleCodeAsk = useCallback(async () => {
    if (!codePrompt.trim()) return
    if (codeLoading) return
    try {
      const result = (await triggerCodeAssistant({
        prompt: codePrompt,
        language: codeLanguage,
        modelId: selectedModelId,
      }).result) as CodeAssistantResult
      setCodeResult(result)
    } catch (_error) {
      // codeError state handled by hook
    }
  }, [codeLanguage, codeLoading, codePrompt, selectedModelId, triggerCodeAssistant])

  // ── Image generator handler ─────────────────────────────────────────────
  const handleImageGenerate = useCallback(async () => {
    if (!imageIdea.trim()) return
    if (imagePromptLoading) return

    setGeneratedImageUrl(null)
    setImageLoadState('idle')
    setImageResult(null)

    try {
      const result = (await triggerImagePrompt({
        prompt: imageIdea,
        modelId: selectedModelId,
      }).result) as ImagePromptResult

      setImageResult(result)

      if (result.prompt) {
        const seed = Math.floor(Math.random() * 9_999_999)
        setImageSeed(seed)
        setGeneratedImageUrl(buildPollinationsUrl(result.prompt, seed))
        setImageLoadState('loading-image')
      }
    } catch (_error) {
      // imagePromptError state handled by hook
    }
  }, [imageIdea, imagePromptLoading, selectedModelId, triggerImagePrompt])

  // Regenerate with same prompt but new seed
  const handleImageRegenerate = useCallback(() => {
    if (!imageResult?.prompt) return
    const seed = Math.floor(Math.random() * 9_999_999)
    setImageSeed(seed)
    setGeneratedImageUrl(buildPollinationsUrl(imageResult.prompt, seed))
    setImageLoadState('loading-image')
  }, [imageResult])

  const copyToClipboard = useCallback(async (text: string, kind: 'code' | 'image') => {
    try {
      await navigator.clipboard.writeText(text)
      if (kind === 'code') {
        setCopiedCode(true)
        window.setTimeout(() => setCopiedCode(false), 2000)
      } else {
        setCopiedImagePrompt(true)
        window.setTimeout(() => setCopiedImagePrompt(false), 2000)
      }
    } catch (_error) { /* ignore */ }
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated background glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 h-64 w-64 rounded-full opacity-40 transition-all duration-[3000ms]" style={leftGlowStyle} />
        <div className="absolute right-0 top-32 h-64 w-64 rounded-full opacity-30 transition-all duration-[3000ms]" style={rightGlowStyle} />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Neyo Dashboard</h1>
            <p className="text-sm italic text-muted-foreground transition-all duration-700">{MOTIVATION_QUOTES[motiIdx]}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              {selectedModel.label}
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="assistant" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="assistant" className="gap-2">
              <Brain className="h-4 w-4" />
              Assistant
            </TabsTrigger>
            <TabsTrigger value="coder" className="gap-2">
              <Code2 className="h-4 w-4" />
              Code Writer
            </TabsTrigger>
            <TabsTrigger value="image" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              Image Generator
            </TabsTrigger>
          </TabsList>

          {/* ─── ASSISTANT TAB ────────────────────────────────────────────── */}
          <TabsContent value="assistant" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              {/* Left column: reply on top, then input */}
              <div className="space-y-6">

              {/* Neyo reply – always shown first */}
              <Card className="border-border/80 bg-background/80 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Neyo's reply
                  </CardTitle>
                  <CardDescription>Neyo detects your language and answers naturally.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {replyData ? (
                    <>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">Detected: {replyData.sourceLanguage}</Badge>
                        <Badge>Reply: {replyData.targetLanguage}</Badge>
                        <Badge variant="outline">{replyData.providerLabel}</Badge>
                      </div>
                      <div className="rounded-2xl border border-border bg-card/70 p-4 text-sm leading-6 text-foreground shadow-retool-sm whitespace-pre-wrap">
                        {replyData.reply}
                      </div>
                    </>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border bg-card/60 p-4 text-sm leading-6 text-muted-foreground">
                      Neyo's answer will appear here once you send a message.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/80 bg-background/80 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Brain className="h-5 w-5 text-primary" />
                    Chat with Neyo
                  </CardTitle>
                  <CardDescription>Ask anything — Neyo detects your language and replies naturally.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Model select */}
                  <div className="space-y-2">
                    <Label htmlFor="assistant-model">Model</Label>
                    <Select onValueChange={setSelectedModelId} value={selectedModelId}>
                      <SelectTrigger id="assistant-model">
                        <SelectValue placeholder="Choose a model" />
                      </SelectTrigger>
                      <SelectContent>
                        {MODEL_OPTIONS.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.label} · {model.providerLabel}
                            {model.status === 'live' ? ' ✓' : ' (mock)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Message input */}
                  <div className="space-y-2">
                    <Label htmlFor="message">Your message</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                          event.preventDefault()
                          void handleAsk()
                        }
                      }}
                      className="min-h-[140px] bg-background/80"
                      placeholder="Ask anything — questions, summaries, code help, translations. Press ⌘Enter to send."
                    />
                  </div>

                  {/* Attachments */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Attachments ({attachments.length}/{MAX_ATTACHMENT_COUNT})</Label>
                      <div className="flex gap-2">
                        {attachments.length > 0 && (
                          <Button variant="ghost" size="sm" onClick={clearAttachments}>
                            <X className="h-3.5 w-3.5" />
                            Clear all
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={attachments.length >= MAX_ATTACHMENT_COUNT || attachmentState.inProgress}
                        >
                          <Paperclip className="h-3.5 w-3.5" />
                          Attach file
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          multiple
                          accept="image/*,.pdf,.txt,.md,.csv,.json,.log"
                          onChange={handleFileChange}
                        />
                      </div>
                    </div>

                    {attachmentState.inProgress && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          Processing {attachmentState.completedCount}/{attachmentState.totalCount} files…
                        </p>
                        <Progress
                          value={(attachmentState.completedCount / Math.max(1, attachmentState.totalCount)) * 100}
                          className="h-1.5"
                        />
                      </div>
                    )}

                    {attachments.length > 0 ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {attachments.map((attachment) => (
                          <div key={attachment.id} className="rounded-2xl border border-border bg-background/80 p-3 shadow-retool-sm">
                            <div className="flex items-start gap-3">
                              <div className="rounded-md border border-border bg-muted/40 p-2 text-muted-foreground">
                                {attachment.mimeType.startsWith('image/') ? (
                                  <ImageIcon className="h-4 w-4" />
                                ) : (
                                  <FileText className="h-4 w-4" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1 space-y-1">
                                <p className="truncate text-sm font-medium text-foreground">{attachment.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(attachment.sizeBytes)} · {attachment.mimeType}
                                </p>
                                <p className="text-xs text-muted-foreground">{attachment.processingLabel}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0"
                                onClick={() => removeAttachment(attachment.id)}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            {attachment.previewUrl ? (
                              <img
                                src={attachment.previewUrl}
                                alt={attachment.name}
                                className="mt-3 h-32 w-full rounded-xl border border-border object-cover"
                              />
                            ) : null}
                            {attachment.insights.length > 0 ? (
                              <div className="mt-3 space-y-2 rounded-xl border border-border bg-muted/20 p-3">
                                {attachment.insights.map((insight) => (
                                  <div key={`${attachment.id}-${insight.kind}-${insight.title}`} className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                      {insight.kind === 'pdf' ? <FileSearch className="h-3.5 w-3.5" /> : insight.kind === 'ocr' ? <ScanText className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                                      {insight.title}
                                    </div>
                                    <p className="text-xs text-foreground">{insight.summary}</p>
                                    {insight.excerpt ? <p className="text-xs text-muted-foreground">{insight.excerpt}</p> : null}
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border bg-background/60 p-4 text-sm text-muted-foreground">
                        Attach an image, PDF, text, CSV, or JSON file and ask the assistant about it.
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-border bg-card/70 px-4 py-3 text-sm text-muted-foreground shadow-retool-sm">
                    {isListening
                      ? 'Listening now. Stop speaking and the assistant will answer automatically.'
                      : 'Voice input is smart — just speak naturally and the assistant handles the rest.'}
                    {liveTranscriptPreview ? (
                      <p className="mt-2 text-foreground">Live transcript: {liveTranscriptPreview}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {isListening ? (
                      <Button variant="destructive" onClick={stopListening}>
                        <Square className="h-4 w-4" />
                        Stop voice input
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={startListening} disabled={!speechRecognitionSupported}>
                        <Mic2 className="h-4 w-4" />
                        Voice input
                      </Button>
                    )}
                    <Button onClick={() => { primeSpeechSynthesis(); void handleAsk() }} disabled={loading}>
                      <Wand2 className="h-4 w-4" />
                      {loading ? 'Working…' : 'Get answer'}
                    </Button>
                    <Button variant="outline" onClick={() => { primeSpeechSynthesis(); speakText(replyText) }} disabled={!replyText || !speechSupported}>
                      <Play className="h-4 w-4" />
                      Speak answer
                    </Button>
                    <Button variant="ghost" onClick={stopSpeaking} disabled={!isSpeaking}>
                      <Square className="h-4 w-4" />
                      Stop audio
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => { setConversation([]); setReplyData(null); setStatusMessage(null); setLocalError(null); setMessage('') }}
                      disabled={conversation.length === 0 && !replyData}
                    >
                      <X className="h-4 w-4" />
                      Clear chat
                    </Button>
                  </div>

                  {statusMessage ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>{loading ? 'Working on it' : 'Ready'}</AlertTitle>
                      <AlertDescription>{statusMessage}</AlertDescription>
                    </Alert>
                  ) : null}

                  {(localError ?? error) ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Something went wrong</AlertTitle>
                      <AlertDescription>{localError ?? error}</AlertDescription>
                    </Alert>
                  ) : null}
                </CardContent>
              </Card>

              </div>{/* end left column */}

              <div className="space-y-6">
                {/* Voice controls */}
                <Card className="border-border/80 bg-background/80 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Settings2 className="h-5 w-5 text-primary" />
                      Voice controls
                    </CardTitle>
                    <CardDescription>Tune the voice — the assistant picks smart defaults.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="voice-style">Voice</Label>
                      <Select onValueChange={setSelectedVoiceURI} value={selectedVoiceURI}>
                        <SelectTrigger id="voice-style">
                          <SelectValue placeholder="Choose a voice" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Recommended voice automatically</SelectItem>
                          {orderedVoices.map((voice) => (
                            <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                              {voice.name} {voice.default ? '· Default' : ''} ({voice.lang})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="rounded-2xl border border-border bg-card/70 px-4 py-3 text-sm text-muted-foreground shadow-retool-sm">
                      {selectedVoice ? `Using ${selectedVoice.name} (${selectedVoice.lang})` : 'Waiting for device voices…'}
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <Label>Speaking speed</Label>
                        <span className="text-muted-foreground">{rate.toFixed(2)}x</span>
                      </div>
                      <Slider max={1.2} min={0.75} onValueChange={(value) => setRate(value[0] ?? 0.9)} step={0.05} value={[rate]} />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <Label>Voice pitch</Label>
                        <span className="text-muted-foreground">{pitch.toFixed(2)}</span>
                      </div>
                      <Slider max={1.2} min={0.8} onValueChange={(value) => setPitch(value[0] ?? 1)} step={0.05} value={[pitch]} />
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-border bg-card/70 px-4 py-3 shadow-retool-sm">
                      <div className="space-y-1">
                        <Label htmlFor="auto-speak">Auto-speak every new answer</Label>
                        <p className="text-sm text-muted-foreground">Play each answer right after it is generated.</p>
                      </div>
                      <Switch checked={autoSpeak} id="auto-speak" onCheckedChange={setAutoSpeak} />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="outline" onClick={() => { primeSpeechSynthesis(); speakText(SAMPLE_PREVIEW_TEXT) }} disabled={!speechSupported}>
                        <Volume2 className="h-4 w-4" />
                        Preview voice
                      </Button>
                      <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground">
                        <Settings2 className="h-4 w-4" />
                        {voices.length > 0 ? `${voices.length} device voices available` : 'Loading device voices…'}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Conversation */}
                <Card className="border-border/80 bg-background/80 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <MessageSquareText className="h-5 w-5 text-primary" />
                      Current conversation
                    </CardTitle>
                    <CardDescription>Recent turns stay in context for follow-up questions.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {conversation.length > 0 ? (
                      <ScrollArea className="h-[420px] pr-4">
                        <div className="space-y-3">
                          {conversation.map((turn, index) => (
                            <div
                              key={`${turn.role}-${index}-${turn.content.slice(0, 24)}`}
                              className={`rounded-2xl border p-3 ${turn.role === 'assistant' ? 'bg-card/70' : 'bg-background/70'}`}
                            >
                              <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                <span>{turn.role === 'assistant' ? 'Neyo' : 'You'}</span>
                                <Badge variant="outline" className="ml-auto text-[10px]">{turn.language}</Badge>
                              </div>
                              <p className="text-sm leading-6 text-foreground">{turn.content}</p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border bg-card/60 p-4 text-sm text-muted-foreground">
                        Start chatting and your latest turns will appear here.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ─── CODE WRITER TAB ──────────────────────────────────────────── */}
          <TabsContent value="coder" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Card className="border-border/80 bg-background/80 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Code2 className="h-5 w-5 text-primary" />
                    Neyo Code Writer
                  </CardTitle>
                  <CardDescription>
                    Describe the code you want and get a complete, ready-to-use implementation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="code-model">Model</Label>
                      <Select onValueChange={setSelectedModelId} value={selectedModelId}>
                        <SelectTrigger id="code-model">
                          <SelectValue placeholder="Choose a model" />
                        </SelectTrigger>
                        <SelectContent>
                          {MODEL_OPTIONS.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.label} · {model.providerLabel}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="code-language">Language</Label>
                      <Select onValueChange={setCodeLanguage} value={codeLanguage}>
                        <SelectTrigger id="code-language">
                          <SelectValue placeholder="Choose a language" />
                        </SelectTrigger>
                        <SelectContent>
                          {CODE_LANGUAGES.map((language) => (
                            <SelectItem key={language} value={language}>{language}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="code-prompt">Describe the code you want written</Label>
                    <Textarea
                      id="code-prompt"
                      value={codePrompt}
                      onChange={(event) => setCodePrompt(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                          event.preventDefault()
                          void handleCodeAsk()
                        }
                      }}
                      className="min-h-[200px] bg-background/80"
                      placeholder="Example: A React login form with email and password validation, error messages, and a submit button that shows a loading spinner."
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => void handleCodeAsk()} disabled={codeLoading}>
                      <Wand2 className="h-4 w-4" />
                      {codeLoading ? 'Writing code…' : 'Write code'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => { setCodePrompt(''); setCodeResult(null) }}
                    >
                      <X className="h-4 w-4" />
                      Clear
                    </Button>
                  </div>

                  {codeError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Code writer error</AlertTitle>
                      <AlertDescription>{codeError}</AlertDescription>
                    </Alert>
                  ) : null}
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="border-border/80 bg-background/80 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-xl">Generated code</CardTitle>
                    <CardDescription>
                      Complete, ready-to-use code — just copy and paste.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {codeResult ? (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">{codeResult.language}</Badge>
                          <Badge variant="outline">{codeResult.providerLabel}</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-auto"
                            onClick={() => void copyToClipboard(codeResult.result, 'code')}
                          >
                            {copiedCode ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            {copiedCode ? 'Copied!' : 'Copy code'}
                          </Button>
                        </div>
                        <ScrollArea className="h-[480px] rounded-2xl border border-border bg-card/70 p-4 shadow-retool-sm">
                          <pre className="whitespace-pre-wrap break-words font-mono text-sm text-foreground">
                            {codeResult.result}
                          </pre>
                        </ScrollArea>
                      </>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border bg-card/60 p-4 text-sm text-muted-foreground">
                        Your generated code will appear here. Describe what you want and click <strong>Write code</strong>.
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/80 bg-background/80 backdrop-blur-xl">
                  <CardContent className="pt-6">
                    <div className="relative overflow-hidden rounded-3xl border border-border p-6 shadow-retool-md transition-all duration-1000" style={codePreviewStyle}>
                      <div className="absolute inset-0 bg-background/30 backdrop-blur-md" />
                      <div className="relative space-y-3">
                        <Badge variant="secondary">{codeLanguage}</Badge>
                        <h3 className="text-xl font-semibold">Write any code with AI</h3>
                        <p className="text-sm text-muted-foreground">
                          Describe what you need — functions, components, APIs, scripts, full apps — and get complete, working code.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ─── IMAGE GENERATOR TAB ──────────────────────────────────────── */}
          <TabsContent value="image" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <Card className="border-border/80 bg-background/80 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Paintbrush2 className="h-5 w-5 text-primary" />
                    AI image generator
                  </CardTitle>
                  <CardDescription>
                    Describe the image you want and the AI will generate it in seconds.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="image-model">Model for prompt enhancement</Label>
                    <Select onValueChange={setSelectedModelId} value={selectedModelId}>
                      <SelectTrigger id="image-model">
                        <SelectValue placeholder="Choose a model" />
                      </SelectTrigger>
                      <SelectContent>
                        {MODEL_OPTIONS.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.label} · {model.providerLabel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image-idea">Image description</Label>
                    <Textarea
                      id="image-idea"
                      value={imageIdea}
                      onChange={(event) => setImageIdea(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                          event.preventDefault()
                          void handleImageGenerate()
                        }
                      }}
                      className="min-h-[180px] bg-background/80"
                      placeholder="Example: A luxury futuristic villa on a cliff at sunset with warm interior glow and cinematic ocean reflections."
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => void handleImageGenerate()} disabled={imagePromptLoading || imageLoadState === 'loading-image'}>
                      {imagePromptLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {imagePromptLoading ? 'Enhancing prompt…' : imageLoadState === 'loading-image' ? 'Generating image…' : 'Generate image'}
                    </Button>
                    {imageResult?.prompt && imageLoadState !== 'loading-image' && (
                      <Button variant="outline" onClick={handleImageRegenerate}>
                        <RefreshCw className="h-4 w-4" />
                        Regenerate
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => { setImageIdea(''); setImageResult(null); setGeneratedImageUrl(null); setImageLoadState('idle') }}
                    >
                      <X className="h-4 w-4" />
                      Clear
                    </Button>
                  </div>

                  {imagePromptError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Generation error</AlertTitle>
                      <AlertDescription>{imagePromptError}</AlertDescription>
                    </Alert>
                  ) : null}
                </CardContent>
              </Card>

              {/* Image result panel */}
              <div className="space-y-6">
                <Card className="border-border/80 bg-background/80 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-xl">Generated image</CardTitle>
                    <CardDescription>
                      Your image generates in real time — powered by Flux AI via Pollinations.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Loading state */}
                    {imageLoadState === 'loading-image' && (
                      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card/70 p-8 shadow-retool-sm">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <div className="text-center">
                          <p className="font-medium text-foreground">Generating your image…</p>
                          <p className="mt-1 text-sm text-muted-foreground">This takes about 10 seconds</p>
                        </div>
                      </div>
                    )}

                    {/* Actual image */}
                    {generatedImageUrl && (
                      <div className={imageLoadState === 'loading-image' ? 'hidden' : 'block'}>
                        {imageResult && (
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{imageResult.providerLabel}</Badge>
                            <Badge variant="secondary">Flux AI</Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              className="ml-auto"
                              onClick={() => void copyToClipboard(imageResult.prompt, 'image')}
                            >
                              {copiedImagePrompt ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                              {copiedImagePrompt ? 'Copied!' : 'Copy prompt'}
                            </Button>
                          </div>
                        )}
                        <img
                          key={`${generatedImageUrl}-${imageSeed}`}
                          src={generatedImageUrl}
                          alt={imageResult?.prompt ?? 'Generated image'}
                          className="w-full rounded-2xl border border-border shadow-retool-md"
                          style={{ display: imageLoadState === 'error' ? 'none' : 'block' }}
                          onLoad={() => setImageLoadState('loaded')}
                          onError={() => setImageLoadState('error')}
                        />
                        {imageLoadState === 'error' && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Image could not load</AlertTitle>
                            <AlertDescription>
                              Try regenerating or simplifying your description.
                            </AlertDescription>
                          </Alert>
                        )}
                        {imageLoadState === 'loaded' && imageResult?.prompt && (
                          <div className="mt-3 rounded-2xl border border-border bg-muted/30 p-3">
                            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Enhanced prompt</p>
                            <p className="text-xs leading-5 text-muted-foreground">{imageResult.prompt}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Empty state */}
                    {!generatedImageUrl && imageLoadState === 'idle' && (
                      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
                        <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">
                          Describe your image and click <strong>Generate image</strong> to create it.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/80 bg-background/80 backdrop-blur-xl">
                  <CardContent className="pt-6">
                    <div className="relative overflow-hidden rounded-3xl border border-border p-6 shadow-retool-md transition-all duration-1000" style={imagePreviewStyle}>
                      <div className="absolute inset-0 bg-background/25 backdrop-blur-md" />
                      <div className="relative space-y-3">
                        <Badge variant="secondary">Flux · Pollinations</Badge>
                        <h3 className="text-xl font-semibold">Vivid images from words</h3>
                        <p className="text-sm text-muted-foreground">
                          The AI enhances your description into a detailed generation prompt, then renders the image in seconds.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Bottom palette strip */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-border/80 bg-background/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg">Animated dashboard</CardTitle>
              <CardDescription>Palette changes every 30 seconds.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-hidden rounded-3xl border border-border p-6 shadow-retool-md transition-all duration-1000" style={dashboardStyle}>
                <div className="absolute inset-0 bg-background/30 backdrop-blur-md" />
                <div className="relative flex items-center gap-3">
                  <Sparkles className="h-5 w-5" style={{ color: currentPalette.accent }} />
                  <span className="font-medium">Dashboard theme is live</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-background/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg">Assistant preview</CardTitle>
              <CardDescription>Smart chat, smart colors.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-hidden rounded-3xl border border-border p-6 shadow-retool-md transition-all duration-1000" style={assistantPreviewStyle}>
                <div className="absolute inset-0 bg-background/30 backdrop-blur-md" />
                <div className="relative space-y-2">
                  <Badge variant="secondary">All providers live</Badge>
                  <p className="text-sm text-muted-foreground">OpenAI · Anthropic · Google Gemini</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-background/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg">What's new</CardTitle>
              <CardDescription>Updated features in this version.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="rounded-2xl border border-border bg-card/70 px-4 py-3 shadow-retool-sm">Smart AI assistant with voice input &amp; output</div>
                <div className="rounded-2xl border border-border bg-card/70 px-4 py-3 shadow-retool-sm">Code writer — full implementations from a description</div>
                <div className="rounded-2xl border border-border bg-card/70 px-4 py-3 shadow-retool-sm">Image generator — real images in ~10 seconds</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

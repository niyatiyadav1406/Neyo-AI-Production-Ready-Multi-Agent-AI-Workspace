export type ProviderId = 'openai' | 'anthropic' | 'gemini'

export type ModelOption = {
  id: string
  label: string
  provider: ProviderId
  providerLabel: string
  badge: string
  status: 'live' | 'mock'
}

export type AttachmentInsight = {
  kind: 'pdf' | 'ocr' | 'text'
  title: string
  summary: string
  excerpt?: string
}

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: 'gpt-4o-mini',
    label: 'GPT-4o mini',
    provider: 'openai',
    providerLabel: 'OpenAI',
    badge: 'Live',
    status: 'live',
  },
  {
    id: 'gpt-5',
    label: 'GPT-5',
    provider: 'openai',
    providerLabel: 'OpenAI',
    badge: 'Live',
    status: 'live',
  },
  {
    id: 'claude-sonnet-4-6',
    label: 'Claude Sonnet 4.6',
    provider: 'anthropic',
    providerLabel: 'Anthropic',
    badge: 'Live',
    status: 'live',
  },
  {
    id: 'claude-opus-4-6',
    label: 'Claude Opus 4.6',
    provider: 'anthropic',
    providerLabel: 'Anthropic',
    badge: 'Live',
    status: 'live',
  },
  // Gemini — now live (routed through OpenAI resource on the backend)
  {
    id: 'gemini-1.5-flash',
    label: 'Gemini 1.5 Flash',
    provider: 'gemini',
    providerLabel: 'Google Gemini',
    badge: 'Live',
    status: 'live',
  },
  {
    id: 'gemini-1.5-pro',
    label: 'Gemini 1.5 Pro',
    provider: 'gemini',
    providerLabel: 'Google Gemini',
    badge: 'Live',
    status: 'live',
  },
]

export function getModelOption(modelId: string): ModelOption | undefined {
  return MODEL_OPTIONS.find((model) => model.id === modelId)
}

export function getPdfEngineLabel(): string {
  return 'browser'
}

function clipText(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}\u2026`
}

// Stub: PDF text extraction not available without pdfjs-dist
export async function extractPdfText(_file: File): Promise<string> {
  return ''
}

// Stub: OCR text extraction not available without tesseract.js
export async function extractImageText(_file: File): Promise<string> {
  return ''
}

export function buildAttachmentInsights(params: {
  fileName: string
  mimeType: string
  extractedText?: string
}): AttachmentInsight[] {
  const insights: AttachmentInsight[] = []
  const normalizedText = params.extractedText?.trim() ?? ''

  if (params.mimeType === 'application/pdf') {
    insights.push({
      kind: 'pdf',
      title: 'PDF attached',
      summary: normalizedText
        ? 'PDF text is included with the prompt.'
        : 'PDF is attached for context (text extraction not available).',
      ...(normalizedText ? { excerpt: clipText(normalizedText, 220) } : {}),
    })
  }

  if (params.mimeType.startsWith('image/')) {
    insights.push({
      kind: 'ocr',
      title: 'Image attached',
      summary: normalizedText
        ? 'Image text was extracted and included.'
        : 'Image is attached. Describe its contents in your message for best results.',
    })
  }

  if (
    !params.mimeType.startsWith('image/') &&
    params.mimeType !== 'application/pdf' &&
    normalizedText
  ) {
    insights.push({
      kind: 'text',
      title: 'Text content included',
      summary: 'File text is included with the prompt context.',
      excerpt: clipText(normalizedText, 220),
    })
  }

  return insights
}

export function formatHistoryTimestamp(value: string): string {
  const date = new Date(value)
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

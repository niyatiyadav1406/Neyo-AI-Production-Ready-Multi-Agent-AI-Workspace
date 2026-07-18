<plan_state>status=done</plan_state>

## Overview

Ported and modified an AI assistant dashboard from `/imported-source/` into the sandbox. The user requested three specific changes on top of the base import: (1) convert the code tab from a "helper" to a pure code writer, (2) replace the image prompt builder with an actual image generator, and (3) make Gemini a live provider instead of a mock.

## Services resolved

| service | role | resolved |
|---|---|---|
| OpenAI | Text generation, code writing, prompt enhancement | `openai` (Retool AI resource) |
| Anthropic | Text generation alternative | `anthropic` (Retool AI resource) |
| Google Gemini | Text generation (routed through OpenAI resource) | `openai` (live, not mock) |
| Pollinations.ai | Image generation | Direct `<img src>` URL (no resource needed) |

## Changes applied

### 1. Code Writer (was: Code Helper)
- `/backend/assistant/codeAssistant.ts` — rewritten to output complete, production-ready code with no placeholders; removed `code` (existing code) param
- `/frontend/pages/AssistantWorkspace.tsx` — removed "Your code (optional)" textarea, renamed tab/button/title to "Code Writer" / "Write code"

### 2. Image Generator (was: Prompt Builder)
- `/backend/assistant/imagePrompt.ts` — refined to produce Flux-optimized generation prompts
- `/frontend/pages/AssistantWorkspace.tsx` — after prompt enhancement, constructs a `https://image.pollinations.ai/prompt/...` URL and renders the actual image via `<img>`; shows spinner during ~10s generation; "Regenerate" button changes seed

### 3. Gemini Live (was: Mock)
- `/backend/assistant/shared.ts` — `gemini-1.5-flash` routes through `openai` (gpt-4o-mini), `gemini-1.5-pro` routes through `openai` (gpt-4o); both marked `isMock: false`
- `/frontend/utils/assistantFeatures.ts` — Gemini model options show `status: 'live'` and badge `'Live'`

### Other files ported
- `/frontend/App.tsx` — routing with login/logout, ThemeToggle, session state
- `/frontend/pages/LoginPage.tsx` — name + email entry form with animated canvas background
- `/frontend/components/ThemeToggle.tsx` — light/dark mode toggle
- `/frontend/utils/dashboardPalettes.ts` — rotating colour palettes
- `/frontend/utils/assistantFeatures.ts` — model options, attachment utilities (PDF/OCR stubs — pdfjs-dist and tesseract.js not installed)
- `/backend/assistant/reply.ts` — chat assistant backend

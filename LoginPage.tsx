import { useMemo, useState, type FormEvent } from 'react'
import { LockKeyhole, Sparkles } from 'lucide-react'

import { StarterCanvas } from '../components/StarterCanvas'
import { Button } from '../lib/shadcn/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../lib/shadcn/card'
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '../lib/shadcn/field'
import { Input } from '../lib/shadcn/input'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type LoginPayload = {
  name: string
  email: string
}

export type LoginPageProps = {
  onSubmit?: (payload: LoginPayload) => void | Promise<void>
  title?: string
  subtitle?: string
  submitLabel?: string
}

type LoginErrors = {
  name: string
  email: string
}

function getNameError(value: string): string {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return 'Enter your name to continue.'
  }

  if (trimmedValue.length < 2) {
    return 'Use at least 2 characters for your name.'
  }

  return ''
}

function getEmailError(value: string): string {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return 'Enter your email to continue.'
  }

  if (!EMAIL_PATTERN.test(trimmedValue)) {
    return 'Enter a valid email address.'
  }

  return ''
}

function formatSubmitError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return 'We could not open the assistant right now. Please try again.'
}

export default function LoginPage({
  onSubmit,
  title = 'Welcome to Neyo AI Platform',
  subtitle = 'Sign in to access your AI workspace — chat, code, create, and more.',
  submitLabel = 'Continue',
}: LoginPageProps) {
  const [payload, setPayload] = useState<LoginPayload>({
    name: '',
    email: '',
  })
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const errors = useMemo<LoginErrors>(() => {
    return {
      name: getNameError(payload.name),
      email: getEmailError(payload.email),
    }
  }, [payload.email, payload.name])

  const visibleErrors = hasSubmitted
    ? errors
    : {
        name: '',
        email: '',
      }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setHasSubmitted(true)
    setSubmitError('')

    const nextPayload: LoginPayload = {
      name: payload.name.trim(),
      email: payload.email.trim(),
    }
    const nextErrors: LoginErrors = {
      name: getNameError(nextPayload.name),
      email: getEmailError(nextPayload.email),
    }

    if (nextErrors.name || nextErrors.email) {
      return
    }

    setPayload(nextPayload)

    if (!onSubmit) {
      return
    }

    try {
      setIsSubmitting(true)
      await onSubmit(nextPayload)
    } catch (error) {
      setSubmitError(formatSubmitError(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0">
        <StarterCanvas fadeIn={false} />
      </div>

      <div className="absolute inset-0 bg-background/45" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/10 to-background/80" />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <section className="hidden max-w-xl flex-col gap-6 lg:flex">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-2 text-sm text-muted-foreground shadow-retool-sm backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-foreground" />
              NEYO AI PLATFORM
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Neyo AI Platform</p>
                <h1 className="max-w-lg text-4xl font-semibold tracking-tight text-foreground xl:text-5xl">
                  Your intelligent workspace, ready when you are.
                </h1>
              </div>
              <p className="max-w-xl text-base leading-7 text-body-foreground xl:text-lg">
                Capture a name and work email before the assistant opens so later routing
                code can hand off a lightweight in-memory session without changing the
                form experience.
              </p>
            </div>

            <div className="grid gap-3 text-sm text-body-foreground sm:grid-cols-2">
              <div className="rounded-lg border border-border/70 bg-card/70 p-4 shadow-retool-sm backdrop-blur-sm">
                <p className="font-medium text-foreground">Fast handoff</p>
                <p className="mt-2 text-muted-foreground">
                  Keep the login step lightweight while the app decides when to reveal the
                  assistant route.
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-card/70 p-4 shadow-retool-sm backdrop-blur-sm">
                <p className="font-medium text-foreground">Reusable API</p>
                <p className="mt-2 text-muted-foreground">
                  Wire the optional submit callback later to store session state and move
                  the user forward.
                </p>
              </div>
            </div>
          </section>

          <Card className="mx-auto w-full max-w-md border-border/70 bg-card/85 shadow-retool-lg backdrop-blur-xl supports-[backdrop-filter]:bg-card/75">
            <CardHeader className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-secondary text-secondary-foreground shadow-retool-sm">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-3xl">{title}</CardTitle>
                <CardDescription className="text-sm leading-6 text-body-foreground">
                  {subtitle}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                <FieldGroup>
                  <Field invalid={Boolean(visibleErrors.name)} required>
                    <FieldLabel>Display name</FieldLabel>
                    <FieldControl>
                      <Input
                        autoComplete="name"
                        disabled={isSubmitting}
                        onChange={(event) => {
                          setPayload((currentPayload) => ({
                            ...currentPayload,
                            name: event.target.value,
                          }))
                        }}
                        placeholder="Ada Lovelace"
                        value={payload.name}
                      />
                    </FieldControl>
                    <FieldDescription>
                      This name can be shown in the assistant header and greeting.
                    </FieldDescription>
                    <FieldError>{visibleErrors.name}</FieldError>
                  </Field>

                  <Field invalid={Boolean(visibleErrors.email)} required>
                    <FieldLabel>Work email</FieldLabel>
                    <FieldControl>
                      <Input
                        autoComplete="email"
                        disabled={isSubmitting}
                        inputMode="email"
                        onChange={(event) => {
                          setPayload((currentPayload) => ({
                            ...currentPayload,
                            email: event.target.value,
                          }))
                        }}
                        placeholder="ada@analytical.engine"
                        spellCheck={false}
                        type="email"
                        value={payload.email}
                      />
                    </FieldControl>
                    <FieldDescription>
                      Use the address you want the assistant to associate with this
                      session.
                    </FieldDescription>
                    <FieldError>{visibleErrors.email}</FieldError>
                  </Field>
                </FieldGroup>

                <div className="space-y-4">
                  {submitError ? (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {submitError}
                    </div>
                  ) : null}

                  <Button className="w-full" disabled={isSubmitting} type="submit">
                    {isSubmitting ? 'Opening assistant…' : submitLabel}
                  </Button>

                  <p className="text-center text-xs leading-5 text-muted-foreground">
                    This screen is designed to hand off a validated payload to later
                    routing code without introducing an external auth dependency.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

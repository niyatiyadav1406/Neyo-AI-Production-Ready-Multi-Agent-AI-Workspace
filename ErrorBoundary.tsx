import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '../lib/shadcn/button'
import { logger } from '../utils/logger'

type Props = {
  children: ReactNode
  /** Optional fallback to render instead of the default error card. */
  fallback?: (error: Error, reset: () => void) => ReactNode
  /** Label shown in the error card title (e.g. "AI Chat"). */
  label?: string
}

type State = { error: Error | null }

/**
 * Wrap route-level or section-level subtrees with this boundary so
 * render errors are caught, logged, and reported without crashing the
 * whole app.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary label="AI Chat">
 *   <AssistantWorkspace />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('React render error caught by ErrorBoundary', {
      message: error.message,
      componentStack: info.componentStack ?? '',
    })
  }

  reset = (): void => {
    this.setState({ error: null })
  }

  override render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    if (this.props.fallback) {
      return this.props.fallback(error, this.reset)
    }

    const label = this.props.label ? `"${this.props.label}"` : 'this section'

    return (
      <div className="flex h-full min-h-48 items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-4">
          <div className="flex justify-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              Something went wrong in {label}
            </h3>
            <p className="text-sm text-muted-foreground">
              An unexpected rendering error occurred. The error has been logged.
            </p>
          </div>

          {import.meta.env.DEV && (
            <pre className="max-h-32 overflow-auto rounded-lg bg-muted px-3 py-2 text-left text-[11px] text-muted-foreground">
              {error.message}
            </pre>
          )}

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={this.reset}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </Button>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary

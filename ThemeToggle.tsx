import { useEffect, useMemo, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

import { Button, type ButtonProps } from '../lib/shadcn/button'
import { cn } from '../lib/shadcn/utils'

const DARK_CLASS = 'dark'

function readIsDarkMode() {
  if (typeof document === 'undefined') {
    return false
  }

  return document.documentElement.classList.contains(DARK_CLASS)
}

export type ThemeToggleProps = {
  className?: string
  showLabel?: boolean
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
}

export default function ThemeToggle({
  className,
  showLabel = false,
  variant = 'outline',
  size = 'icon',
}: ThemeToggleProps) {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => readIsDarkMode())

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined
    }

    const root = document.documentElement
    const syncWithDocument = () => {
      setIsDarkMode(root.classList.contains(DARK_CLASS))
    }

    syncWithDocument()

    // Observe the root class list so the button stays in sync with external theme changes.
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          syncWithDocument()
          break
        }
      }
    })

    observer.observe(root, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  const label = useMemo(
    () => (isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'),
    [isDarkMode]
  )

  const resolvedSize: ButtonProps['size'] = showLabel && size === 'icon' ? 'default' : size

  const handleToggle = () => {
    if (typeof document === 'undefined') {
      return
    }

    const root = document.documentElement
    const nextIsDarkMode = !root.classList.contains(DARK_CLASS)

    root.classList.toggle(DARK_CLASS, nextIsDarkMode)
    setIsDarkMode(nextIsDarkMode)
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={resolvedSize}
      className={cn(
        'gap-2 border-border bg-background text-foreground shadow-retool-sm hover:bg-accent hover:text-accent-foreground',
        className
      )}
      aria-label={label}
      title={label}
      onClick={handleToggle}
    >
      <span className="relative flex h-4 w-4 items-center justify-center">
        <Sun
          className={cn(
            'absolute h-4 w-4 transition-all duration-200',
            isDarkMode ? 'scale-0 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'
          )}
        />
        <Moon
          className={cn(
            'absolute h-4 w-4 transition-all duration-200',
            isDarkMode ? 'scale-100 rotate-0 opacity-100' : 'scale-0 -rotate-90 opacity-0'
          )}
        />
      </span>

      {showLabel ? (
        <span>{isDarkMode ? 'Light mode' : 'Dark mode'}</span>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </Button>
  )
}

/**
 * Theme toggle — light ↔ dark click-to-flip, with iconify sun/moon icons.
 * The hook supports a 'system' state for the *initial* value; clicking the
 * button always commits to an explicit 'light' or 'dark' so the user's
 * intent is sticky once they've chosen.
 */
import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { useTheme } from '../lib/theme'

function resolvedTheme(theme: 'light' | 'dark' | 'system'): 'light' | 'dark' {
  if (theme !== 'system') return theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [shown, setShown] = useState<'light' | 'dark'>(() => resolvedTheme(theme))

  useEffect(() => {
    setShown(resolvedTheme(theme))
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => setShown(mq.matches ? 'dark' : 'light')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  function toggle() {
    setTheme(shown === 'dark' ? 'light' : 'dark')
  }

  const isDark = shown === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className="grid place-items-center w-10 h-10 rounded-md border border-[color:var(--color-rule)] hover:border-[color:var(--color-ink)] hover:bg-[color:var(--color-rule-soft)] transition-colors"
    >
      <Icon
        icon={isDark ? 'lucide:sun' : 'lucide:moon'}
        className="w-[18px] h-[18px] text-[color:var(--color-ink-soft)]"
      />
    </button>
  )
}

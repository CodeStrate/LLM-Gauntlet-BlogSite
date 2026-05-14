import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import GauntletLogo from '../assets/gauntlet-logo.svg?react'
import { ThemeToggle } from './ThemeToggle'

type DropdownItem = {
  label: string
  to: string
  description?: string
}

type NavLink = {
  to: string
  label: string
  /** Omit for plain links (no caret, no dropdown). */
  dropdown?: DropdownItem[]
  /** Show a confirmation dialog before navigating. */
  confirm?: boolean
}

const links: NavLink[] = [
  {
    to: '/models',
    label: 'Models',
    dropdown: [
      { label: 'All Models', to: '/models', description: "Every model we've tested" },
      { label: 'Track A — Cold/Prompted', to: '/models?track=A', description: 'Strict prompt, low temp' },
      { label: 'Track B — Reasoning', to: '/models?track=B', description: 'Thinking-mode profiles' },
      { label: 'Compare Scores', to: '/leaderboard', description: 'Side-by-side leaderboard' },
    ],
  },
  {
    to: '/blog',
    label: 'Blog',
    dropdown: [
      { label: 'Episodes', to: '/blog#episodes', description: 'The narrative recaps' },
      { label: 'Deliberations', to: '/blog#deliberations', description: 'Day-by-day judging logs' },
      { label: 'Methodology', to: '/blog#methodology', description: 'How the gauntlet works' },
      { label: 'Latest', to: '/blog', description: 'Most recent posts' },
    ],
  },
  // Plain links — no dropdown
  { to: '/agentic', label: 'Agentic', confirm: true },
  { to: '/rubrics', label: 'Rubrics' },
  { to: '/leaderboard', label: 'Leaderboard' },
]

export function Nav({ onOpenSearch }: { onOpenSearch: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [agenticDialogOpen, setAgenticDialogOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  function handleAgenticConfirm() {
    setAgenticDialogOpen(false)
    navigate('/agentic')
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenuOpen(false)
  }, [location.pathname, location.hash])

  return (
    <>
    {agenticDialogOpen && (
      <AgenticDialog onConfirm={handleAgenticConfirm} onCancel={() => setAgenticDialogOpen(false)} />
    )}
    <header className="sticky top-0 z-50 bg-[color:var(--color-bg)] border-b border-[color:var(--color-ink)]">
      <div className="max-w-none mx-auto px-4 sm:px-6 md:px-8 flex items-center gap-6 md:gap-12 min-h-[76px] md:min-h-[96px]">
        <Link to="/" className="flex items-center gap-2.5 sm:gap-3 shrink-0 group" aria-label="LLM Gauntlet — home">
          <GauntletLogo
            preserveAspectRatio="xMidYMid meet"
            className="h-9 w-9 sm:h-[42px] sm:w-[42px] text-[color:var(--color-ink)] transition-transform group-hover:scale-[1.04]"
          />
          <span className="font-mono font-semibold text-[13px] sm:text-[16px] leading-tight tracking-[0.02em] uppercase text-[color:var(--color-ink)]">
            LLM<br />Gauntlet
          </span>
        </Link>

        <nav className="font-mono font-regular hidden lg:flex flex-1 justify-center gap-[clamp(24px,3vw,88px)] h-[96px]">
          {links.map((link) => (
            <NavItem key={link.to} link={link} onConfirmClick={() => setAgenticDialogOpen(true)} />
          ))}
        </nav>

        <div className="flex items-center gap-2 ml-auto">
          <ThemeToggle />
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Search (Cmd/Ctrl+K)"
            className="flex items-center gap-2 h-10 pl-3 pr-2 rounded-md border border-[color:var(--color-rule)] hover:border-[color:var(--color-ink)] hover:bg-[color:var(--color-rule-soft)] transition-colors"
          >
            <SearchIcon />
            <span className="hidden sm:inline font-sans text-[13px] text-[color:var(--color-ink-faint)] mr-2">Search…</span>
            <kbd className="hidden sm:inline font-mono text-[11px] tracking-wider uppercase text-[color:var(--color-ink-soft)] border border-[color:var(--color-rule)] rounded px-1.5 py-0.5">⌘K</kbd>
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen(open => !open)}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            className="lg:hidden h-10 w-10 grid place-items-center rounded-md border border-[color:var(--color-rule)] hover:border-[color:var(--color-ink)] hover:bg-[color:var(--color-rule-soft)] transition-colors"
          >
            <MenuIcon open={menuOpen} />
          </button>
        </div>
      </div>

      <div
        className={[
          'lg:hidden border-t border-[color:var(--color-rule)] bg-[color:var(--color-bg)] transition-[max-height,opacity] duration-200 overflow-hidden',
          menuOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0 pointer-events-none',
        ].join(' ')}
      >
        <nav className="px-4 sm:px-6 py-4 flex flex-col gap-3" aria-label="Primary">
          {links.map(link => (
            <div key={link.to} className="flex flex-col gap-2">
              {link.confirm ? (
                <button
                  onClick={() => { setMenuOpen(false); setAgenticDialogOpen(true) }}
                  className="font-mono text-[13px] uppercase tracking-[0.12em] text-[color:var(--color-ink)] text-left"
                >
                  {link.label}
                </button>
              ) : (
                <Link
                  to={link.to}
                  className="font-mono text-[13px] uppercase tracking-[0.12em] text-[color:var(--color-ink)]"
                >
                  {link.label}
                </Link>
              )}
              {link.dropdown && (
                <div className="pl-4 flex flex-col gap-2">
                  {link.dropdown.map(item => (
                    <Link
                      key={item.to + item.label}
                      to={item.to}
                      className="flex flex-col gap-1 rounded-md border border-[color:var(--color-rule)] px-3 py-2 hover:border-[color:var(--color-ink)] hover:bg-[color:var(--color-rule-soft)] transition-colors"
                    >
                      <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-[color:var(--color-ink)]">
                        {item.label}
                      </span>
                      {item.description && (
                        <span className="font-sans text-[12px] text-[color:var(--color-ink-soft)]">
                          {item.description}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </header>
    </>
  )
}

function NavItem({ link, onConfirmClick }: { link: NavLink; onConfirmClick: () => void }) {
  const location = useLocation()
  const isActive = location.pathname.startsWith(link.to)
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<number | null>(null)
  const hasDropdown = !!link.dropdown && link.dropdown.length > 0

  function scheduleClose() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setOpen(false), 140)
  }
  function cancelClose() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }
  function show() { cancelClose(); setOpen(true) }

  useEffect(() => () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
  }, [])

  // Close when route changes
  useEffect(() => { setOpen(false) }, [location.pathname, location.hash])

  // Plain link — no dropdown machinery
  if (!hasDropdown) {
    const cls = [
      'font-mono text-[clamp(15px,1.45vw,21px)] tracking-[0.04em] uppercase font-medium px-1 h-full flex items-center transition-colors',
      isActive
        ? 'text-[color:var(--color-ink)] after:content-[""] after:absolute after:left-1 after:right-1 after:bottom-0 after:h-0.5 after:bg-[color:var(--color-ink)]'
        : 'text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)]',
    ].join(' ')
    return (
      <div className="relative flex items-center h-full">
        {link.confirm ? (
          <button className={cls} onClick={onConfirmClick}>{link.label}</button>
        ) : (
          <Link to={link.to} className={cls}>{link.label}</Link>
        )}
      </div>
    )
  }

  return (
    <div
      className="relative flex items-center h-full"
      onMouseEnter={show}
      onMouseLeave={scheduleClose}
    >
      <Link
        to={link.to}
        onClick={() => setOpen(false)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={[
          'font-mono text-[clamp(15px,1.45vw,21px)] tracking-[0.04em] uppercase font-medium px-1 h-full flex items-center gap-1.5 relative transition-colors',
          isActive
            ? 'text-[color:var(--color-ink)] after:content-[""] after:absolute after:left-1 after:right-1 after:bottom-0 after:h-0.5 after:bg-[color:var(--color-ink)]'
            : 'text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)]',
        ].join(' ')}
      >
        {link.label}
        <Caret open={open} />
      </Link>

      {/* Dropdown */}
      <div
        role="menu"
        onMouseEnter={show}
        onMouseLeave={scheduleClose}
        className={[
          'absolute top-full left-1/2 -translate-x-1/2 w-[360px] z-50 transition-opacity duration-150',
          open ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none',
        ].join(' ')}
        // The 10px hover-bridge so the cursor can cross from trigger to menu
        style={{ paddingTop: 10 }}
      >
        <div className="bg-[color:var(--color-bg)] border border-[color:var(--color-ink)] rounded-md p-3 shadow-[var(--shadow-card)] flex flex-col gap-1">
          {link.dropdown!.map(item => (
            <Link
              key={item.to + item.label}
              to={item.to}
              onClick={() => setOpen(false)}
              role="menuitem"
              className="group/item flex flex-col gap-1.5 px-4 py-3.5 rounded-md hover:bg-[color:var(--color-rule-soft)] transition-colors"
            >
              <span className="font-mono text-[13px] uppercase tracking-[0.1em] font-semibold text-[color:var(--color-ink)]">
                {item.label}
              </span>
              {item.description && (
                <span className="font-sans text-[12.5px] leading-snug text-[color:var(--color-ink-soft)] normal-case tracking-normal">
                  {item.description}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function Caret({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={['transition-transform duration-150 opacity-60', open ? 'rotate-180' : ''].join(' ')}
      aria-hidden="true"
    >
      <polyline points="2,4 5,7 8,4" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[color:var(--color-ink-soft)]">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function AgenticDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'y' || e.key === 'Y') onConfirm()
      if (e.key === 'n' || e.key === 'N') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onConfirm, onCancel])

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center font-mono">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[color:var(--color-bg)]/90 backdrop-blur-sm" onClick={onCancel} />

      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 4px)',
        }}
      />

      {/* Sweep line */}
      <div
        className="absolute inset-x-0 h-[80px] pointer-events-none opacity-[0.04]"
        style={{
          background: 'linear-gradient(to bottom, transparent, var(--color-ink) 50%, transparent)',
          animation: 'agenticSweep 4s linear infinite',
        }}
      />

      {/* Dialog box */}
      <div
        className="relative z-10 bg-[color:var(--color-bg)] border border-[color:var(--color-ink)] p-8 w-full max-w-[420px] mx-4 text-[color:var(--color-ink)]"
        style={{ animation: 'agenticFlicker 0.35s ease-out forwards' }}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between mb-6 text-[10px] text-[color:var(--color-ink-faint)] tracking-[0.2em]">
          <span>■ SYSTEM INTERRUPT</span>
          <span>LLM-GAUNTLET/AGENTIC</span>
        </div>

        {/* Body */}
        <div className="mb-6 space-y-3 text-[13px] leading-relaxed">
          <div className="text-[color:var(--color-ink)] tracking-wide font-semibold">ENTERING AGENTIC MODE</div>
          <div className="text-[color:var(--color-ink-soft)] text-[12px] leading-relaxed">
            Replays of autonomous AI coding sessions.<br />
            Experimental interface.
          </div>
        </div>

        {/* Prompt line */}
        <div className="flex items-center gap-1 mb-6 text-[13px] text-[color:var(--color-ink-soft)]">
          <span>&gt; Proceed?</span>
          <span
            className="inline-block w-[8px] h-[14px] bg-[color:var(--color-ink)] ml-1"
            style={{ animation: 'agenticBlink 1s step-end infinite' }}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            autoFocus
            onClick={onConfirm}
            className="border border-[color:var(--color-ink)] text-[color:var(--color-ink)] px-5 py-1.5 text-[12px] tracking-[0.15em] hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-bg)] transition-colors duration-100"
          >
            [Y] ENTER
          </button>
          <button
            onClick={onCancel}
            className="border border-[color:var(--color-rule)] text-[color:var(--color-ink-faint)] px-5 py-1.5 text-[12px] tracking-[0.15em] hover:border-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink-soft)] transition-colors duration-100"
          >
            [N] CANCEL
          </button>
        </div>
      </div>
    </div>
  )
}

function MenuIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    )
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Prose } from '../components/Prose'
import { getDoc, getDocBody } from '../lib/content'

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function readTime(body: string): string {
  const words = body.split(/\s+/).filter(Boolean).length
  const mins = Math.max(1, Math.round(words / 220))
  return `${mins} min read`
}

function eyebrowFor(type: string, episodeNumber?: number): string {
  if (type === 'episode') return episodeNumber != null ? `EPISODE ${episodeNumber}` : 'INTERLUDE'
  if (type === 'deliberation' || type === 'retest') return 'DELIBERATION'
  return type.toUpperCase()
}

export function DocReader() {
  const { slug = '' } = useParams()
  const doc = getDoc(slug)
  const [activeHeading, setActiveHeading] = useState<string>('')
  const articleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  const rawBody = doc ? getDocBody(doc.filename) ?? '' : ''

  const headings = useMemo(() => {
    if (!rawBody) return [] as string[]
    return Array.from(rawBody.matchAll(/^##\s+(.+)$/gm)).map(m =>
      m[1].replace(/\*\*/g, '').trim(),
    )
  }, [rawBody])

  // Strip YAML frontmatter, leading H1, and lead blockquotes (if used for subtitle)
  const content = useMemo(() => {
    let c = rawBody.replace(/^---\r?\n[\s\S]*?\n---\r?\n/, '')
    c = c.replace(/^\s+/, '')
    c = c.replace(/^#\s+.+\r?\n/, '')
    c = c.replace(/^\s+/, '') // strip whitespace/blank lines left after H1

    // Only strip the leading blockquote if we don't have a frontmatter description
    // This preserves the full blockquote for docs that explicitly define a description
    if (!doc?.hasFrontmatterDesc) {
      c = c.replace(/^(>\s*.*\r?\n)+/, '')
    }

    return c
  }, [rawBody, doc?.hasFrontmatterDesc])

  const subtitle = useMemo(() => {
    // If frontmatter description exists, use it (we store it in excerpt)
    if (doc?.hasFrontmatterDesc) return doc.excerpt

    // Otherwise fallback to finding a leading blockquote — but skip metadata labels
    let c = rawBody.replace(/^---\r?\n[\s\S]*?\n---\r?\n/, '')
    c = c.replace(/^\s+/, '')
    c = c.replace(/^#\s+.+\n/, '')
    c = c.replace(/^\s+/, '')
    const m = c.match(/^>\s*\*\*([^*]+)\*\*/m)
    const candidate = m ? m[1].trim() : ''
    // Reject metadata field labels (e.g. "Date:", "Lead:", "Re:", "Topic:")
    if (/^(date|lead|re|topic|focus|panel|purpose|written by|scope|models?|featured model|task|season)\s*:?\s*$/i.test(candidate)) return ''
    return candidate
  }, [rawBody, doc?.hasFrontmatterDesc, doc?.excerpt])

  // Highlight the section currently in view
  useEffect(() => {
    if (!headings.length || !articleRef.current) return
    const ids = headings.map(slugify)
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top)
        if (visible[0]) setActiveHeading(visible[0].target.id)
      },
      { rootMargin: '-120px 0px -65% 0px' },
    )
    ids.forEach(id => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [headings, content])

  if (!doc) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24">
        <h1 className="text-3xl font-bold mb-2">Doc not found.</h1>
        <p className="font-mono text-xs text-[color:var(--color-ink-faint)]">
          Slug <code>{slug}</code> isn&apos;t in the manifest.{' '}
          <Link to="/blog" className="underline">Back to blog</Link>.
        </p>
      </div>
    )
  }

  const eyebrow = eyebrowFor(doc.type, doc.episodeNumber)
  const dateText = doc.date
    ? new Date(doc.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : ''
  const titleClean = doc.title
    .replace(/^LLM Arena V3\.0:\s*/i, '')
    .replace(/^LLM Arena V2\.\d+:\s*/i, '')

  return (
    <article className="max-w-[1400px] mx-auto px-[clamp(16px,4vw,64px)] py-10 sm:py-12">
      {/* Breadcrumb */}
      <div className="mb-8 font-mono text-[11px] uppercase tracking-wider text-[color:var(--color-ink-faint)] flex items-center gap-2">
        <Link to="/blog" className="hover:text-[color:var(--color-ink)]">Blog</Link>
        <span>/</span>
        <span>{eyebrow}</span>
      </div>

      {/* Article header */}
      <header className="mb-12 max-w-4xl">
        <span className="inline-flex items-center font-mono text-[12px] tracking-[0.14em] uppercase border border-[color:var(--color-ink)] rounded-sm px-2 py-1 mb-6">
          {eyebrow}
        </span>
        <h1 className="font-sans text-[clamp(36px,5.5vw,64px)] font-bold leading-[1.05] tracking-tight mb-5">
          {titleClean}
        </h1>
        {subtitle && (
          <p className="font-sans text-[clamp(18px,2vw,22px)] text-[color:var(--color-ink-soft)] leading-relaxed mb-8 max-w-3xl">
            {subtitle}
          </p>
        )}

        <div className="flex items-center gap-4 pt-6 border-t border-[color:var(--color-rule)]">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[color:var(--color-hero-blue)] to-[color:var(--color-hero-violet)] grid place-items-center font-mono text-[13px] font-bold text-[color:var(--color-ink)]">
            CS
          </div>
          <div className="flex flex-col">
            <span className="font-sans font-bold text-[14px]">CodeStrate</span>
            <div className="flex items-center gap-2 font-mono text-[12px] text-[color:var(--color-ink-soft)]">
              {dateText && <span>{dateText}</span>}
              {dateText && <span>·</span>}
              <span>{readTime(rawBody)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Body + sidebar */}
      <div className="grid md:grid-cols-[1fr_240px] lg:grid-cols-[1fr_280px] gap-8 sm:gap-10 lg:gap-20 relative">
        <div ref={articleRef} className="min-w-0 max-w-[720px] mx-auto md:mx-0">
          <Prose>{content}</Prose>

          {/* Footer / share strip */}
          <div className="mt-20 pt-8 border-t border-[color:var(--color-ink)]">
            <Link to="/blog" className="font-mono text-[12px] uppercase tracking-wider text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)]">
              ← Back to blog
            </Link>
          </div>
        </div>

        {headings.length > 0 && (
          <aside className="hidden md:block">
            <div className="sticky top-32">
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[color:var(--color-ink-faint)] mb-4 pb-2 border-b border-[color:var(--color-rule)]">
                In this article
              </div>
              <nav className="flex flex-col gap-1">
                {headings.map((h, i) => {
                  const id = slugify(h)
                  const isActive = activeHeading === id
                  return (
                    <a
                      key={i}
                      href={`#${id}`}
                      className={[
                        'py-1.5 pl-3 border-l-2 font-sans text-[13px] leading-snug transition-colors',
                        isActive
                          ? 'border-[color:var(--color-ink)] text-[color:var(--color-ink)] font-semibold'
                          : 'border-transparent text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)] hover:border-[color:var(--color-ink-faint)]',
                      ].join(' ')}
                    >
                      {h}
                    </a>
                  )
                })}
              </nav>
            </div>
          </aside>
        )}
      </div>
    </article>
  )
}

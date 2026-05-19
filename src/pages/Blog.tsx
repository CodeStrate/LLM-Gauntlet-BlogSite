import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { docsByType, docs, type Doc } from '../lib/content'

type Section = 'all' | 'episodes' | 'deliberations' | 'methodology' | 'agentic'

const SECTIONS: Array<{ id: Section; label: string; blurb: string }> = [
  { id: 'all', label: 'Latest', blurb: 'Everything, newest first' },
  { id: 'episodes', label: 'Episodes', blurb: 'The narrative recaps' },
  { id: 'deliberations', label: 'Deliberations', blurb: 'Day-by-day judging logs' },
  { id: 'methodology', label: 'Methodology', blurb: 'How the gauntlet works' },
]

const STORAGE_FEATURED = 'gauntlet:featuredSlug'
const DEFAULT_FEATURED_SLUG = 'agentic-6-phase2-the-reranking-reckoning'

function getFeaturedFromStorage(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_FEATURED)
}

function resolveFeaturedDoc(storedSlug: string | null, episodes: Doc[]): Doc | undefined {
  if (storedSlug) {
    const doc = docs.find(d => d.slug === storedSlug)
    if (doc) return doc
  }
  return docs.find(d => d.slug === DEFAULT_FEATURED_SLUG) ?? episodes[0]
}

function formatSnappyTitle(title: string, doc: Doc): string {
  let s = title.replace(/^LLM Arena V2\.\d+:\s*/i, '')
  s = s.replace(/^Deliberation[:\s—]*/i, '')

  if (s.toLowerCase() === 'interlude' && doc.slug.includes('sushi')) return 'Interlude 1: Sushi Coder'
  if (doc.type === 'episode' && doc.episodeNumber) {
    if (doc.episodeNumber >= 100) {
      const intNum = doc.episodeNumber - 100
      if (!s.toLowerCase().includes('interlude')) s = `Interlude ${intNum}: ${s}`
    } else {
      if (!s.toLowerCase().includes('episode')) s = `Episode ${doc.episodeNumber}: ${s}`
    }
  }

  if (s.toLowerCase().includes('sushi retry, gemma thinking retry')) return 'Sushi & Gemma Redemptions'
  if (s.toLowerCase().includes('tuned runs, agentic redemptions')) return 'Tuned Runs & Serialization Trap'
  if (s.toLowerCase().includes('benchmark extraction, scoring cleanup')) return 'Scoring Cleanup & OSS High Review'
  if (s.toLowerCase().includes('codestral retired, gemma approved')) return 'Codestral Retired, Gemma Approved'
  if (s.toLowerCase().includes('oss high - track b retest')) return 'OSS High: Track B Retest'
  if (s.toLowerCase().includes('prompt design, track splits')) return 'Prompt Design & Track Splits'
  if (s.toLowerCase().includes('methodology & model judgement')) return 'Methodology & Judgement Alg'
  if (s === '9.4.26') return 'April 9, 2026'

  return s
}

function cleanExcerpt(excerpt: string) {
  return excerpt.replace(/\*\*/g, '').replace(/\[\[(.*?)\]\]/g, '$1')
}

function readTime(excerpt: string | undefined): string {
  const len = excerpt?.length ?? 0
  if (len < 80) return '4 min read'
  if (len < 200) return '6 min read'
  return '9 min read'
}

function routeForDoc(doc: Doc): string {
  if (doc.type === 'episode') return `/blog/${doc.slug}`
  if (doc.type === 'deliberation' || doc.type === 'retest') return `/deliberations/${doc.slug}`
  return `/docs/${doc.slug}`
}

function eyebrowTags(doc: Doc): string[] {
  if (doc.agenticTag) {
    const contentTag = doc.agenticTag === 'episode' ? 'EPISODE' : doc.agenticTag === 'deliberation' ? 'DELIBERATION' : 'REPORT'
    return ['AGENTIC', contentTag]
  }
  if (doc.type === 'episode') return [doc.episodeNumber != null ? `EPISODE ${doc.episodeNumber}` : 'INTERLUDE']
  if (doc.type === 'deliberation' || doc.type === 'retest') return ['DELIBERATION']
  return [doc.type.toUpperCase()]
}

export function Blog() {
  const location = useLocation()
  const initial = (location.hash.replace('#', '') as Section) || 'all'
  const [section, setSection] = useState<Section>(
    SECTIONS.some(s => s.id === initial) ? initial : 'all',
  )

  useEffect(() => {
    const hash = location.hash.replace('#', '') as Section
    if (SECTIONS.some(s => s.id === hash)) setSection(hash)
  }, [location.hash])

  const episodes = useMemo(
    () => docsByType('episode').sort((a, b) => {
      const dA = a.date ? new Date(a.date).getTime() : 0
      const dB = b.date ? new Date(b.date).getTime() : 0
      return dB - dA
    }),
    [],
  )
  const deliberations = useMemo(() => docsByType('deliberation').sort((a, b) => {
      const dA = a.date ? new Date(a.date).getTime() : 0
      const dB = b.date ? new Date(b.date).getTime() : 0
      return dB - dA
    }), [])
  const methodology = useMemo(
    () => [...docsByType('methodology'), ...docsByType('rubric'), ...docsByType('plan'), ...docsByType('gauntlet')].sort((a, b) => {
      const dA = a.date ? new Date(a.date).getTime() : 0
      const dB = b.date ? new Date(b.date).getTime() : 0
      return dB - dA
    }),
    [],
  )

  const [agenticExpanded, setAgenticExpanded] = useState(false)
  const [agenticTagFilter, setAgenticTagFilter] = useState<'all' | 'episode' | 'deliberation' | 'report'>('all')

  const agenticDocs = useMemo(
    () => docsByType('agentic').sort((a, b) => {
      const dA = a.date ? new Date(a.date).getTime() : 0
      const dB = b.date ? new Date(b.date).getTime() : 0
      return dB - dA
    }),
    [],
  )

  const [featuredSlug, setFeaturedSlug] = useState<string | null>(() => getFeaturedFromStorage())
  const featured = useMemo(() => resolveFeaturedDoc(featuredSlug, episodes), [featuredSlug, episodes])

  // Listen for storage changes (from /dev) and window focus to pick up changes
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_FEATURED) setFeaturedSlug(e.newValue)
    }
    const onFocus = () => setFeaturedSlug(getFeaturedFromStorage())
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    
    let channel: BroadcastChannel | null = null
    try {
      channel = new BroadcastChannel('gauntlet:featured')
      channel.onmessage = (e) => setFeaturedSlug(e.data)
    } catch {}
    
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
      channel?.close()
    }
  }, [])

  const visible = useMemo(() => {
    let list: Doc[] = []
    if (section === 'episodes') list = episodes
    else if (section === 'deliberations') list = deliberations
    else if (section === 'methodology') list = methodology
    else if (section === 'agentic') {
      list = agenticTagFilter === 'all'
        ? agenticDocs
        : agenticDocs.filter(d => d.agenticTag === agenticTagFilter)
    }
    else list = [...deliberations, ...episodes, ...methodology]
    
    // Hide the featured post from the list to avoid duplication
    if (featured) {
      list = list.filter(d => d.slug !== featured.slug)
    }
    
    // Sort all selected items strictly newest first
    return list.sort((a, b) => {
      const dA = a.date ? new Date(a.date).getTime() : 0
      const dB = b.date ? new Date(b.date).getTime() : 0
      return dB - dA
    })
  }, [section, episodes, deliberations, methodology, featured, agenticTagFilter, agenticDocs])

  const showFeatured = !!featured

  return (
    <div className="max-w-[1280px] mx-auto px-[clamp(16px,4vw,72px)] py-10 sm:py-14 lg:py-16">
      {/* Page header — consistent rhythm with the rest of the page */}
      <header className="pb-10 sm:pb-12 mb-10 sm:mb-14 lg:mb-16 border-b border-[color:var(--color-rule)]">
        <div className="inline-flex items-center font-mono text-[12px] tracking-[0.16em] uppercase border border-[color:var(--color-ink)] rounded-sm px-2.5 py-1 mb-6">
          The Blog
        </div>
        <h1 className="font-sans text-[clamp(36px,5.5vw,68px)] font-bold leading-[1.05] tracking-tight max-w-4xl">
          Field reports from the gauntlet.
        </h1>
        <p className="mt-5 font-sans text-[16px] sm:text-[17px] text-[color:var(--color-ink-soft)] max-w-2xl leading-relaxed">
          Episodes, deliberations, and methodology notes from April of testing open-source coding models against
          backend tasks that actually break things.
        </p>
      </header>

      {/* Featured */}
      {showFeatured && <FeaturedArticle doc={featured} />}

      <div className="grid lg:grid-cols-[220px_1fr] gap-10 sm:gap-12 lg:gap-16">
        {/* Sidebar nav */}
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[color:var(--color-ink-faint)] mb-4">
            Browse
          </div>
          <nav aria-label="Blog sections" className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
            {SECTIONS.map(s => {
              const isActive = section === s.id
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { setSection(s.id); setAgenticExpanded(false) }}
                  className={[
                    'group w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors',
                    isActive
                      ? 'bg-[color:var(--color-rule-soft)]'
                      : 'hover:bg-[color:var(--color-rule-soft)]/60',
                  ].join(' ')}
                >
                  <span className={[
                    'inline-block w-[3px] h-8 rounded-sm transition-colors shrink-0',
                    isActive ? 'bg-[color:var(--color-ink)]' : 'bg-transparent group-hover:bg-[color:var(--color-ink-faint)]',
                  ].join(' ')} />
                  <span className="flex-1 leading-[1.15]">
                    <span className={[
                      'block font-sans text-[15px]',
                      isActive ? 'font-bold text-[color:var(--color-ink)]' : 'font-semibold text-[color:var(--color-ink)]',
                    ].join(' ')}>{s.label}</span>
                    <span className="block font-sans text-[12px] text-[color:var(--color-ink-soft)] mt-0.5">
                      {s.blurb}
                    </span>
                  </span>
                </button>
              )
            })}

            {/* Agentic collapsible */}
            <div>
              <button
                type="button"
                onClick={() => setAgenticExpanded(!agenticExpanded)}
                className={[
                  'group w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors',
                  section === 'agentic'
                    ? 'bg-[color:var(--color-rule-soft)]'
                    : 'hover:bg-[color:var(--color-rule-soft)]/60',
                ].join(' ')}
              >
                <span className={[
                  'inline-block w-[3px] h-8 rounded-sm transition-colors shrink-0',
                  section === 'agentic' ? 'bg-[color:var(--color-ink)]' : 'bg-transparent group-hover:bg-[color:var(--color-ink-faint)]',
                ].join(' ')} />
                <span className="flex-1 leading-[1.15]">
                  <span className={[
                    'block font-sans text-[15px]',
                    section === 'agentic' ? 'font-bold text-[color:var(--color-ink)]' : 'font-semibold text-[color:var(--color-ink)]',
                  ].join(' ')}>Agentic</span>
                  <span className="block font-sans text-[12px] text-[color:var(--color-ink-soft)] mt-0.5">
                    Agentic eval content
                  </span>
                </span>
              </button>

              {agenticExpanded && (
                <div className="mt-1 flex flex-col gap-0.5">
                  {(['all', 'episode', 'deliberation', 'report'] as const).map(sub => {
                    const isActive = section === 'agentic' && agenticTagFilter === sub
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => { setSection('agentic'); setAgenticTagFilter(sub); setAgenticExpanded(true) }}
                        className={[
                          'group w-full text-left flex items-center gap-3 pl-8 pr-3 py-1.5 rounded-md transition-colors',
                          isActive
                            ? 'bg-[color:var(--color-rule-soft)]'
                            : 'hover:bg-[color:var(--color-rule-soft)]/60',
                        ].join(' ')}
                      >
                        <span className={[
                          'inline-block w-[3px] h-5 rounded-sm transition-colors shrink-0',
                          isActive ? 'bg-[color:var(--color-ink)]' : 'bg-transparent group-hover:bg-[color:var(--color-ink-faint)]',
                        ].join(' ')} />
                        <span className="font-sans text-[13px] font-medium text-[color:var(--color-ink)]">
                          {sub === 'all' ? 'All Agentic' : sub === 'episode' ? 'Episodes' : sub === 'deliberation' ? 'Deliberations' : 'Reports'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </nav>

          <div className="px-3">
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[color:var(--color-ink-faint)] mb-3">
              Counts
            </div>
            <ul className="font-sans text-[14px] text-[color:var(--color-ink-soft)] space-y-2">
              <li className="flex justify-between"><span>Episodes</span><span className="font-mono text-[color:var(--color-ink)]">{episodes.length}</span></li>
              <li className="flex justify-between"><span>Deliberations</span><span className="font-mono text-[color:var(--color-ink)]">{deliberations.length}</span></li>
              <li className="flex justify-between"><span>Agentic</span><span className="font-mono text-[color:var(--color-ink)]">{agenticDocs.length}</span></li>
              <li className="flex justify-between"><span>Methodology</span><span className="font-mono text-[color:var(--color-ink)]">{methodology.length}</span></li>
            </ul>
          </div>
        </aside>

        {/* Article list — continuous list (border-t between rows, no gap) */}
        <div className="min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 mb-6 sm:mb-8">
            <h2 className="font-sans text-[28px] sm:text-[32px] font-bold tracking-tight">
              {section === 'agentic'
                ? agenticTagFilter === 'all' ? 'Agentic' : `Agentic ${agenticTagFilter === 'episode' ? 'Episodes' : agenticTagFilter === 'deliberation' ? 'Deliberations' : 'Reports'}`
                : SECTIONS.find(s => s.id === section)?.label}
            </h2>
            <span className="font-mono text-[12px] uppercase tracking-wider text-[color:var(--color-ink-faint)]">
              {visible.length} {visible.length === 1 ? 'post' : 'posts'}
            </span>
          </div>

          <div className="flex flex-col gap-10 sm:gap-14 pt-8 sm:pt-10 border-t border-[color:var(--color-rule)]">
            {visible.map((doc, i) => (
              <ArticleRow key={doc.slug} doc={doc} index={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function FeaturedArticle({ doc }: { doc: Doc }) {
  return (
    <motion.section
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="mb-12 sm:mb-16 lg:mb-20 border border-[color:var(--color-ink)] rounded-2xl bg-[color:var(--color-surface)] overflow-hidden"
    >
      <Link to={routeForDoc(doc)} className="grid md:grid-cols-[1fr_1.4fr]">
        <div className="bg-gradient-to-br from-[color:var(--color-hero-blue)] via-[color:var(--color-hero-violet)] to-[color:var(--color-hero-rose)] p-8 sm:p-12 flex flex-col justify-end min-h-[260px] sm:min-h-[320px]">
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--color-ink)]/70 mb-3">
            Featured
          </div>
          <div className="font-headline text-[clamp(56px,8vw,112px)] leading-[0.9] uppercase text-[color:var(--color-ink)] tracking-tight">
            Episode<br />{doc.episodeNumber ?? '·'}
          </div>
        </div>
        <div className="p-8 sm:p-10 md:p-14 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            {eyebrowTags(doc).map(tag => (
              <span key={tag} className="font-mono text-[11px] uppercase tracking-[0.14em] border border-[color:var(--color-ink)] rounded px-2 py-1">
                {tag}
              </span>
            ))}
            <span className="font-mono text-[12px] text-[color:var(--color-ink-faint)]">{readTime(doc.excerpt)}</span>
          </div>
          <h2 className="font-sans text-[clamp(28px,3vw,42px)] font-bold leading-[1.15] tracking-tight mb-5">
            {formatSnappyTitle(doc.title, doc)}
          </h2>
          {doc.excerpt && (
            <p className="font-sans text-[16px] leading-relaxed text-[color:var(--color-ink-soft)] line-clamp-3 mb-8">
              {cleanExcerpt(doc.excerpt)}
            </p>
          )}
          <span className="font-mono text-[12px] uppercase tracking-wider text-[color:var(--color-ink)] border-b border-[color:var(--color-ink)] pb-1 self-start">
            Read the full episode →
          </span>
        </div>
      </Link>
    </motion.section>
  )
}

function ArticleRow({ doc, index }: { doc: Doc; index: number }) {
  const dateText = doc.date
    ? new Date(doc.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : ''

  return (
    <motion.div
      initial={{ y: 8, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}
    >
      <Link
        to={routeForDoc(doc)}
        className="group block py-8 sm:py-10 border-b border-[color:var(--color-rule)]"
      >
        <div className="flex items-center gap-2 mb-3 flex-wrap font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-[color:var(--color-ink-faint)]">
          {eyebrowTags(doc).map(tag => (
            <span key={tag} className="border border-[color:var(--color-ink-soft)] text-[color:var(--color-ink-soft)] rounded-sm px-2 py-0.5">
              {tag}
            </span>
          ))}
          {dateText && <span>{dateText}</span>}
          <span aria-hidden="true" className="opacity-50">·</span>
          <span>{readTime(doc.excerpt)}</span>
        </div>
        <h3 className="font-sans text-[22px] sm:text-[26px] md:text-[30px] font-bold leading-[1.2] tracking-tight text-[color:var(--color-ink)] group-hover:underline decoration-2 underline-offset-[6px]">
          {formatSnappyTitle(doc.title, doc)}
        </h3>
        {doc.excerpt && (
          <p className="mt-3 font-sans text-[15.5px] leading-relaxed text-[color:var(--color-ink-soft)] line-clamp-2 max-w-3xl">
            {cleanExcerpt(doc.excerpt)}
          </p>
        )}
      </Link>
    </motion.div>
  )
}

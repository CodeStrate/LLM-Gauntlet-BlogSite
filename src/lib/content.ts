/**
 * Content access layer — bridges the build-time vault snapshot to the runtime React app.
 *
 * `manifest.json` is the index. Raw MD files live in `src/content/vault/` and are
 * imported as `?raw` strings via Vite's eager glob.
 */
import manifest from '../content/manifest.json'

export type DocType =
  | 'episode'
  | 'deliberation'
  | 'rubric'
  | 'plan'
  | 'methodology'
  | 'gauntlet'
  | 'welcome'
  | 'retest'
  | 'agentic'

export type Doc = {
  slug: string
  wikiKey: string  // basename without extension — the literal `[[…]]` target
  filename: string
  title: string
  type: DocType
  date?: string
  episodeNumber?: number
  excerpt: string
  hasFrontmatterDesc?: boolean
  agenticTag?: 'episode' | 'deliberation' | 'report'
}

export const docs: Doc[] = manifest as Doc[]

// Eager glob — small enough payload for the whole site.
const rawByFilename = import.meta.glob('../content/vault/**/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

const fileMap = Object.fromEntries(
  Object.entries(rawByFilename).map(([path, body]) => {
    const filename = path.split('/content/vault/').pop() ?? path.split('/').pop() ?? ''
    return [filename, body]
  }),
)

export function getDoc(slug: string): Doc | undefined {
  return docs.find(d => d.slug === slug)
}

export function getDocBody(filename: string): string | undefined {
  return fileMap[filename] ?? fileMap[filename.split('/').pop() ?? filename]
}

export function docsByType(type: DocType): Doc[] {
  return docs.filter(d => d.type === type)
}

/** Recent items for the homepage — episodes first, then newest deliberations. */
export function recentDocs(limit = 6): Doc[] {
  const allDocs = [...docsByType('episode'), ...docsByType('deliberation'), ...docsByType('methodology')]
  return allDocs
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0
      const dateB = b.date ? new Date(b.date).getTime() : 0
      return dateB - dateA
    })
    .slice(0, limit)
}

// ---------------------------------------------------------------------------
// Wikilink resolution — for `[[Note Name]]` references inside vault MDs
// ---------------------------------------------------------------------------

/** All known wikilink targets (case-insensitive lookup; preserve display case). */
export const wikiPermalinks: string[] = docs.map(d => d.wikiKey)

/** Map a wikilink target → app route. Returns undefined for unknown targets. */
export function routeForWikiKey(key: string): string | undefined {
  // Obsidian wikilinks are case-insensitive in practice
  const target = key.trim()
  const doc =
    docs.find(d => d.wikiKey === target) ??
    docs.find(d => d.wikiKey.toLowerCase() === target.toLowerCase())
  return doc ? routeForDoc(doc) : undefined
}

export function routeForDoc(doc: Doc): string {
  switch (doc.type) {
    case 'episode': return `/blog/${doc.slug}`
    case 'deliberation': return `/deliberations/${doc.slug}`
    case 'agentic': return `/docs/${doc.slug}`
    case 'rubric': return `/rubrics`
    case 'retest': return `/deliberations/${doc.slug}`
    case 'welcome': return `/`
    default: return `/docs/${doc.slug}`
  }
}

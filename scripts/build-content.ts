/**
 * build-content.ts — copies vault MDs into src/content/vault/ and emits a manifest.
 *
 * Vault is the single source of truth. This script is the only bridge.
 * Run manually: `bun run content` (or `bun run scripts/build-content.ts`).
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, existsSync, statSync } from 'node:fs'
import { dirname, join, basename, relative } from 'node:path'
import matter from 'gray-matter'
import { config as dotenvConfig } from 'dotenv'

dotenvConfig({ path: '.env.local' })
dotenvConfig()

const IGNORED_DIRS = ['plans', 'Stock Dump', 'Track A Chat Dumps', 'Track B Chat Dumps', 'REAP Chat Dumps']

function walkMarkdown(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    if (IGNORED_DIRS.includes(entry)) continue
    
    const full = join(dir, entry)
    const s = statSync(full)
    if (s.isDirectory()) out.push(...walkMarkdown(full))
    else if (s.isFile() && entry.endsWith('.md')) out.push(full)
  }
  return out
}

const VAULT_ROOT = process.env.VAULT_ROOT ?? ''
const OUT_DIR = join(process.cwd(), 'src/content/vault')
const MANIFEST_PATH = join(process.cwd(), 'src/content/manifest.json')

type DocType = 'episode' | 'deliberation' | 'rubric' | 'plan' | 'methodology' | 'gauntlet' | 'welcome' | 'retest' | 'agentic' | 'other'

type Doc = {
  slug: string
  wikiKey: string
  filename: string
  title: string
  type: DocType
  date?: string
  episodeNumber?: number
  excerpt: string
  hasFrontmatterDesc?: boolean
  agenticTag?: 'episode' | 'deliberation' | 'report'
}

function classify(filename: string, relPath: string): DocType {
  const f = filename.toLowerCase()
  const dir = relPath.toLowerCase()
  if (dir.includes('agentic episodes') || dir.includes('agentic deliberations') || dir.includes('agentic reports')) return 'agentic'
  if (dir.includes('episode') || f.startsWith('episode-') || f.startsWith('interlude-')) return 'episode'
  if (dir.includes('deliberation') || f.startsWith('deliberation-')) return 'deliberation'
  if (f === 'eval_rubric.md') return 'rubric'
  if (f === 'april-plan.md') return 'other'
  if (f === 'v2.1-gauntlet-methodology.md') return 'methodology'
  if (f === 'champion-gauntlet-plan.md') return 'gauntlet'
  if (f === 'welcome.md') return 'welcome'
  if (f === 'scores.md' || f === 'stock-vs-tuned-comparison.md') return 'methodology'
  if (f.includes('retest')) return 'retest'
  if (f.includes('champion') || f.includes('gauntlet')) return 'gauntlet'
  return 'other'
}

function dateFromFilename(filename: string): string | undefined {
  const m = filename.match(/(\d{1,2})\.(\d{1,2})\.(\d{2})/)
  if (!m) return
  const [, day, month, yy] = m
  const year = 2000 + parseInt(yy, 10)
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

function getDefaultDate(type: DocType, episodeNumber?: number, title?: string): string | undefined {
  if (type === 'episode' && episodeNumber !== undefined) {
    // Interludes (100+)
    if (episodeNumber === 101) return '2026-04-28T00:00:00.000Z' // Sushi coder
    if (episodeNumber === 102) return '2026-05-01T00:00:00.000Z' // Sampling illusion
    
    // Episodes
    if (episodeNumber === 1) return '2026-04-09T00:00:00.000Z'
    if (episodeNumber === 2) return '2026-04-11T00:00:00.000Z'
    if (episodeNumber === 3) return '2026-05-02T00:00:00.000Z' // Matches REAP Deep Dive
    if (episodeNumber === 4) return '2026-05-03T00:00:00.000Z' // Follows episode 3
    if (episodeNumber === 6) return '2026-05-05T00:00:00.000Z'
    if (episodeNumber === 7) return '2026-05-06T00:00:00.000Z'
    if (episodeNumber === 8) return '2026-05-07T00:00:00.000Z'
  }
  
  if (type === 'rubric' || type === 'welcome') return '2026-04-01T00:00:00.000Z'
  if (type === 'gauntlet') return '2026-05-01T00:00:00.000Z'
  if (type === 'methodology') {
    if (title && title.includes('Scores')) return '2026-04-27T00:00:00.000Z'
    return '2026-04-15T00:00:00.000Z'
  }
  
  return undefined
}

function episodeNumber(filename: string): number | undefined {
  const m = filename.match(/^episode-(\d+)/i)
  if (m) return parseInt(m[1], 10)
  
  const im = filename.match(/^interlude-(\d+)/i)
  if (im) return parseInt(im[1], 10) + 100
  return undefined
}

function slugify(filename: string): string {
  return basename(filename, '.md').toLowerCase().replace(/[^a-z0-9.-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

function extractTitle(body: string, fallback: string): string {
  const m = body.match(/^#\s+(.+)$/m)
  return m ? m[1].trim() : fallback
}

function extractExcerpt(body: string): string {
  const lines = body.split('\n')
  let i = 0
  while (i < lines.length && !/^[a-z0-9_*-]/i.test(lines[i])) i++
  while (i < lines.length && lines[i].startsWith('>')) i++
  while (i < lines.length && lines[i].trim() === '') i++
  while (i < lines.length && /^---+$/.test(lines[i].trim())) i++
  while (i < lines.length && lines[i].trim() === '') i++
  // Skip screenplay scene markers, speaker labels, and stage directions
  const SKIP_LINE = /^\*\*\[SCENE (?:START|END)\]\*\*$|^\*\*[A-Z][A-Z0-9 .'&\-]+(?:\s*\([^)]+\))?:\*\*$|^\*\([^)]/
  while (i < lines.length && (lines[i].trim() === '' || SKIP_LINE.test(lines[i].trim()))) i++
  const para: string[] = []
  while (i < lines.length) {
    const l = lines[i]
    if (l.trim() === '') break
    if (/^#{1,6}\s/.test(l)) { i++; continue }
    // Stop at next speaker label or scene marker
    if (SKIP_LINE.test(l.trim())) break
    para.push(l)
    i++
  }
  const txt = para.join(' ').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim()
  return txt.length > 280 ? txt.slice(0, 277) + '…' : txt
}

function formatForWeb(content: string, _filename: string): string {
  let s = content
  
  // Convert Obsidian wikilinks to plain text (remark-wiki-link handles [[links]] at render time,
  // but non-wikilink [[text]] in tables/post-credits needs resolving at build time too)
  s = s.replace(/\[\[(.*?)\]\]/g, '$1')

  // Fix double colons
  s = s.replace(/:\s{2,}/g, ': ')
  
  // Ensure blank line before lists (critical for MD rendering)
  s = s.replace(/([^\n])\n(\*   |\d+\. )/g, '$1\n\n$2')
  
  // Fix list continuation (sub-items should have blank line before)
  s = s.replace(/(\*   [^\n]+)\n(\*   )/g, '$1\n$2')
  
  // Ensure headers have blank line before
  s = s.replace(/([^\n])\n## /g, '$1\n\n## ')
  s = s.replace(/([^\n])\n### /g, '$1\n\n### ')
  
  // Fix orphan list items after paragraphs without blank line
  s = s.replace(/(\.[^\n]*)\n(\*   |\d+\. )/g, '$1\n\n$2')
  
  return s
}

const OVERWRITE = process.argv.includes('--overwrite')

function main() {
  if (!OVERWRITE && existsSync(OUT_DIR)) {
    console.log('[build-content] Skipping - content exists. Use --overwrite to rebuild.')
    return
  }

  if (OVERWRITE) {
    rmSync(OUT_DIR, { recursive: true, force: true })
  }
  mkdirSync(OUT_DIR, { recursive: true })

  if (!VAULT_ROOT) {
    console.error('[build-content] VAULT_ROOT env var not set. Skipping.')
    return
  }
  if (!existsSync(VAULT_ROOT)) {
    console.error(`[build-content] Vault not found at ${VAULT_ROOT}. Skipping.`)
    return
  }

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })

  const files = walkMarkdown(VAULT_ROOT)
  const docs: Doc[] = []

  for (const fullPath of files) {
    const filename = basename(fullPath)
    const relPath = relative(VAULT_ROOT, fullPath)

    const raw = readFileSync(fullPath, 'utf8')
    const type = classify(filename, relPath)
    if (type === 'other') continue
    
    let formatted = raw;
    if (type === 'episode') {
      formatted = formatForWeb(raw, filename);
    }

    const dst = join(OUT_DIR, relPath)
    if (existsSync(dst)) continue // preserve existing built content
    mkdirSync(dirname(dst), { recursive: true })
    writeFileSync(dst, formatted, 'utf8')

    const { data: frontmatter, content: body } = matter(formatted)

    const slug = slugify(filename)
    const wikiKey = basename(filename, '.md')

    let baseExcerpt = (frontmatter.description as string) || extractExcerpt(body)
    baseExcerpt = baseExcerpt.replace(/\*\*/g, '')

    let finalDate = (frontmatter.date as string) || dateFromFilename(filename)
    const derivedTitle = (frontmatter.title as string) || extractTitle(body, wikiKey)
    if (!finalDate) {
      finalDate = getDefaultDate(type, (frontmatter.episode as number) || episodeNumber(filename), derivedTitle)
    }

    let agenticTag: 'episode' | 'deliberation' | 'report' | undefined
    if (type === 'agentic') {
      const lc = relPath.toLowerCase()
      if (lc.includes('agentic episodes')) agenticTag = 'episode'
      else if (lc.includes('agentic deliberations')) agenticTag = 'deliberation'
      else agenticTag = 'report'
    }

    docs.push({
      slug,
      wikiKey,
      filename: relPath,
      title: derivedTitle,
      type,
      date: finalDate,
      episodeNumber: (frontmatter.episode as number) || episodeNumber(filename),
      excerpt: baseExcerpt,
      hasFrontmatterDesc: !!frontmatter.description,
      agenticTag,
    })
  }

  docs.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0
    const dateB = b.date ? new Date(b.date).getTime() : 0
    if (dateA !== dateB) return dateB - dateA // descending (newest first)
    if (a.type === 'episode' && b.type === 'episode') return (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0)
    if (a.type !== b.type) return a.type.localeCompare(b.type)
    return a.title.localeCompare(b.title)
  })

  mkdirSync(join(process.cwd(), 'src/content'), { recursive: true })
  writeFileSync(MANIFEST_PATH, JSON.stringify(docs, null, 2))
  console.log(`[build-content] Processed ${files.length} files, indexed ${docs.length} docs to ${MANIFEST_PATH}`)
}

main()

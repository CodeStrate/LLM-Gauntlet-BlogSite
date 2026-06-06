import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { TASK_IDS, taskShortLabel, models, findScore, type Model, type TaskId } from '../lib/models'
import { CHAMPION_ROWS, AGENTIC_V2_SCORES } from '../lib/leaderboards'
import { BrandIcon } from '../components/BrandIcon'
import { ChampionsTable } from '../components/leaderboard/ChampionsTable'
import { AgenticTable } from '../components/leaderboard/AgenticTable'
import { StockTable } from '../components/leaderboard/StockTable'

// ---------------------------------------------------------------------------
// Tab types
// ---------------------------------------------------------------------------
type Tab = 'stock' | 'reap' | 'tuned' | 'champions' | 'agentic'

const TABS: { id: Tab; label: string; blurb: string }[] = [
  { id: 'stock',     label: 'Stock',              blurb: 'V2.0 · Default LM Studio parameters — historical baseline' },
  { id: 'reap',      label: 'REAP',               blurb: 'V2.1 Model Card · Expert-pruned MoE evaluation — author-recommended parameters' },
  { id: 'tuned',     label: 'Tuned',              blurb: 'V2.1 Track A/B · Prompted evaluation — strict or reasoning-mode configs' },
  { id: 'champions', label: "Champion's Gauntlet", blurb: 'Track C · T8 (Circuit Breaker) + T9 (DI Container) · Qualifier gate ≥ 7.5 avg' },
  { id: 'agentic',   label: 'Agentic V2',         blurb: 'RAG benchmark · LangChain + Ollama + Chroma · Phase 1 + Phase 2 bonus' },
]

// ---------------------------------------------------------------------------
// Sorting helpers (for REAP / Tuned tables)
// ---------------------------------------------------------------------------
type SortKey = 'rank' | 'name' | 'avg' | TaskId
type SortDir = 'asc' | 'desc'

function sortModels(list: Model[], key: SortKey, dir: SortDir): Model[] {
  const mul = dir === 'asc' ? 1 : -1
  return [...list].sort((a, b) => {
    if (key === 'name') return a.name.localeCompare(b.name) * mul
    if (key === 'avg' || key === 'rank') {
      const av = a.averageScore ?? -1
      const bv = b.averageScore ?? -1
      if (av !== bv) return (av - bv) * mul
      return a.name.localeCompare(b.name)
    }
    const av = scoreSortValue(findScore(a, key))
    const bv = scoreSortValue(findScore(b, key))
    if (av !== bv) return (av - bv) * mul
    return a.name.localeCompare(b.name)
  })
}

function scoreSortValue(s: ReturnType<typeof findScore>): number {
  if (!s) return -2
  if (s.dnf) return -1
  return s.final ?? s.raw ?? 0
}

// ---------------------------------------------------------------------------
// Main Leaderboard page
// ---------------------------------------------------------------------------
export function Leaderboard() {
  const [tab, setTab] = useState<Tab>('stock')
  const [sortKey, setSortKey] = useState<SortKey>('avg')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const reapModels = useMemo(
    () => sortModels(
      models.filter(m => m.reap),
      sortKey, sortDir,
    ),
    [sortKey, sortDir],
  )

  const tunedModels = useMemo(
    () => sortModels(
      models.filter(m => !m.reap && m.status !== 'retired' && m.status !== 'bench'),
      sortKey, sortDir,
    ),
    [sortKey, sortDir],
  )

  const onSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir(key === 'name' ? 'asc' : 'desc') }
  }

  const tabBlurb = TABS.find(t => t.id === tab)?.blurb ?? ''

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 mb-10">
        <div className="inline-flex items-center font-mono text-sm font-semibold tracking-wide border border-[color:var(--color-ink)] rounded px-3 py-2">
          LEADERBOARD
        </div>
        <div className="font-mono text-xs text-[color:var(--color-ink-faint)]">
          {tab === 'stock' && `10 models · V2.0 baseline`}
          {tab === 'reap' && `${reapModels.length} models · 7 tasks · click column to sort`}
          {tab === 'tuned' && `${tunedModels.length} models · 7 tasks · click column to sort`}
          {tab === 'champions' && `${CHAMPION_ROWS.length} contenders · T8 + T9`}
          {tab === 'agentic' && `${AGENTIC_V2_SCORES.length} models · Phase 1 + Phase 2`}
        </div>
      </div>

      <h1 className="font-mono font-bold uppercase tracking-[0.04em] text-center text-[clamp(36px,5vw,72px)] leading-none mb-10">
        {tab === 'stock' && 'Stock Leaderboard'}
        {tab === 'reap' && 'REAP Leaderboard'}
        {tab === 'tuned' && 'Tuned Leaderboard'}
        {tab === 'champions' && "Champion's Gauntlet"}
        {tab === 'agentic' && 'Agentic V2'}
      </h1>

      {/* Tab bar — rounded chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              border: '1.5px solid var(--color-ink)',
              background: tab === t.id ? 'var(--color-ink)' : 'transparent',
              color: tab === t.id ? 'var(--color-bg)' : 'var(--color-ink-soft)',
              padding: '7px 20px',
            }}
            className="font-mono text-xs font-semibold tracking-wide rounded-full transition-colors hover:opacity-80"
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="font-mono text-xs text-[color:var(--color-ink-faint)] mb-8 mt-1">{tabBlurb}</p>

      {tab === 'stock' && <StockTable />}
      {tab === 'reap' && (
        <ModelTable models={reapModels} sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
      )}
      {tab === 'tuned' && (
        <ModelTable models={tunedModels} sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
      )}
      {tab === 'champions' && <ChampionsTable />}
      {tab === 'agentic' && <AgenticTable />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Model table (shared for REAP + Tuned)
// ---------------------------------------------------------------------------
function ModelTable({ models: list, sortKey, sortDir, onSort }: {
  models: Model[]
  sortKey: SortKey
  sortDir: SortDir
  onSort: (k: SortKey) => void
}) {
  return (
    <div className="border-[1.5px] border-[color:var(--color-ink)] rounded-2xl bg-[color:var(--color-bg)] overflow-x-auto">
      <table className="w-full min-w-[980px]">
        <thead>
          <tr className="border-b border-[color:var(--color-ink)]">
            <Th label="Model" sortKey="name" current={sortKey} dir={sortDir} onSort={onSort} align="left" wide />
            <Th label="Avg" sortKey="avg" current={sortKey} dir={sortDir} onSort={onSort} align="right" />
            {TASK_IDS.map(id => (
              <Th key={id} label={taskShortLabel(id)} sublabel={id.toUpperCase()} sortKey={id}
                current={sortKey} dir={sortDir} onSort={onSort} align="right" />
            ))}
          </tr>
        </thead>
        <tbody>
          {list.map((model, i) => <ModelRow key={model.slug} model={model} rank={i + 1} />)}
        </tbody>
      </table>
    </div>
  )
}

function ModelRow({ model, rank }: { model: Model; rank: number }) {
  return (
    <tr className="border-b border-[color:var(--color-rule)] last:border-0 hover:bg-[color:var(--color-surface)] transition-colors group">
      <td className="py-4 px-4">
        <Link to={`/models/${model.slug}`} className="flex items-center gap-3 group-hover:opacity-80 transition-opacity">
          <span className="font-mono text-xs text-[color:var(--color-ink-faint)] w-5 shrink-0">#{rank}</span>
          <BrandIcon model={model} className="w-5 h-5" />
          <div className="flex flex-col">
            <span className="font-mono text-sm font-semibold text-[color:var(--color-ink)]">
              {model.name}
              {model.variant && (
                <span className="ml-2 text-[11px] font-normal text-[color:var(--color-ink-faint)]">{model.variant}</span>
              )}
            </span>
            <span className="font-mono text-[11px] text-[color:var(--color-ink-faint)]">{model.vendor}</span>
          </div>
          {model.badges?.map(b => (
            <span key={b} className="ml-1 font-mono text-[10px] uppercase tracking-wide border border-[color:var(--color-rule)] px-1.5 py-0.5 rounded text-[color:var(--color-ink-faint)]">
              {b}
            </span>
          ))}
        </Link>
      </td>
      <td className="py-4 px-4 text-right"><AverageCell model={model} /></td>
      {TASK_IDS.map(id => (
        <td key={id} className="py-4 px-4 text-right">
          <ScoreCell score={findScore(model, id)} />
        </td>
      ))}
    </tr>
  )
}

// ---------------------------------------------------------------------------
// Shared cells
// ---------------------------------------------------------------------------
function AverageCell({ model }: { model: Model }) {
  if (model.status === 'bench' || model.status === 'dnf') {
    return <span className="font-mono text-[11px] uppercase text-[color:var(--color-danger)]">DNF</span>
  }
  if (model.status === 'retired') {
    return <span className="font-mono text-[11px] uppercase text-[color:var(--color-ink-faint)]">retired</span>
  }
  if (model.averageScore === undefined) {
    return <span className="text-[color:var(--color-ink-faint)]">—</span>
  }
  return (
    <span className="flex flex-col items-end gap-0.5">
      <span className="font-mono text-[24px] font-bold leading-none tracking-[0.02em]">
        {model.averageScore.toFixed(1)}
      </span>
      {model.competitiveAverage !== undefined && (
        <span className="font-mono text-[11px] text-[color:var(--color-ink-faint)] leading-none">
          {model.competitiveAverage.toFixed(1)} comp
        </span>
      )}
    </span>
  )
}

function ScoreCell({ score }: { score: ReturnType<typeof findScore> }) {
  if (!score) return <span className="text-[color:var(--color-ink-faint)] text-sm">—</span>
  if (score.dnf) return <span className="font-mono text-xs text-[color:var(--color-danger)]">DNF</span>
  const value = score.final ?? score.raw ?? 0
  return (
    <span className="font-mono text-sm">
      <span className="font-semibold">{value}</span>
      {score.shots && score.shots > 1 && (
        <span className="ml-1 text-[10px] text-[color:var(--color-ink-faint)]">
          {score.shots === 2 ? '②' : '③'}
        </span>
      )}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Sort header
// ---------------------------------------------------------------------------
function Th({ label, sublabel, sortKey, current, dir, onSort, align, wide }: {
  label: string
  sublabel?: string
  sortKey: SortKey
  current: SortKey
  dir: SortDir
  onSort: (k: SortKey) => void
  align: 'left' | 'right'
  wide?: boolean
}) {
  const isActive = current === sortKey
  return (
    <th className={[
      'font-mono text-[11px] uppercase tracking-wider font-semibold py-4 px-4',
      align === 'left' ? 'text-left' : 'text-right',
      wide ? 'min-w-[260px]' : '',
    ].join(' ')}>
      <button
        onClick={() => onSort(sortKey)}
        className={[
          'inline-flex items-center gap-1.5 whitespace-nowrap',
          isActive ? 'text-[color:var(--color-ink)]' : 'text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)]',
        ].join(' ')}
      >
        <span className="flex flex-col items-end">
          <span>{label}</span>
          {sublabel && <span className="text-[9px] opacity-60">{sublabel}</span>}
        </span>
        {isActive && <Caret dir={dir} />}
      </button>
    </th>
  )
}

function Caret({ dir }: { dir: SortDir }) {
  return (
    <svg width="8" height="10" viewBox="0 0 8 10" fill="currentColor" className="opacity-70">
      {dir === 'desc'
        ? <path d="M4 10L0 4h8L4 10z" />
        : <path d="M4 0l4 6H0L4 0z" />}
    </svg>
  )
}

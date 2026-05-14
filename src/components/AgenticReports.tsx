import { useNavigate } from 'react-router-dom'
import { agentic } from '../lib/agentic'
import { AGENTIC_MODELS, hasAgenticChatLog, getAgenticChatLog, type AgenticChatLog } from '../lib/agenticChats'

const CHIP_TONE: Record<string, string> = {
  good: 'bg-[#1a3a2a] text-[#86e296] border-[#2a5a3a]',
  warn: 'bg-[#3a2a10] text-[#ffb347] border-[#5a4a20]',
  bad:  'bg-[#3a1a1a] text-[#ff8b8b] border-[#5a2a2a]',
}

const MODEL_TO_REPORT: Record<string, string> = {
  'gpt-oss-20b-medium':       'gpt-oss-20b',
  'gemma-4-e4b':              'gemma-4-e4b',
  'gemma-4-19b-reap':         'gemma-4-19b-reap',
  'glm-4-7-flash-23b-reap':   'glm-flash-4.7-reap',
  'cerebras-qwen3-25b-reap':  'qwen3-coder',
  'sushi-coder-9b':           'sushi-coder-rl-qwen-3.5-9b-opus-distill',
}

type Props = {
  agenticTheme: string
  themes: Record<string, Record<string, string>>
  isFullscreen: boolean
  onSelectModel: (idx: number) => void
  onViewSession: (log: AgenticChatLog, slug: string, name: string) => void
  onSwitchToSession: () => void
}

export function AgenticReports({
  agenticTheme,
  themes,
  isFullscreen,
  onSelectModel,
  onViewSession,
  onSwitchToSession,
}: Props) {
  const navigate = useNavigate()

  return (
    <div
      style={themes[agenticTheme] as React.CSSProperties}
      className={
        isFullscreen
          ? 'fixed inset-0 z-[100] bg-[var(--a-bg)] text-[var(--a-ink)] flex flex-col font-mono overflow-hidden'
          : 'relative bg-[var(--a-bg)] text-[var(--a-ink)] flex flex-col font-mono min-h-[calc(100svh-96px)]'
      }
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-[var(--a-rule)] shrink-0">
        <div className="flex items-center gap-0">
          <button
            onClick={onSwitchToSession}
            className="font-mono text-[11px] uppercase tracking-wide px-3 py-1.5 -mb-px border-b-2 border-transparent text-[var(--a-ink-faint)] hover:text-[var(--a-ink)] transition-colors"
          >
            Session
          </button>
          <span className="font-mono text-[11px] uppercase tracking-wide px-3 py-1.5 -mb-px border-b-2 border-[var(--a-accent)] text-[var(--a-ink)]">
            Reports
          </span>
        </div>
        <span className="font-mono text-[11px] text-[var(--a-ink-faint)] hidden sm:inline">
          {agentic.task}
        </span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-[1000px] mx-auto">
          {/* Intro */}
          <div className="mb-8 space-y-2">
            <p className="font-mono text-[13px] text-[var(--a-ink-soft)] leading-relaxed max-w-2xl">
              {agentic.intro}
            </p>
            {agentic.caveat && (
              <p className="font-mono text-[12px] text-[var(--a-ink-faint)] leading-relaxed max-w-2xl pl-3 border-l border-[var(--a-rule)]">
                {agentic.caveat}
              </p>
            )}
          </div>

          {/* Report card grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[1px] bg-[var(--a-rule)] border border-[var(--a-rule)]">
            {agentic.rows.map((row) => {
              const model = AGENTIC_MODELS.find(m => m.slug === row.modelSlug)
              const hasLog = hasAgenticChatLog(row.modelSlug)
              const reportSlug = MODEL_TO_REPORT[row.modelSlug]

              return (
                <div key={row.modelSlug} className="bg-[var(--a-surface)] p-5 flex flex-col gap-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded shrink-0 ${
                        row.rank === 'DNF' ? 'bg-[#3a1a1a] text-[#ff8b8b]'
                        : row.tone === 'good' ? 'bg-[#1a3a2a] text-[#86e296]'
                        : row.tone === 'warn' ? 'bg-[#3a2a10] text-[#ffb347]'
                        : 'bg-[#2a1a1a] text-[var(--a-ink-soft)]'
                      }`}>
                        {row.rank}
                      </span>
                      <div>
                        <div className="font-mono text-[13px] font-bold text-[var(--a-ink)]">
                          {model?.name ?? row.modelSlug}
                        </div>
                        <div className="font-mono text-[11px] text-[var(--a-ink-faint)]">
                          {model?.vendor}{model?.params ? ` · ${model.params}` : ''}
                        </div>
                      </div>
                    </div>
                    <p className="font-mono text-[12px] text-[var(--a-ink-soft)] italic text-right shrink-0 max-w-[140px] leading-snug">
                      {row.verdict}
                    </p>
                  </div>

                  {/* Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {row.chips.map((chip, i) => (
                      <span key={i} className={`font-mono text-[10px] px-2 py-0.5 rounded border ${CHIP_TONE[chip.tone]}`}>
                        {chip.text}
                      </span>
                    ))}
                  </div>

                  {/* Body */}
                  <p className="font-mono text-[12px] text-[var(--a-ink-soft)] leading-relaxed flex-1">
                    {row.body}
                  </p>

                  {/* Actions */}
                  {(hasLog || reportSlug) && (
                    <div className="flex items-center gap-4 pt-2 border-t border-[var(--a-rule)]">
                      {hasLog && (
                        <button
                          onClick={() => {
                            const idx = AGENTIC_MODELS.findIndex(m => m.slug === row.modelSlug)
                            if (idx >= 0) onSelectModel(idx)
                            const log = getAgenticChatLog(row.modelSlug)
                            if (log) onViewSession(log, row.modelSlug, model?.name ?? row.modelSlug)
                          }}
                          className="font-mono text-[11px] text-[var(--a-accent-blue)] hover:text-[var(--a-ink)] transition-colors"
                        >
                          ● View Session
                        </button>
                      )}
                      {reportSlug && (
                        <button
                          onClick={() => navigate(`/docs/${reportSlug}`)}
                          className="font-mono text-[11px] text-[var(--a-ink-faint)] hover:text-[var(--a-ink)] transition-colors"
                        >
                          → Read Report
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Footnote */}
          {agentic.footnote && (
            <p className="mt-8 font-mono text-[11px] text-[var(--a-ink-faint)] leading-relaxed max-w-2xl pl-3 border-l border-[var(--a-rule)] whitespace-pre-line">
              {agentic.footnote}
            </p>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="shrink-0 px-6 py-3 flex items-center justify-between text-[var(--a-ink-faint)] text-[12px] font-mono border-t border-[var(--a-rule)]">
        <span>~/LLM-Gauntlet-Development:main</span>
        <span>Agentic V2 · {agentic.rows.length} models</span>
      </div>
    </div>
  )
}

import { STOCK_ROWS } from '../../lib/leaderboards'

const TASK_LABELS = ['FIM Parser', 'Async', 'Cache', 'Job Queue', 'Retry', 'Memoize', 'FSM']

function ScoreCell({ score, shots }: { score: number | 'DNF' | null; shots: 1 | 2 | 3 | null }) {
  if (score === null) return <span className="text-[color:var(--color-ink-faint)] text-sm">—</span>
  if (score === 'DNF') return <span className="font-mono text-xs uppercase text-[color:var(--color-danger)]">DNF</span>
  return (
    <span className="font-mono text-sm">
      <span className="font-semibold">{score}</span>
      {shots && shots > 1 && (
        <span className="ml-0.5 text-[10px] text-[color:var(--color-ink-faint)]">{shots === 2 ? '②' : '③'}</span>
      )}
    </span>
  )
}

export function StockTable() {
  return (
    <div className="space-y-5">
      <p className="font-mono text-[11px] text-[color:var(--color-ink-faint)] leading-relaxed max-w-2xl">
        GPT OSS Medium's stock params matched its ideal Model Card (Temp 0.8) — the accidental champion.
        Models without T6/T7 ran T1–T5 only.
      </p>
      <div className="border-[1.5px] border-[color:var(--color-ink)] rounded-2xl bg-[color:var(--color-bg)] overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead>
            <tr className="border-b border-[color:var(--color-ink)]">
              <th className="font-mono text-[11px] uppercase tracking-wider font-semibold py-4 px-4 text-left min-w-[240px]">Model</th>
              <th className="font-mono text-[11px] uppercase tracking-wider font-semibold py-4 px-4 text-right">Avg</th>
              {TASK_LABELS.map((l, i) => (
                <th key={i} className="font-mono text-[11px] uppercase tracking-wider font-semibold py-4 px-3 text-right whitespace-nowrap">{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STOCK_ROWS.map((row) => (
              <tr key={row.slug} className="border-b border-[color:var(--color-rule)] last:border-0 hover:bg-[color:var(--color-surface)] transition-colors">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[color:var(--color-ink-faint)] w-6 shrink-0">
                      {row.rank === 'DNF' ? '—' : `#${row.rank}`}
                    </span>
                    <div>
                      <div className="font-mono text-sm font-semibold text-[color:var(--color-ink)]">{row.name}</div>
                      <div className="font-mono text-[11px] text-[color:var(--color-ink-faint)]">{row.quant}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  {row.avg !== null
                    ? <>
                        <span className="font-mono text-[22px] font-bold leading-none tracking-[0.02em]">{row.avg.toFixed(1)}</span>
                        {row.note && <div className="font-mono text-[10px] text-[color:var(--color-ink-faint)] mt-0.5">{row.note}</div>}
                      </>
                    : <span className="font-mono text-xs uppercase text-[color:var(--color-danger)]">DNF</span>}
                </td>
                {row.scores.map((s, j) => (
                  <td key={j} className="py-4 px-3 text-right">
                    <ScoreCell score={s} shots={row.shots[j]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

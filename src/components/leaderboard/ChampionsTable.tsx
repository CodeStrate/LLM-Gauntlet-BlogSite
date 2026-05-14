import { CHAMPION_ROWS } from '../../lib/leaderboards'
import { models } from '../../lib/models'
import { BrandIcon } from '../BrandIcon'

export function ChampionsTable() {
  return (
    <div className="space-y-5">
      <div className="font-mono text-[11px] text-[color:var(--color-ink-faint)] leading-relaxed max-w-2xl space-y-1">
        <p><strong className="text-[color:var(--color-ink)]">T8</strong> — Async Circuit Breaker Pool with connection pooling, failure threshold, half-open probing, per-service state.</p>
        <p><strong className="text-[color:var(--color-ink)]">T9</strong> — Dependency Injection Container with interface binding, factory resolution, singleton scope, circular-dep detection.</p>
        <p>Qualification gate: ≥ 7.5 average on T1–T7 (REAP tier). T10 (Observable State Machine) reserved for V3.</p>
      </div>

      <div className="border-[1.5px] border-[color:var(--color-ink)] rounded-2xl bg-[color:var(--color-bg)] overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead>
            <tr className="border-b border-[color:var(--color-ink)]">
              <th className="font-mono text-[11px] uppercase tracking-wider font-semibold py-4 px-4 text-left min-w-[220px]">Model</th>
              <th className="font-mono text-[11px] uppercase tracking-wider font-semibold py-4 px-4 text-right">T8 · Circuit Breaker</th>
              <th className="font-mono text-[11px] uppercase tracking-wider font-semibold py-4 px-4 text-right">T9 · DI Container</th>
              <th className="font-mono text-[11px] uppercase tracking-wider font-semibold py-4 px-4 text-right">Verdict</th>
              <th className="font-mono text-[11px] uppercase tracking-wider font-semibold py-4 px-4 text-left min-w-[220px]">Notes</th>
            </tr>
          </thead>
          <tbody>
            {CHAMPION_ROWS.map((row) => {
              const m = models.find(m => m.slug === row.slug)
              return (
                <tr key={row.slug} className="border-b border-[color:var(--color-rule)] last:border-0 hover:bg-[color:var(--color-surface)] transition-colors">
                  <td className="py-5 px-4">
                    <div className="flex items-center gap-3">
                      <span className={`font-mono text-xs w-5 shrink-0 ${row.rank === 'Failed' ? 'text-[color:var(--color-ink-faint)]' : 'text-[color:var(--color-ink-faint)]'}`}>
                        {row.rank === 'Failed' ? '✗' : `#${row.rank}`}
                      </span>
                      {m && <BrandIcon model={m} className="w-5 h-5 shrink-0" />}
                      <div>
                        <div className="font-mono text-sm font-semibold text-[color:var(--color-ink)]">{row.name}</div>
                        <div className="font-mono text-[11px] text-[color:var(--color-ink-faint)]">{row.vendor}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-4 text-right">
                    <div className="font-mono text-sm font-bold">{row.t8Score ?? '—'}</div>
                    <div className="font-mono text-[11px] text-[color:var(--color-ink-faint)]">{row.t8Shots}</div>
                  </td>
                  <td className="py-5 px-4 text-right">
                    {row.t9Score !== null
                      ? <div className="font-mono text-sm font-bold">{row.t9Score}</div>
                      : <div className="font-mono text-xs uppercase text-[color:var(--color-ink-faint)]">DNF</div>}
                    <div className="font-mono text-[11px] text-[color:var(--color-ink-faint)]">{row.t9Shots}</div>
                  </td>
                  <td className="py-5 px-4 text-right">
                    <span className={`font-mono text-[11px] font-semibold uppercase tracking-wide px-2 py-1 rounded border ${
                      row.verdict === 'Qualified'
                        ? 'border-[color:var(--color-ink)] text-[color:var(--color-ink)]'
                        : 'border-[color:var(--color-rule)] text-[color:var(--color-ink-faint)]'
                    }`}>
                      {row.verdict}
                    </span>
                  </td>
                  <td className="py-5 px-4">
                    <span className="font-mono text-[11px] text-[color:var(--color-ink-faint)] leading-relaxed">
                      {row.verdictNote ?? '—'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

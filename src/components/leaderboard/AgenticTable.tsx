import { AGENTIC_V2_SCORES } from '../../lib/leaderboards'
import { models } from '../../lib/models'
import { BrandIcon } from '../BrandIcon'

export function AgenticTable() {
  return (
    <div className="space-y-5">
      <div className="font-mono text-[11px] text-[color:var(--color-ink-faint)] leading-relaxed max-w-2xl space-y-1">
        <p>Task: build a complete RAG pipeline — LangChain + Ollama + Chroma + LCEL chain + working CLI.</p>
        <p>Phase 1 max 40 pts (Friction 10 + Speed 10 + Accuracy 10 + Quality 10). Phase 2 bonus ±5 (BM25 + ensemble retrieval + cross-encoder reranker). Harness: OpenCode with LM Studio provider.</p>
      </div>

      <div className="border-[1.5px] border-[color:var(--color-ink)] rounded-2xl bg-[color:var(--color-bg)] overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-[color:var(--color-ink)]">
              <th className="font-mono text-[11px] uppercase tracking-wider font-semibold py-4 px-4 text-left min-w-[240px]">Model</th>
              <th className="font-mono text-[11px] uppercase tracking-wider font-semibold py-4 px-4 text-right">Phase 1</th>
              <th className="font-mono text-[11px] uppercase tracking-wider font-semibold py-4 px-4 text-right">Phase 2</th>
              <th className="font-mono text-[11px] uppercase tracking-wider font-semibold py-4 px-4 text-right">Total</th>
              <th className="font-mono text-[11px] uppercase tracking-wider font-semibold py-4 px-4 text-left">Verdict</th>
            </tr>
          </thead>
          <tbody>
            {AGENTIC_V2_SCORES.map((row) => {
              const m = models.find(m => m.slug === row.modelSlug)
              return (
                <tr key={row.modelSlug} className="border-b border-[color:var(--color-rule)] last:border-0 hover:bg-[color:var(--color-surface)] transition-colors">
                  <td className="py-5 px-4">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs w-7 shrink-0 text-[color:var(--color-ink-faint)]">
                        {row.rank}
                      </span>
                      {m
                        ? <BrandIcon model={m} className="w-5 h-5 shrink-0" />
                        : <BrandIcon icon="simple-icons:mistralai" className="w-5 h-5 shrink-0" />}
                      <div>
                        <div className="font-mono text-sm font-semibold text-[color:var(--color-ink)]">{row.name}</div>
                        <div className="font-mono text-[11px] text-[color:var(--color-ink-faint)]">{row.vendor}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-4 text-right">
                    {row.phase1 !== null
                      ? <span className="font-mono text-sm">
                          <span className="font-semibold">{row.phase1}</span>
                          <span className="text-[color:var(--color-ink-faint)]">/{row.phase1Max}</span>
                        </span>
                      : <span className="font-mono text-xs text-[color:var(--color-ink-faint)]">—</span>}
                  </td>
                  <td className="py-5 px-4 text-right">
                    {row.phase2 !== null && row.phase2 !== undefined
                      ? <span className="font-mono text-sm font-semibold">
                          {row.phase2 > 0 ? '+' : ''}{row.phase2}
                        </span>
                      : <span className="font-mono text-[color:var(--color-ink-faint)] text-xs">—</span>}
                  </td>
                  <td className="py-5 px-4 text-right">
                    {row.total !== null
                      ? <span className="font-mono text-[22px] font-bold leading-none">
                          {row.total}
                          <span className="text-[14px] text-[color:var(--color-ink-faint)] font-normal">/{row.totalMax}</span>
                        </span>
                      : <span className="font-mono text-xs uppercase text-[color:var(--color-ink-faint)]">DNF</span>}
                  </td>
                  <td className="py-5 px-4">
                    <span className="font-mono text-[12px] text-[color:var(--color-ink-soft)]">{row.verdict}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="font-mono text-[11px] text-[color:var(--color-ink-faint)] leading-relaxed">
        Phase 2 gate: all 7 Phase 1 accuracy checks must pass without human intervention.
        Devstral Small 2 was killed by MacOS OOM (18GB+) before Phase 1 could complete.
      </p>
    </div>
  )
}

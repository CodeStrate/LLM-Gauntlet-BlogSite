import { Link, useParams } from 'react-router-dom'
import { TaskScoreboard } from '../components/TaskScoreboard'
import { getModel, activeModels, benchedModels, modelGroupKey, type Model } from '../lib/models'
import { BrandIcon } from '../components/BrandIcon'

export function ModelDetail() {
  const { slug = '' } = useParams()
  const model = getModel(slug)

  if (!model) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24">
        <h1 className="text-3xl font-bold mb-2">Model not found.</h1>
        <p className="font-mono text-xs text-[color:var(--color-ink-faint)]">
          No registry entry for <code>{slug}</code>.{' '}
          <Link to="/models" className="underline">Back to models</Link>.
        </p>
      </div>
    )
  }

  // Find variants of the same model family
  const allModels = [...activeModels(), ...benchedModels()]
  const familyKey = modelGroupKey(model)
  const variants = allModels.filter(m => modelGroupKey(m) === familyKey && m.slug !== model.slug)

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <Link to="/models" className="font-mono text-[14px] uppercase tracking-wider text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)] mb-10 inline-block transition-colors">
        ← Back to models
      </Link>

      <Header model={model} />
      <Summary model={model} />

      <section className="mt-16">
        <h2 className="font-headline tracking-[0.04em] uppercase text-[clamp(28px,4vw,40px)] leading-none mb-8">
          Per-task breakdown
        </h2>
        <TaskScoreboard scores={model.scores} />
      </section>

      <Spec model={model} />

      {variants.length > 0 && (
        <section className="mt-16 pt-12 border-t border-[color:var(--color-rule-soft)]">
          <h2 className="font-mono text-sm font-semibold tracking-wider uppercase mb-6 text-[color:var(--color-ink-soft)]">
            Other Variants Tested
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {variants.map(v => (
              <Link 
                key={v.slug} 
                to={`/models/${v.slug}`}
                className="group block border border-[color:var(--color-rule)] rounded-lg p-5 hover:border-[color:var(--color-ink)] transition-colors bg-[color:var(--color-bg)]"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-sans text-xl font-bold group-hover:underline">
                    {v.name}
                  </h3>
                  {v.averageScore !== undefined && (
                    <span className="font-headline text-2xl leading-none">
                      {v.averageScore.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-[color:var(--color-ink-soft)]">
                  {[v.variant, v.quant].filter(Boolean).join(' · ')}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  )
}

function Header({ model }: { model: Model }) {
  return (
    <header className="flex flex-col lg:flex-row lg:items-start gap-6 sm:gap-10 mb-10">
      <div className="flex items-start gap-6 sm:gap-10 flex-1 min-w-0">
        <BrandIcon model={model} className="w-[72px] h-[72px] sm:w-[120px] sm:h-[120px] text-[color:var(--color-ink)] shrink-0" aria-hidden />
        <div className="min-w-0 flex-1 pt-1 sm:pt-2">
          <div className="font-mono text-[12px] sm:text-[13px] uppercase tracking-widest text-[color:var(--color-ink-soft)] mb-3">
            {model.vendor}
          </div>
          <h1 className="font-headline text-[clamp(40px,8vw,88px)] leading-[0.95] tracking-[0.02em] uppercase mt-1">
            {model.name}
          </h1>
          {model.variant && (
            <div className="font-mono text-[13px] sm:text-[14px] uppercase tracking-[0.15em] text-[color:var(--color-ink-soft)] mt-4">
              {model.variant}
            </div>
          )}
          {model.badges && model.badges.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-6">
              {model.badges.map(b => (
                <span key={b} className="font-mono text-[11px] uppercase tracking-widest border border-[color:var(--color-ink)] rounded px-2.5 py-1">
                  {b}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      {model.averageScore !== undefined && (
        <div className="text-left lg:text-right shrink-0 pt-2">
          <div className="font-headline text-[clamp(52px,10vw,110px)] leading-[0.85]">
            {model.averageScore.toFixed(2)}
          </div>
          <div className="font-mono text-[12px] uppercase tracking-widest text-[color:var(--color-ink-soft)] mt-3">
            casual avg
          </div>
          {model.competitiveAverage !== undefined && (
            <div className="mt-3 pt-3 border-t border-[color:var(--color-rule)]">
              <div className="font-headline text-[clamp(28px,5vw,48px)] leading-none text-[color:var(--color-ink-soft)]">
                {model.competitiveAverage.toFixed(2)}
              </div>
              <div className="font-mono text-[11px] uppercase tracking-widest text-[color:var(--color-ink-faint)] mt-1.5">
                competitive avg
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  )
}

function Summary({ model }: { model: Model }) {
  return (
    <div className="border-l-[4px] border-[color:var(--color-ink)] pl-5 sm:pl-6 py-3 bg-[color:var(--color-rule-soft)]/50 rounded-r-xl">
      <p className="text-[16px] sm:text-[18px] leading-relaxed text-[color:var(--color-ink)]">{model.summary}</p>
    </div>
  )
}

function Spec({ model }: { model: Model }) {
  const rows: { label: string; value: string }[] = []
  if (model.params) rows.push({ label: 'Parameters', value: model.params })
  if (model.quant) rows.push({ label: 'Quantisation', value: model.quant })
  rows.push({ label: 'Track', value: model.track.toUpperCase() })
  rows.push({ label: 'Status', value: model.status.toUpperCase() })

  return (
    <section className="mt-14 flex flex-wrap bg-[color:var(--color-ink)] border border-[color:var(--color-ink)] rounded-xl overflow-hidden gap-px">
      {rows.map(r => (
        <div key={r.label} className="bg-[color:var(--color-bg)] p-6 flex-1 min-w-[150px] sm:min-w-[200px]">
          <div className="font-mono text-[11px] uppercase tracking-wider text-[color:var(--color-ink-soft)] mb-2">{r.label}</div>
          <div className="font-sans text-[20px] font-bold leading-tight">{r.value}</div>
        </div>
      ))}
    </section>
  )
}

import { Link } from 'react-router-dom'
import type { Model } from '../lib/models'
import { BrandIcon } from './BrandIcon'

type ModelCardProps = {
  model: Model
  /** Right-column cards in a 2-up grid get extra left padding so they don't crowd the divider. */
  extraLeftPad?: boolean
}

export function ModelCard({ model, extraLeftPad = false }: ModelCardProps) {
  // Inline-style the left padding so it cannot be missed by Tailwind's class scanner.
  // Right-column cards (extraLeftPad=true) get a deeper bump so they don't crowd the divider.
  // Below md the grid is single-column and only the base value applies.
  const paddingLeft = extraLeftPad
    ? 'clamp(1.25rem, 6vw, 7rem)'   // ~20px → 112px
    : 'clamp(1.25rem, 3.5vw, 4rem)' // ~20px → 64px

  const subtext = cardSubtext(model)

  return (
    <Link
      to={`/models/${model.slug}`}
      style={{ paddingLeft }}
      className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-16 md:gap-[100px] pr-4 sm:pr-16 md:pr-20 py-10 sm:py-16 min-h-[220px] sm:min-h-[240px] bg-[color:var(--color-bg)] overflow-hidden h-full active:bg-[color:var(--color-rule-soft)]/60 transition-colors"
    >
      {/* Bottom wipe — desktop hover. Touch devices fire :active during tap, so
         we keep group-active triggers as well so the card flashes feedback
         before navigation kicks in. */}
      <div className="absolute inset-0 bg-[color:var(--color-ink)] origin-bottom scale-y-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100 group-active:scale-y-100 z-0" />

      <BrandIcon model={model} className="w-[64px] h-[64px] sm:w-[110px] sm:h-[110px] shrink-0 relative z-10 text-[color:var(--color-ink)] group-hover:text-[color:var(--color-bg)] group-active:text-[color:var(--color-bg)] transition-colors duration-500" aria-hidden />

      <div className="min-w-0 relative z-10">
        <div className="font-mono whitespace-pre-line text-[clamp(28px,6vw,56px)] font-semibold leading-[0.95] tracking-[0.06em] uppercase text-[color:var(--color-ink)] group-hover:text-[color:var(--color-bg)] group-active:text-[color:var(--color-bg)] transition-colors duration-500">
          {cardTitle(model)}
        </div>
        {subtext && (
          <div className="font-mono text-[11px] sm:text-[12px] tracking-[0.18em] sm:tracking-[0.2em] uppercase mt-2 sm:mt-3 opacity-70 text-[color:var(--color-ink-soft)] group-hover:text-[color:var(--color-rule-soft)] group-active:text-[color:var(--color-rule-soft)] transition-colors duration-500">
            {subtext}
          </div>
        )}
      </div>
    </Link>
  )
}

export function cardSubtext(model: Model) {
  const variantText = model.variant || (model.name.includes("Thinking") ? "THINKING (THINK TOKEN ON)" : model.name.includes("No Think") ? "NO THINK" : model.name.includes("Tuned") ? "TUNED" : "")

  let architecture = ''
  if (model.params) {
    const match = model.params.match(/^([0-9.]+(?:B|M)|E4B)(?:\s+(?:active\s+)?(.*))?/i)
    if (match && match[2]) {
      architecture = match[2].trim()
      if (architecture.startsWith('(') && architecture.endsWith(')')) {
        architecture = architecture.slice(1, -1)
      }
    }
  }

  let quant = model.quant || ''

  // Deduplicate overlapping info between variant and architecture
  if (variantText && architecture) {
    if (/[A][0-9.]+B/i.test(variantText) || variantText.toUpperCase().includes(architecture.toUpperCase().replace(/\s*\([^)]*\)/, ''))) {
      architecture = ''
    }
  }

  // Deduplicate "MoE" in quant
  if ((architecture && /MoE/i.test(architecture) && /MoE/i.test(quant)) || 
      (variantText && /MoE/i.test(variantText) && /MoE/i.test(quant))) {
    quant = quant.replace(/\bMoE\b\s*·?\s*/i, '').trim()
    if (quant.startsWith('· ')) quant = quant.substring(2).trim()
    if (quant.endsWith(' ·')) quant = quant.substring(0, quant.length - 2).trim()
  }

  // Deduplicate size prefix in quant
  let size = ''
  if (model.params) {
    const match = model.params.match(/^([0-9.]+(?:B|M)|E4B)/i)
    if (match) size = match[1]
  }
  if (!size) {
    const match = model.name.match(/([0-9.]+(?:B|M)|E4B)/i)
    if (match) size = match[1]
  }

  if (size && quant.toUpperCase().startsWith(`${size.toUpperCase()} ·`)) {
    quant = quant.substring(size.length + 2).trim()
    if (quant.startsWith('· ')) quant = quant.substring(2).trim()
  }

  const parts = [variantText, architecture, quant].filter(Boolean).map(s => s.toUpperCase())
  return Array.from(new Set(parts)).join(' · ')
}

export function cardTitle(model: Model) {
  let name = model.name.toUpperCase()
  name = name.replace(/\s*(?:[0-9.]+(?:B|M)|E4B)$/i, '').trim()
  
  if (name.includes('GPT OSS')) name = 'GPT OSS'
  else if (name.includes('QWEN3 CODER') || name.includes('QWEN 3')) name = 'QWEN 3'
  else if (name.includes('QWEN 2.5 CODER') || name.includes('QWEN 2.5')) name = 'QWEN 2.5'
  else if (name.includes('SUSHI CODER')) name = 'SUSHI'
  else if (name.includes('NEMOTRON 3 NANO')) name = 'NEMOTRON 3'
  else if (name.startsWith('LFM2')) name = 'LFM2'
  else if (name.includes('GEMMA 4')) name = 'GEMMA 4'
  else if (name.includes('GLM 4.7 FLASH')) name = 'GLM 4.7 FLASH'
  else if (name.includes('DEVSTRAL SMALL') || name.includes('DEVSTRAL')) name = 'DEVSTRAL SMALL'
  else if (name.includes('PHI-4')) name = 'PHI-4'
  else if (name.includes('IBM GRANITE')) name = 'IBM GRANITE 3.1'
  else if (name.includes('MINISTRAL')) name = 'MINISTRAL 3'
  else if (name.includes('CODESTRAL')) name = 'CODESTRAL'
  else if (name.includes('STABLE CODE')) name = 'STABLE CODER'
  
  let size = ''
  if (model.params) {
    const match = model.params.match(/^([0-9.]+(?:B|M)|E4B)/i)
    if (match) size = match[1].toUpperCase()
  }
  if (!size) {
    const match = model.name.match(/([0-9.]+(?:B|M)|E4B)/i)
    if (match) size = match[1].toUpperCase()
  }

  return size ? `${name}\n${size}` : name
}

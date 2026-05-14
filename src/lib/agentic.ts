import data from '../content/agentic.json'

export type Tone = 'good' | 'warn' | 'bad'

export type Chip = { text: string; tone: Tone }

export type AgenticRow = {
  rank: string
  modelSlug: string
  verdict: string
  tone: Tone
  chips: Chip[]
  body: string
}

export type AgenticData = {
  harness: string
  task?: string
  intro: string
  caveat: string
  rows: AgenticRow[]
  footnote: string
}

export const agentic: AgenticData = data as AgenticData

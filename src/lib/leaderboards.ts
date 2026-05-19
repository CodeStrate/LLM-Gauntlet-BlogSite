/**
 * Leaderboard tier data. Each tier corresponds to a tab on the Leaderboard page.
 * REAP and Tuned rows come from models.json (via lib/models.ts).
 * Stock, Champions, and Agentic use the structures below.
 */

// ---------------------------------------------------------------------------
// Stock (V2.0) — default LM Studio parameters, historical baseline
// ---------------------------------------------------------------------------
export type StockRow = {
  rank: number | 'DNF'
  slug: string
  name: string
  vendor: string
  quant: string
  scores: (number | 'DNF' | null)[]
  shots: (1 | 2 | 3 | null)[]
  avg: number | null
  note?: string
}

export const STOCK_ROWS: StockRow[] = [
  {
    rank: 1, slug: 'gpt-oss-20b-medium', name: 'GPT OSS 20B · Medium', vendor: 'OpenAI',
    quant: 'MoE · MXFP4',
    scores: [9, 9, 9, 7.2, 9, 4.8, 6.4],
    shots:  [1, 1, 1, 2,   1, 3,   2  ],
    avg: 7.80,
  },
  {
    rank: 2, slug: 'gpt-oss-20b-low', name: 'GPT OSS 20B · Low', vendor: 'OpenAI',
    quant: 'MoE · MXFP4',
    scores: [9, 8, 6.0, 5.6, 7, null, null],
    shots:  [1, 1, 1,   2,   1, null, null],
    avg: 7.10, note: 'T1–T5 only',
  },
  {
    rank: 3, slug: 'gemma-4-e4b-stock', name: 'Gemma 4 E4B', vendor: 'Google',
    quant: 'Q4_KM',
    scores: [9, 7.2, 9.0, 3.0, 8, 'DNF', 'DNF'],
    shots:  [1, 2,   1,   1,   1, null,   null  ],
    avg: 5.10,
  },
  {
    rank: 4, slug: 'codestral-22b', name: 'Codestral 22B', vendor: 'Mistral AI',
    quant: '4bit',
    scores: [7, 4.0, 6.0, 'DNF', 6, null, null],
    shots:  [1, 2,   1,   null,  1, null, null],
    avg: 4.60, note: 'T1–T5 only',
  },
  {
    rank: 5, slug: 'devstral-small-stock', name: 'Devstral Small', vendor: 'Mistral AI',
    quant: '4bit',
    scores: [6.4, 9, 6.0, 'DNF', 'DNF', 5, 'DNF'],
    shots:  [2,   1, 1,   null,  null,  1, null  ],
    avg: 4.50,
  },
  {
    rank: 6, slug: 'qwen25-coder-14b', name: 'Qwen2.5-Coder 14B', vendor: 'Alibaba',
    quant: '14B Q4',
    scores: [5, 4.8, 2.4, 6, 1.8, 'DNF', 4],
    shots:  [1, 2,   3,   1, 3,   null,  1],
    avg: 3.50,
  },
  {
    rank: 7, slug: 'nemotron-3-nano-4b', name: 'Nemotron 3 Nano 4B', vendor: 'NVIDIA',
    quant: '4B · 8-bit',
    scores: [5.6, 4.8, 6.0, 'DNF', 'DNF', 4, 'DNF'],
    shots:  [2,   2,   1,   null,  null,  1, null  ],
    avg: 3.40,
  },
  {
    rank: 8, slug: 'ibm-granite-3b', name: 'IBM Granite 3.1 3B', vendor: 'IBM',
    quant: '3B-A800M · 8-bit',
    scores: [4, 4.0, 'DNF', 2, 1.8, null, null],
    shots:  [1, 2,   null,  1, 3,   null, null],
    avg: 2.60, note: 'T1–T5 only',
  },
  {
    rank: 9, slug: 'lfm2-24b', name: 'LFM2 24B A2B', vendor: 'Liquid AI',
    quant: '4bit',
    scores: [3, 4.0, 'DNF', 'DNF', 'DNF', null, null],
    shots:  [1, 2,   null,  null,  null,  null, null],
    avg: 2.30, note: 'T1–T2 only',
  },
  {
    rank: 10, slug: 'stable-code-3b', name: 'Stable Code 3B', vendor: 'Stability AI',
    quant: '3B · BF16',
    scores: [1, 1, 1, 1, 1, null, null],
    shots:  [1, 1, 1, 1, 1, null, null],
    avg: 1.00, note: 'T1–T5 only',
  },
  {
    rank: 'DNF', slug: 'gpt-oss-20b-high', name: 'GPT OSS 20B · High', vendor: 'OpenAI',
    quant: 'MoE · MXFP4',
    scores: [9, 10, 7, 'DNF', 9, 6, 7],
    shots:  [1, 1,  1, null, 1, 1, 1],
    avg: null,
  },
]

// ---------------------------------------------------------------------------
// Champions Gauntlet — T8 (Async Circuit Breaker Pool) + T9 (DI Container)
// ---------------------------------------------------------------------------
export type ChampionRow = {
  rank: number | 'Failed'
  slug: string
  name: string
  vendor: string
  t8Score: number | null
  t8Shots: string
  t9Score: number | null
  t9Shots: string
  verdict: 'Qualified' | 'Failed T8' | 'Failed T9' | 'Pending'
  verdictNote?: string
}

export const CHAMPION_ROWS: ChampionRow[] = [
  {
    rank: 1,
    slug: 'gpt-oss-20b-medium',
    name: 'GPT OSS 20B Medium',
    vendor: 'OpenAI',
    t8Score: 8.5, t8Shots: '3–4 shots',
    t9Score: 7.5, t9Shots: '5–6 shots',
    verdict: 'Qualified',
  },
  {
    rank: 2,
    slug: 'cerebras-qwen3-25b-reap',
    name: 'Qwen3 Coder 25B',
    vendor: 'Cerebras (Qwen)',
    t8Score: 5.0, t8Shots: '5+ iterations',
    t9Score: 9.5, t9Shots: '1 shot',
    verdict: 'Failed T8',
    verdictNote: 'One-shot the harder task (T9) but async concurrency remains its biggest foe.',
  },
  {
    rank: 'Failed',
    slug: 'gemma-4-19b-reap',
    name: 'Gemma 4 19B REAP',
    vendor: 'Google',
    t8Score: 9.0, t8Shots: '2 shots',
    t9Score: null, t9Shots: 'DNF',
    verdict: 'Failed T9',
    verdictNote: 'Type registration loop — repeated identical class definitions until context exhaustion.',
  },
]

// ---------------------------------------------------------------------------
// Agentic V2 score helpers (sourced from agentic.json)
// ---------------------------------------------------------------------------
export type AgenticV2Score = {
  rank: string
  modelSlug: string
  name: string
  vendor: string
  phase1: number | null
  phase1Max: number
  phase2: number | null
  total: number | null
  totalMax: number
  phase2Qualified: boolean
  verdict: string
  tone: 'good' | 'warn' | 'bad'
}

export const AGENTIC_V2_SCORES: AgenticV2Score[] = [
  { rank: '#1', modelSlug: 'cerebras-qwen3-25b-reap',  name: 'Qwen3 Coder 25B',  vendor: 'Cerebras (Qwen)', phase1: 37.5, phase1Max: 40, phase2:  1,    total: 38.5, totalMax: 45, phase2Qualified: true,  verdict: 'Blitzed Phase 1, needed frontier fix to land Phase 2',  tone: 'good' },
  { rank: '#2', modelSlug: 'gemma-4-19b-reap',         name: 'Gemma 4 19B REAP', vendor: 'Google',          phase1: 35.5, phase1Max: 40, phase2: -5,    total: 30.5, totalMax: 45, phase2Qualified: true,  verdict: 'Phase 1 ace — reasoning collapsed in Phase 2',          tone: 'warn' },
  { rank: '#3', modelSlug: 'glm-4-7-flash-23b-reap',   name: 'GLM 4.7 Flash 23B',vendor: 'Zhipu AI',        phase1: 31,   phase1Max: 40, phase2: -2,    total: 29,   totalMax: 45, phase2Qualified: true,  verdict: 'Over-engineered Phase 1 became its own trap',           tone: 'warn' },
  { rank: '#4', modelSlug: 'gpt-oss-20b-medium',       name: 'GPT OSS 20B',      vendor: 'OpenAI',          phase1: 21,   phase1Max: 40, phase2:  null, total: 21,   totalMax: 40, phase2Qualified: false, verdict: 'Outdated tool knowledge — legacy imports, broken LCEL chain', tone: 'bad'  },
  { rank: '#5', modelSlug: 'sushi-coder-9b',           name: 'Sushi Coder 9B',   vendor: 'Alibaba',         phase1: 18,   phase1Max: 40, phase2:  null, total: 18,   totalMax: 40, phase2Qualified: false, verdict: 'Ran its own CLI in a loop, blocked by itself',           tone: 'bad'  },
  { rank: '#6', modelSlug: 'gemma-4-e4b',              name: 'Gemma 4 E4B',      vendor: 'Google',          phase1: 17,   phase1Max: 40, phase2:  null, total: 17,   totalMax: 40, phase2Qualified: false, verdict: 'Mocked the entire app instead of building it',           tone: 'bad'  },
  { rank: 'DNF',modelSlug: 'devstral-small-2-2512',   name: 'Devstral Small 2', vendor: 'Mistral AI',      phase1: null, phase1Max: 40, phase2:  null, total: null, totalMax: 40, phase2Qualified: false, verdict: 'OOM-killed before Phase 1 completed',                    tone: 'bad'  },
]

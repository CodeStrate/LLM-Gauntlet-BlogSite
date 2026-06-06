/**
 * Model registry — types + loader. Data lives in `src/content/models.json`.
 * Components in /pages and /components consume this layer; they never
 * hard-code model copy or scores.
 */
import data from '../content/models.json'

export type Track = 'A' | 'B' | 'C' | 'retired' | 'bench' | 'too-low'

export type ModelStatus = 'complete' | 'incomplete' | 'dnf' | 'bench' | 'retired'

export type TaskId = 't1' | 't2' | 't3' | 't4' | 't5' | 't6' | 't7'

export type TaskScore = {
  task: TaskId
  raw?: number
  shots?: 1 | 2 | 3
  final?: number
  dnf?: boolean
  note?: string
}

export type Model = {
  slug: string
  name: string
  variant?: string
  vendor: string
  iconifyId: string
  params?: string
  quant?: string
  track: Track
  status: ModelStatus
  averageScore?: number
  competitiveAverage?: number
  summary: string
  scores: TaskScore[]
  badges?: string[]
  reap?: boolean
}

export const models: Model[] = data as Model[]

export type ModelGroup = {
  key: string
  baseName: string
  primary: Model
  variants: Model[]
}

const TASK_LABELS: Record<TaskId, string> = {
  t1: 'FIM YAML Parser',
  t2: 'Async Refactor',
  t3: 'Concurrent Cache',
  t4: 'JobScheduler',
  t5: 'Retry Decorator',
  t6: 'Memoize Function',
  t7: 'Finite State Machine',
}

const TASK_SHORT_LABELS: Record<TaskId, string> = {
  t1: 'FIM Parser',
  t2: 'Sync-Async',
  t3: 'Concurrency Bug',
  t4: 'Job Queue',
  t5: 'Retry',
  t6: 'Memoize',
  t7: 'StateMachine',
}

export const TASK_IDS: TaskId[] = ['t1', 't2', 't3', 't4', 't5', 't6', 't7']

export const taskLabel = (id: TaskId): string => TASK_LABELS[id]
export const taskShortLabel = (id: TaskId): string => TASK_SHORT_LABELS[id]

export function getModel(slug: string): Model | undefined {
  return models.find(m => m.slug === slug)
}

export function rankedModels(): Model[] {
  return [...models].sort((a, b) => {
    const aScore = a.averageScore ?? -1
    const bScore = b.averageScore ?? -1
    if (aScore !== bScore) return bScore - aScore
    return a.name.localeCompare(b.name)
  })
}

export function activeModels(): Model[] {
  return models.filter(m => m.status === 'complete' || m.status === 'incomplete')
}

export function benchedModels(): Model[] {
  return models.filter(m => m.status === 'bench' || m.status === 'retired' || m.status === 'dnf')
}

export function modelGroupKey(model: Model): string {
  if (model.reap) return `reap-${model.slug}`
  const normalized = model.name
    .toLowerCase()
    .replace(/\b(no think|thinking|medium reasoning|low reasoning|high reasoning|tuned|stock|track b|retry)\b/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  if (normalized.includes('gpt-oss-20b')) return 'gpt-oss-20b'
  if (normalized.includes('gemma-4-e4b')) return 'gemma-4-e4b'
  if (normalized.includes('devstral-small')) return 'devstral-small'
  return normalized
}

export function groupedModels(list: Model[] = models): ModelGroup[] {
  const map = new Map<string, Model[]>()
  for (const model of list) {
    const key = modelGroupKey(model)
    map.set(key, [...(map.get(key) ?? []), model])
  }

  return [...map.entries()]
    .map(([key, variants]) => {
      const sorted = [...variants].sort((a, b) => (b.averageScore ?? -1) - (a.averageScore ?? -1))
      return {
        key,
        baseName: baseModelName(sorted[0]),
        primary: sorted[0],
        variants: sorted,
      }
    })
    .sort((a, b) => (b.primary.averageScore ?? -1) - (a.primary.averageScore ?? -1))
}

function baseModelName(model: Model): string {
  if (model.reap) return `${model.name} (REAP)`
  if (model.name.includes('GPT OSS')) return 'GPT OSS 20B'
  if (model.name.includes('Gemma')) return 'Gemma 4 E4B'
  if (model.name.includes('Devstral')) return 'Devstral Small'
  return model.name
}

/** Find a task in a model's score list. */
export function findScore(model: Model, task: TaskId): TaskScore | undefined {
  return model.scores.find(s => s.task === task)
}

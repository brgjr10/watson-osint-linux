// Type definitions and helpers for OSINT lookups.

export type EntityKind = 'domain' | 'company' | 'email' | 'ip' | 'person' | 'username' | 'cert' | 'leak' | 'repo'

export interface GraphNode {
  id: string
  label: string
  kind: EntityKind
  x: number // 0–100, % of canvas width
  y: number // 0–100, % of canvas height
  risk?: 'low' | 'medium' | 'high'
  root?: boolean
}

export interface GraphEdge {
  from: string
  to: string
  label?: string
}


export type ToolCategory = 'Infrastructure' | 'Identity' | 'Corporate' | 'Web & archive' | 'Threat intel' | 'Code' | 'Social' | 'Media'

export interface Tool {
  name: string
  category: ToolCategory
  description: string
  license: string
  status: 'connected' | 'available' | 'beta'
  runs: number
}


export interface CaseRow {
  id: string
  title: string
  target: string
  kind: EntityKind
  purpose: string
  status: 'running' | 'review' | 'closed' | 'monitoring'
  entities: number
  updated: string
  owner: string
}

export const cases: CaseRow[] = []


export type SearchKind = 'username' | 'email' | 'phone' | 'domain' | 'company'

/** Guess what the user typed so they never have to pick a type themselves. */
export function detectKind(q: string): SearchKind {
  const s = q.trim()
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return 'email'
  if (/^\+?[\d\s()-]{7,}$/.test(s)) return 'phone'
  if (/^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/.*)?$/i.test(s)) return 'domain'
  if (/\s(ltd|llc|inc|gmbh|corp|ооо|ао)\.?$/i.test(s) || /\s/.test(s)) return 'company'
  return 'username'
}

export type PlatformGroup = 'Social' | 'Dev' | 'Gaming' | 'Forums' | 'Media'

export interface FoundProfile {
  site: string
  group: PlatformGroup
  since: string
  hue: string
  detail: string
  match: 'exact' | 'likely'
  url?: string
  username?: string
  links?: string[]
  emails?: string[]
  phones?: string[]
  bio?: string
  location?: string
  name?: string
  connections?: Array<{type: string, value: string, source?: string}>
}


/**
 * Real lookups only - no mock data.
 */
export async function searchProfiles(query: string): Promise<FoundProfile[]> {
  const q = query.trim()
  if (!q) return []
  const kind = detectKind(q)
  try {
    const w = typeof window !== 'undefined' ? (window as any) : (globalThis as any).window
    const api = w?.api || (globalThis as any).api
    if (api && typeof api.runLookup === 'function') {
      const lookupKind = (kind === 'email' || kind === 'phone' || kind === 'domain' || kind === 'company') ? kind : 'username'
      const res: any = await api.runLookup(lookupKind, q)
      if (Array.isArray(res)) {
        return res
      }
    }
  } catch (e) {
  }
  return []
}

// Built-in example data used by the screens until real lookups are connected.

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

export const caseGraph: { nodes: any[]; edges: any[] } = {
  nodes: [],
  edges: [],
}

export type ToolCategory = 'Infrastructure' | 'Identity' | 'Corporate' | 'Web & archive' | 'Threat intel' | 'Code'

export interface Tool {
  name: string
  category: ToolCategory
  description: string
  license: string
  status: 'connected' | 'available' | 'beta'
  runs: number
}

export const tools: Tool[] = [
  { name: 'Maigret', category: 'Identity', description: 'Username enumeration across sites', license: 'Open source', status: 'connected', runs: 0 },
  { name: 'Holehe', category: 'Identity', description: 'Email account discovery', license: 'Open source', status: 'connected', runs: 0 },
  { name: 'Sherlock', category: 'Identity', description: 'Username search across social networks', license: 'Open source', status: 'available', runs: 0 },
  { name: 'WhatsMyName', category: 'Identity', description: 'Username OSINT tool', license: 'Open source', status: 'available', runs: 0 },
  { name: 'Subfinder', category: 'Infrastructure', description: 'Subdomain discovery', license: 'Open source', status: 'available', runs: 0 },
  { name: 'Amass', category: 'Infrastructure', description: 'In-depth attack surface mapping', license: 'Open source', status: 'available', runs: 0 },
]

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

export const agentSteps: any[] = []

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

export const foundProfiles: FoundProfile[] = [
  { site: 'GitHub', group: 'Dev', since: '2019', hue: '#a78bfa', detail: '23 public repos', match: 'exact' },
  { site: 'Reddit', group: 'Forums', since: '2018', hue: '#ff7a45', detail: '1.2k karma', match: 'exact' },
  { site: 'Steam', group: 'Gaming', since: '2016', hue: '#5eead4', detail: 'Level 34', match: 'exact' },
  { site: 'Twitch', group: 'Gaming', since: '2020', hue: '#c084fc', detail: '84 followers', match: 'likely' },
  { site: 'Medium', group: 'Media', since: '2021', hue: '#ede6d6', detail: '6 articles', match: 'exact' },
  { site: 'Telegram', group: 'Social', since: '2020', hue: '#60a5fa', detail: 'Public username', match: 'likely' },
  { site: 'Pinterest', group: 'Social', since: '2017', hue: '#ff6b6b', detail: '3 boards', match: 'likely' },
  { site: 'Stack Overflow', group: 'Dev', since: '2019', hue: '#f2b544', detail: '412 reputation', match: 'exact' },
  { site: 'Chess.com', group: 'Gaming', since: '2022', hue: '#86efac', detail: 'Rapid 1340', match: 'exact' },
  { site: 'SoundCloud', group: 'Media', since: '2015', hue: '#fb923c', detail: '2 tracks', match: 'likely' },
  { site: 'Habr', group: 'Forums', since: '2020', hue: '#7dd3fc', detail: 'Reader', match: 'likely' },
  { site: 'Docker Hub', group: 'Dev', since: '2021', hue: '#38bdf8', detail: '4 images', match: 'exact' },
]

export const EXAMPLE_QUERY = 'johndoe_92'

/**
 * Real lookups only - no mock data.
 */
export async function searchProfiles(query: string): Promise<FoundProfile[]> {
  const q = query.trim()
  if (!q) return []
  const kind = detectKind(q)
  try {
    const w = (globalThis as any).window
    const api = w?.api || (globalThis as any).api
    if (api && typeof api.runLookup === 'function') {
      const lookupKind = kind === 'email' ? 'email' : 'username'
      const res = await Promise.race([
        api.runLookup(lookupKind, q),
        new Promise((resolve) => setTimeout(() => resolve([]), 15000))
      ])
      if (Array.isArray(res) && res.length > 0) {
        return res
      }
    }
  } catch (e) {
    // ignore
  }
  // No fallback to mock data
  return []


}

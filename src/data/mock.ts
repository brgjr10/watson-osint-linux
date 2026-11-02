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

export const caseGraph: { nodes: any[]; edges: any[] } = {
  nodes: [],
  edges: [],
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

export const tools: Tool[] = [
  { name: 'Maigret', category: 'Identity', description: 'Username enumeration across sites', license: 'Open source', status: 'connected', runs: 0 },
  { name: 'Holehe', category: 'Identity', description: 'Email account discovery', license: 'Open source', status: 'connected', runs: 0 },
  { name: 'Sherlock', category: 'Identity', description: 'Username search across social networks', license: 'Open source', status: 'connected', runs: 0 },
  { name: 'WhatsMyName', category: 'Identity', description: 'Username OSINT tool', license: 'Open source', status: 'available', runs: 0 },
  { name: 'Subfinder', category: 'Infrastructure', description: 'Subdomain discovery', license: 'Open source', status: 'available', runs: 0 },
  { name: 'Amass', category: 'Infrastructure', description: 'In-depth attack surface mapping', license: 'Open source', status: 'available', runs: 0 },
  { name: 'Social Analyzer', category: 'Identity', description: 'Find profiles across 1000+ sites', license: 'Open source', status: 'available', runs: 0 },
  { name: 'Web Check', category: 'Infrastructure', description: 'Website OSINT and tech stack analysis', license: 'Open source', status: 'available', runs: 0 },
  { name: 'HaveIBeenPwned', category: 'Identity', description: 'Data breach checker', license: 'Freemium', status: 'available', runs: 0 },
  { name: 'Shodan', category: 'Infrastructure', description: 'Internet-connected device search', license: 'Freemium', status: 'available', runs: 0 },
  { name: 'VirusTotal', category: 'Threat intel', description: 'File/URL/domain reputation', license: 'Freemium', status: 'available', runs: 0 },
  { name: 'Wayback Machine', category: 'Web & archive', description: 'Internet archive search', license: 'Free', status: 'available', runs: 0 },
  { name: 'crt.sh', category: 'Infrastructure', description: 'Certificate transparency logs', license: 'Free', status: 'available', runs: 0 },
  { name: 'Hunter.io', category: 'Corporate', description: 'Email finder and verifier', license: 'Freemium', status: 'available', runs: 0 },
  { name: 'Google Dorks', category: 'Web & archive', description: 'Advanced search operators', license: 'Free', status: 'connected', runs: 0 },
  { name: 'Bing', category: 'Web & archive', description: 'Web search', license: 'Free', status: 'connected', runs: 0 },
  { name: 'DuckDuckGo', category: 'Web & archive', description: 'Privacy-focused search', license: 'Free', status: 'connected', runs: 0 },
  { name: 'LinkedIn', category: 'Corporate', description: 'Professional network', license: 'Free', status: 'available', runs: 0 },
  { name: 'Twitter/X', category: 'Social', description: 'Social media search', license: 'Free', status: 'available', runs: 0 },
  { name: 'Instagram', category: 'Social', description: 'Photo/video platform', license: 'Free', status: 'available', runs: 0 },
  { name: 'Facebook', category: 'Social', description: 'Social network', license: 'Free', status: 'available', runs: 0 },
  { name: 'TikTok', category: 'Social', description: 'Short video platform', license: 'Free', status: 'available', runs: 0 },
  { name: 'YouTube', category: 'Media', description: 'Video platform', license: 'Free', status: 'available', runs: 0 },
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


export const EXAMPLE_QUERY = 'johndoe_92'

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

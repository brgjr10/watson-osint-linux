const KEY = 'watson:history'

export interface HistoryItem {
  q: string
  time: string
  ts: number
}

export interface HistoryGroup {
  day: string
  items: HistoryItem[]
}

function load(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function save(items: HistoryItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, 200)))
  } catch {}
}

export function clearHistory() { try { localStorage.removeItem(KEY) } catch {} }
export function addHistory(q: string) {
  const query = q.trim()
  if (!query) return
  const items = load()
  const filtered = items.filter((i) => i.q.toLowerCase() !== query.toLowerCase())
  filtered.unshift({ q: query, time: formatTime(new Date()), ts: Date.now() })
  save(filtered)
}

export function getHistory(): HistoryGroup[] {
  const items = load()
  const now = new Date()
  const today = startOfDay(now)
  const yesterday = startOfDay(new Date(now.getTime() - 86400000))
  const groups: HistoryGroup[] = []
  
  const todayItems = items.filter(i => startOfDay(new Date(i.ts)).getTime() === today.getTime())
  if (todayItems.length) groups.push({ day: 'Today', items: todayItems.map(i => ({...i, time: new Date(i.ts).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})})) })
  
  const yesterdayItems = items.filter(i => startOfDay(new Date(i.ts)).getTime() === yesterday.getTime())
  if (yesterdayItems.length) groups.push({ day: 'Yesterday', items: yesterdayItems.map(i => ({...i, time: new Date(i.ts).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})})) })
  
  const weekItems = items.filter(i => {
    const d = startOfDay(new Date(i.ts))
    return d.getTime() < yesterday.getTime()
  })
  if (weekItems.length) groups.push({ day: 'Last week', items: weekItems.slice(0, 20).map(i => {
    const d = new Date(i.ts)
    return {...i, time: d.toLocaleDateString([], {month:'short', day:'numeric'})}
  }) })
  
  return groups
}

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0,0,0,0)
  return x
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})
}

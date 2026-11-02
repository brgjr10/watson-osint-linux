import { useState, useEffect } from 'react'
import { Plus } from '@phosphor-icons/react'
import { tools } from '../../data/mock'

const categories = ['All', 'Infrastructure', 'Identity', 'Corporate', 'Web & archive', 'Threat intel', 'Code']

export default function Toolkit() {
  const [cat, setCat] = useState('All')
  const [q, setQ] = useState('')
  const [statuses, setStatuses] = useState<Record<string,string>>({})
  const [custom, setCustom] = useState<any[]>([])
  const handleAddCustom = () => {
    const name = window.prompt('Source name')
    if (!name) return
    const cmd = window.prompt('Command to run (binary name)') || name
    setCustom((c) => [...c, { name, category: 'Custom', description: cmd, license: 'Custom', status: 'available' }])
  }
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const next: Record<string,string> = {}
      for (const t of tools as any[]) {
        const bin = t.name.toLowerCase().replace(/[^a-z0-9]/g,'')
        let connected = false
        try { connected = await (window as any).api?.checkBinary?.(bin) } catch {}
        next[t.name] = connected ? 'connected' : (t.status === 'beta' ? 'beta' : 'available')
      }
      if (!cancelled) setStatuses(next)
    })()
    return () => { cancelled = true }
  }, [])
  const list = [...(tools as any[]), ...custom].filter((t: any) => (cat === 'All' || t.category === cat) && t.name.toLowerCase().includes(q.toLowerCase()))
  const connected = tools.filter((t: any) => (statuses[t.name] || t.status) === 'connected').length
  const total = tools.length

  const handleConnect = async (name: string) => {
    const val = window.prompt(`Connection string for ${name} (API key, binary path, or token)`)
    if (val) await (window as any).api?.setApiKey?.(name, val)
    const bin = name.toLowerCase().replace(/[^a-z0-9]/g,'')
    const ok = await (window as any).api?.checkBinary?.(bin)
    setStatuses((prev) => ({ ...prev, [name]: ok ? 'connected' : (prev[name] || 'available') }))
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-16 pt-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-semibold leading-[1.1] tracking-[-0.02em]">Sources</h1>
          <p className="mt-1 text-[15px] text-fog">{connected} of {total} sources connected. Watson picks the right ones for each search automatically.</p>
        </div>
        <button onClick={handleAddCustom} className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-[13px] text-paper-dim hover:text-paper">
          <Plus className="size-4" /> Add custom source
        </button>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter sources"
          className="rounded-lg border border-white/[0.08] bg-ink-900 px-3 py-1.5 text-[13px] outline-none"
        />
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full px-3 py-1.5 text-[13px] ${c === cat ? 'bg-white/15 text-paper' : 'text-fog hover:bg-white/5 hover:text-paper'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {list.length > 0 ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t: any) => (
            <div key={t.name} className="rounded-lg border border-white/[0.08] bg-ink-900/60 p-4">
              <div className="flex items-center justify-between">
                <div className="text-[15px] font-medium">{t.name}</div>
                <span className={`rounded-full px-2 py-0.5 text-[11px] ${(statuses[t.name] || t.status) === 'connected' ? 'bg-emerald-400/10 text-emerald-300' : (statuses[t.name] || t.status) === 'beta' ? 'bg-amber-400/10 text-amber-300' : 'bg-white/10 text-fog'}`}>
                  {statuses[t.name] || t.status}
                </span>
              </div>
              <div className="mt-1 text-[13px] text-fog">{t.description}</div>
              <div className="mt-3 text-[12px] text-fog-dim">{t.category} · {t.license}</div>
              <button onClick={() => handleConnect(t.name)} className="mt-3 rounded-md border border-white/10 px-2 py-1 text-[12px] text-paper-dim hover:text-paper">Connect</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-16 text-center">
          <p className="font-medium">No sources match “{q}”</p>
          <button onClick={() => { setQ(''); setCat('All') }} className="mt-3 rounded-lg border border-white/10 px-3 py-2 text-[13px] text-paper-dim hover:text-paper">
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}

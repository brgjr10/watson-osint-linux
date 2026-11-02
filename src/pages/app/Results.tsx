import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CaretRight as ChevronRight, DownloadSimple as Download, Sparkle as Sparkles, X } from '@phosphor-icons/react'
import { BrandIcon } from '../../components/BrandIcon'
import { GlassLens } from '../../components/GlassLens'
import { detectKind, searchProfiles, type FoundProfile, type PlatformGroup } from '../../data/mock'
import { kindMeta } from './Search'
import { addHistory } from '../../lib/history'

const stages = ['Checking social networks', 'Checking forums', 'Checking developer sites', 'Checking games and media', 'Putting it together']
const groups: ('All' | PlatformGroup)[] = ['All', 'Social', 'Dev', 'Gaming', 'Forums', 'Media']

export default function Results() {
  const [params] = useSearchParams()
  const q = params.get('q') ?? ''
  const meta = kindMeta[detectKind(q)]
  const [progress, setProgress] = useState(0)
  const [filter, setFilter] = useState<(typeof groups)[number]>('All')

  const [profiles, setProfiles] = useState<FoundProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<FoundProfile | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (q) {
      try { addHistory(q) } catch {}
    }
    setProgress(0)
    setLoading(true)
    setProfiles([])
    const start = Date.now()
    const t = setInterval(() => {
      const elapsed = Date.now() - start
      // simulate progress that goes to ~95% over 30s, then waits for real result
      const p = Math.min(95, Math.floor((elapsed / 30000) * 95))
      setProgress(p > 0 ? p : 1)
    }, 250)
    searchProfiles(q).then((res) => {
      clearInterval(t)
      setProgress(100)
      setTimeout(() => {
        setProfiles(Array.isArray(res) ? res : [])
        setLoading(false)
      }, 150)
    }).catch((e:any) => {
      clearInterval(t)
      setProgress(100)
      setError(String(e?.message||e||'lookup failed'))
      setTimeout(() => {
        setProfiles([])
        setLoading(false)
      }, 150)
    })
    return () => clearInterval(t)
  }, [q])

  const done = !loading
  const stage = Math.min(stages.length - 1, Math.floor(progress / (100 / stages.length)))
  const visible = profiles
  const list = visible.filter((p: FoundProfile) => filter === 'All' || p.group === filter)
  const same = profiles.filter((p: FoundProfile) => p.match === 'exact').length

  useEffect(() => {
    if (done && progress < 100) {
      setProgress(100)
    }
  }, [done, progress])

  return (
    <div className="mx-auto max-w-[760px] px-5 pb-16 pt-8">
      {/* Header */}
      <div className="flex items-center gap-5">
        <div className="-m-4 shrink-0">
          <GlassLens size={64} active={!done} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[13px] text-fog">
            <meta.icon className="size-3.5" /> {meta.label}
          </div>
          <h1 className="mt-0.5 break-all text-[28px] font-semibold leading-[1.2] tracking-[-0.02em]">{q}</h1>
        </div>
      </div>

      <p role="status" className="sr-only">
        {done ? (profiles.length ? `Found on ${profiles.length} sites` : 'Nothing found') : 'Searching'}
      </p>

      {/* Status */}
      {!done ? (
        <div className="mt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 text-[15px]">
            <span>Searching…</span>
            <span className="tabular-nums text-fog">Searching…</span>
          </div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.08]">
            <div className="h-full rounded-full bg-gas-400 transition-[width] duration-50" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : profiles.length === 0 ? (
        <section className="animate-fade-up mt-8 rounded-2xl border border-transparent bg-ink-850 p-5 ring-1 ring-white/[0.06]">
          <h2 className="text-[17px] font-semibold">Nothing found on public sites</h2>
          <p className="mt-1.5 text-[15px] leading-relaxed text-fog">
            Check the spelling, or try a different nickname, email, phone number or website.
            For phone lookups, connect a provider in Sources.
            {error && <span className="block mt-2 text-risk">Error: {error}</span>}
          </p>
          <button onClick={() => window.location.reload()} className="mt-4 rounded-lg border border-white/10 px-3 py-1.5 text-[13px] text-paper-dim hover:text-paper">Retry</button>
        </section>
      ) : (
        <section className="animate-fade-up mt-8 rounded-2xl border border-transparent bg-ink-850 p-5 ring-1 ring-white/[0.06]">
          <h2 className="flex items-center gap-2 text-[13px] font-semibold text-gas-400">
            <Sparkles className="size-4" /> What Watson found
          </h2>
          <p className="mt-2.5 text-[17px] leading-[1.5] text-paper">
            This {meta.label.toLowerCase()} is used on <b className="font-semibold">{profiles.length} public sites</b>.
            {' '}
            {same === profiles.length
              ? 'All of them look like the same person.'
              : same === 0
                ? 'None are confirmed to be the same person.'
                : `${same} look like the same person, ${profiles.length - same} are name matches only.`}
          </p>
          {(() => {
            const avatar = profiles.map((p:any)=>p.avatar).find(Boolean)
            const names = Array.from(new Set(profiles.map((p:any)=>p.name).filter(Boolean)))
            const bios = profiles.map((p:any)=>p.bio).filter(Boolean).slice(0,1)
            const locs = Array.from(new Set(profiles.map((p:any)=>p.location).filter(Boolean)))
            const links = Array.from(new Set(profiles.flatMap((p:any)=>p.links||[])))
            if (!names.length && !bios.length && !locs.length && !links.length) return null
            return (
              <div className="mt-4 space-y-1 text-[13px] text-fog">
                {avatar && <img src={avatar} alt="" className="mb-2 size-12 rounded-full" />}
                {names.length>0 && <div><b className="text-paper">Name:</b> {names.join(', ')}</div>}
                {bios.length>0 && <div><b className="text-paper">Bio:</b> {bios[0]}</div>}
                {locs.length>0 && <div><b className="text-paper">Location:</b> {locs.join(', ')}</div>}
                {links.length>0 && (
                  <div>
                    <b className="text-paper">Links:</b>
                    <div className="mt-1 flex flex-col gap-0.5">
                      {links.slice(0,5).map((l) => (
                        <a key={l} href={l} target="_blank" rel="noreferrer" className="break-all text-gas-400 hover:underline">{l}</a>
                      ))}
                    </div>
                  </div>
                )}
                {(() => {
                  const emails = Array.from(new Set(profiles.flatMap((p:any)=>p.emails||[])))
                  const phones = Array.from(new Set(profiles.flatMap((p:any)=>p.phones||[])))
                  if (!emails.length && !phones.length) return null
                  return (
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {emails.length>0 && (
                        <div className="rounded-lg border border-white/[0.06] p-2.5">
                          <div className="text-[11px] uppercase tracking-wide text-fog mb-1">Emails</div>
                          <div className="text-[13px] break-all">{emails.join(', ')}</div>
                        </div>
                      )}
                      {phones.length>0 && (
                        <div className="rounded-lg border border-white/[0.06] p-2.5">
                          <div className="text-[11px] uppercase tracking-wide text-fog mb-1">Phones</div>
                          <div className="text-[13px] break-all">{phones.join(', ')}</div>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )
          })()}
          <div className="mt-5 flex flex-wrap gap-2.5">
            <button onClick={() => window.print()} className="flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[15px] font-medium text-black transition-colors hover:bg-white/85">
              <Download className="size-4" /> Save as PDF
            </button>
            <button onClick={() => navigator.clipboard?.writeText(profiles.map(p=>p.site+' '+p.url).join('\n'))} className="flex h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-[15px] font-medium text-paper transition-colors hover:bg-white/5">
              Copy
            </button>
            <button onClick={() => {
              const emails = Array.from(new Set(profiles.flatMap((p:any)=>p.emails||[])))
              const phones = Array.from(new Set(profiles.flatMap((p:any)=>p.phones||[])))
              const names = Array.from(new Set(profiles.map((p:any)=>p.name).filter(Boolean)))
              const txt = `Query: ${q}\nNames: ${names.join(', ')}\nEmails: ${emails.join(', ')}\nPhones: ${phones.join(', ')}\nSites: ${profiles.length}`
              navigator.clipboard?.writeText(txt)
            }} className="flex h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-[15px] font-medium text-paper transition-colors hover:bg-white/5">
              Copy dossier
            </button>
            <button onClick={async () => {
              try {
                const cases = await (window as any).api?.loadCases?.() || []
                cases.unshift({ id: 'case-'+Date.now(), title: q, target: q, kind: detectKind(q), purpose: 'OSINT search', status: 'running', entities: profiles.length, updated: new Date().toISOString().slice(0,10), owner: 'Watson' })
                await (window as any).api?.saveCases?.(cases)
              } catch {}
            }} className="flex h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-[15px] font-medium text-paper transition-colors hover:bg-white/5">
              Save case
            </button>
            <button onClick={() => {
              const blob = new Blob([JSON.stringify(profiles, null, 2)], { type: 'application/json' })
              const u = URL.createObjectURL(blob)
              const a = document.createElement('a'); a.href = u; a.download = `${q}-watson.json`; a.click(); URL.revokeObjectURL(u)
            }} className="flex h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-[15px] font-medium text-paper transition-colors hover:bg-white/5">
              <Download className="size-4" /> Export JSON
            </button>
            <button onClick={() => {
              const rows = ['site,group,match,detail,url']
              for (const p of profiles) rows.push(`"${p.site}","${p.group}","${p.match}","${p.detail}","${p.url||''}"`)
              const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
              const u = URL.createObjectURL(blob)
              const a = document.createElement('a'); a.href = u; a.download = `${q}-watson.csv`; a.click(); URL.revokeObjectURL(u)
            }} className="flex h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-[15px] font-medium text-paper transition-colors hover:bg-white/5">
              <Download className="size-4" /> Export CSV
            </button>
          </div>
        </section>
      )}

      {/* Filters: bleed to the window edge so a cut-off chip shows there is more. */}
      {!(done && profiles.length === 0) && (
        <div className="-mx-5 mt-8 overflow-x-auto px-5 py-1">
          <div className="inline-flex rounded-[10px] bg-white/[0.07] p-0.5" aria-label="Filter by type" role="group">
            {groups.map((g) => {
              const n = g === 'All' ? visible.length : visible.filter((p: FoundProfile) => p.group === g).length
              const on = g === filter
              return (
                <button
                  key={g}
                  aria-pressed={on}
                  onClick={() => setFilter(g)}
                  className={`h-8 whitespace-nowrap rounded-[8px] px-3.5 text-[13px] font-medium transition-colors focus-visible:-outline-offset-3 ${
                    on ? 'bg-ink-600 text-paper shadow-[0_1px_3px_rgba(0,0,0,0.4)]' : 'text-fog hover:text-paper'
                  }`}
                >
                  {g} <span className="tabular-nums text-paper-dim">{n}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Connections */}
      {done && profiles.length > 0 && (
        (() => {
          const allConns: Array<{type:string,value:string,source?:string,site?:string}> = []
          for (const p of profiles) {
            if (p.connections) {
              for (const c of p.connections) {
                allConns.push({...c, site: p.site})
              }
            }
            if (p.emails) for (const e of p.emails) allConns.push({type:'email', value:e, site:p.site})
            if (p.phones) for (const ph of p.phones) allConns.push({type:'phone', value:ph, site:p.site})
          }
          const uniq = Array.from(new Map(allConns.map(c=>[c.type+':'+c.value,c])).values())
          if (uniq.length === 0) return null
          return (
            <section className="mt-6 rounded-2xl border border-transparent bg-ink-850 p-5 ring-1 ring-white/[0.06]">
              <h2 className="text-[15px] font-semibold">Connections</h2>
              <p className="mt-1 text-[13px] text-fog">Connected data found across results</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {uniq.map((c, idx) => (
                  <div key={idx} className="rounded-lg border border-white/[0.06] p-3">
                    <div className="text-[12px] text-fog capitalize">{c.type}</div>
                    <div className="text-[14px] break-all">{c.value}</div>
                    {c.source && <div className="text-[11px] text-fog-dim mt-1">From {c.source}</div>}
                    {c.site && <div className="text-[11px] text-fog-dim">Seen on {c.site}</div>}
                  </div>
                ))}
              </div>
            </section>
          )
        })()
      )}
      {list.length > 0 && (
        <ul className="mt-4 overflow-hidden rounded-2xl border border-transparent bg-ink-850 ring-1 ring-white/[0.06]">
          {list.map((p, i) => (
            <li key={p.site} className={done ? undefined : 'animate-fade-up'}>
              <button onClick={() => setSelected(p)} className="group flex w-full items-center gap-3.5 px-4 py-3 text-left transition-colors hover:bg-white/[0.04] focus-visible:-outline-offset-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-white/[0.07] ring-1 ring-white/[0.06]">
                  <BrandIcon site={p.site} className="size-5 text-paper" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-[15px] font-medium">{p.site}</span>
<span className="block break-words text-[13px] text-fog">
                    {p.detail}{p.since ? `, since ${p.since}` : ''}
                  </span>
                </span>
                <span className={`shrink-0 text-[13px] ${p.match === 'exact' ? 'text-paper' : 'text-paper-dim'}`}>
                  {p.match === 'exact' ? 'Same person' : 'Name match'}
                </span>
                <ChevronRight className="size-4 shrink-0 text-fog transition-colors group-hover:text-paper" />
              </button>
              {i < list.length - 1 && <div className="ml-[70px] h-px bg-white/[0.07]" />}
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] bg-ink-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-[10px] bg-white/[0.07] ring-1 ring-white/[0.06]">
                  <BrandIcon site={selected.site} className="size-5 text-paper" />
                </span>
                <div>
                  <div className="text-[16px] font-medium">{selected.site}</div>
                  <div className="text-[13px] text-fog">{selected.group} · {selected.match === 'exact' ? 'Same person' : 'Name match'}</div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="grid size-8 place-items-center rounded-lg hover:bg-white/[0.06]">
                <X className="size-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-5 py-4 space-y-4">
              <div>
                <div className="text-[13px] font-medium text-fog mb-1">Details</div>
                <div className="text-[14px]">{selected.detail}</div>
                <div className="mt-1 text-[13px] text-fog">{selected.since ? `Since ${selected.since}` : ''}</div>
              </div>
              {selected.username && (
                <div>
                  <div className="text-[13px] font-medium text-fog mb-1">Username</div>
                  <div className="text-[14px]">{selected.username}</div>
                </div>
              )}
              {selected.name && (
                <div>
                  <div className="text-[13px] font-medium text-fog mb-1">Name</div>
                  <div className="text-[14px]">{selected.name}</div>
                </div>
              )}
              {selected.bio && (
                <div>
                  <div className="text-[13px] font-medium text-fog mb-1">Bio</div>
                  <div className="text-[14px] whitespace-pre-wrap">{selected.bio}</div>
                </div>
              )}
              {selected.location && (
                <div>
                  <div className="text-[13px] font-medium text-fog mb-1">Location</div>
                  <div className="text-[14px]">{selected.location}</div>
                </div>
              )}
              {selected.emails && selected.emails.length > 0 && (
                <div>
                  <div className="text-[13px] font-medium text-fog mb-1">Emails</div>
                  <div className="space-y-1">
                    {selected.emails.map((e) => (<div key={e} className="text-[14px]">{e}</div>))}
                  </div>
                </div>
              )}
              {selected.phones && selected.phones.length > 0 && (
                <div>
                  <div className="text-[13px] font-medium text-fog mb-1">Phones</div>
                  <div className="space-y-1">
                    {selected.phones.map((p) => (<div key={p} className="text-[14px]">{p}</div>))}
                  </div>
                </div>
              )}
              {selected.links && selected.links.length > 0 && (
                <div>
                  <div className="text-[13px] font-medium text-fog mb-1">Links</div>
                  <div className="space-y-1">
                    {selected.links.map((l) => (<a key={l} href={l} target="_blank" rel="noreferrer" className="block text-[14px] text-gas-400 hover:underline break-all">{l}</a>))}
                  </div>
                </div>
              )}
              {selected.url && (
                <a href={selected.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-[13px] hover:bg-white/15">
                  Open profile <ChevronRight className="size-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

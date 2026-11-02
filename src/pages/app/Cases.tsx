import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function Cases() {
  const [cases, setCases] = useState<any[]>([])
  useEffect(() => { (window as any).api?.loadCases?.().then((r:any) => { if (Array.isArray(r)) setCases(r) }).catch(()=>{}) }, [])
  return (
    <div className="mx-auto max-w-[760px] px-5 pb-16 pt-8">
      <h1 className="text-[34px] font-semibold leading-[1.1] tracking-[-0.02em]">Cases</h1>
      <p className="mt-1 text-[15px] text-fog">Saved investigations on this computer.</p>
      {cases.length === 0 ? (
        <div className="mt-16 text-center text-fog"><p>No cases yet</p></div>
      ) : (
        <ul className="mt-8 space-y-2">
          {cases.map((c:any) => (
            <li key={c.id}>
              <Link to={`/app/case/${c.id}`} className="block rounded-xl border border-white/[0.06] bg-ink-850 p-4 hover:bg-white/[0.04]">
                <div className="text-[15px] font-medium">{c.title}</div>
                <div className="text-[13px] text-fog">{c.target} · {c.status} · {c.entities} entities</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <button onClick={async () => { await (window as any).api?.saveCases?.([]); setCases([]) }} className="mt-4 rounded-lg border border-white/10 px-3 py-1.5 text-[13px] text-paper-dim hover:text-paper">Clear cases</button>
    </div>
  )
}

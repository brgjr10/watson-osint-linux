import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  ArrowUp,
  Check,
  Copy,
  DownloadSimple as Download,
  GitFork,
  ArrowsOut as Maximize2,
  Minus,
  Plus,
  Scales as Scale,
  Sparkle as Sparkles,
  Crosshair as Target,
  FilePlus as FilePlus2,
} from '@phosphor-icons/react'
import { LogoMark } from '../../components/Logo'
import { EvidenceGraph, RiskMark, kindIcon } from '../../components/EvidenceGraph'
import { agentSteps, caseGraph } from '../../data/mock'
import type { CaseRow } from '../../data/mock'

const statusStyle: Record<CaseRow['status'], string> = {
  running: 'bg-gas-400/15 text-gas-300',
  review: 'bg-violet/15 text-violet',
  monitoring: 'bg-signal/15 text-signal',
  closed: 'bg-white/[0.08] text-fog',
}

const riskNote = {
  high: 'Needs attention. Open the evidence below to see why.',
  medium: 'Worth a look, but not urgent.',
  low: '',
}

const answerActions = [
  ['Copy answer', Copy],
  ['Add to report', FilePlus2],
  ['Start a new case from here', GitFork],
] as const

const zoomActions = [
  ['Zoom in', Plus],
  ['Zoom out', Minus],
  ['Center on selected', Target],
  ['Full screen', Maximize2],
] as const

export default function CaseView() {
  const { id } = useParams()
  const [cases, setCases] = useState<any[]>([])
  useEffect(() => { (window as any).api?.loadCases?.().then((r:any) => { if(Array.isArray(r)) setCases(r) }).catch(()=>{}) }, [])
  const c = (cases.length ? (cases.find((x:any)=>x.id===id) ?? cases[0]) : { id, title:'Case', target:'', kind:'person', purpose:'', status:'running', entities:0, updated:'', owner:'' })
  const [selected, setSelected] = useState('sub1')
  const node = caseGraph.nodes.find((n: any) => n.id === selected)
  if (!node) {
    return (
      <div className="mx-auto max-w-[760px] px-5 pb-16 pt-8">
        <h1 className="text-[28px] font-semibold">Case not available</h1>
        <p className="mt-2 text-[15px] text-fog">No case data available.</p>
      </div>
    )
  }
  const NodeIcon = (kindIcon as any)[node.kind]

  return (
    <div className="flex flex-col xl:h-full">
      {/* Case header */}
      <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-5 py-3.5">
        <span className="font-mono text-xs text-fog">{c.id}</span>
        <h1 className="text-[15px] font-medium">{c.title}</h1>
        <span className={`rounded-full px-2 py-0.5 text-[11px] capitalize ${statusStyle[c.status as keyof typeof statusStyle]}`}>{c.status}</span>
        <span className="flex items-center gap-1.5 rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-fog">
          <Scale className="size-3" /> {c.purpose}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <button className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-white/85">
            <Download className="size-3.5" /> Save as PDF
          </button>
        </div>
      </div>

      <div className="grid flex-1 xl:min-h-0 xl:grid-cols-[280px_minmax(0,1fr)_260px] 2xl:grid-cols-[320px_minmax(0,1fr)_300px]">
        {/* Thread */}
        <div className="flex flex-col border-white/[0.06] xl:min-h-0 xl:border-r">
          <div className="scrollbar-thin flex-1 space-y-5 overflow-y-auto overscroll-contain p-4">
            <div className="ml-6 rounded-xl rounded-tr-sm bg-white/[0.06] px-3.5 py-2.5 text-[13px] text-paper">
              {c.purpose || 'No case purpose set.'}
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs text-fog">
                <LogoMark size={16} /> Watson
                <span>{agentSteps.length} sources checked</span>
              </div>
              <div className="mt-3 space-y-2">
                {agentSteps.map((s) => (
                  <div key={s.tool} className="flex items-center gap-2 rounded-lg border border-white/5 bg-ink-900/60 px-2.5 py-1.5">
                    <Check className="size-3 text-evidence" />
                    <span className="text-[13px] text-paper/85">{s.tool}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-3 text-[13px] leading-relaxed text-paper-dim">
                <p>
                  <span className="text-paper">Summary.</span> {c.title ? `Analysis for ${c.title}.` : 'No analysis has run yet.'}
                </p>
              </div>
              <div className="mt-3 flex gap-1">
                {answerActions.map(([label, I]) => (
                  <button
                    key={label}
                    aria-label={label}
                    title={label}
                    className="grid size-7 place-items-center rounded-md text-fog hover:bg-white/5 hover:text-paper"
                  >
                    <I className="size-3.5" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-[13px] font-semibold text-fog">Try next</h2>
              {['Check lookalike domains', 'Find employees with public profiles', 'Compare with last month’s check'].map((s) => (
                <button
                  key={s}
                  className="flex w-full items-center gap-2 rounded-lg border border-white/[0.08] px-3 py-2 text-left text-xs text-paper-dim transition-colors hover:border-gas-400/40 hover:text-paper"
                >
                  <Sparkles className="size-3.5 shrink-0 text-gas-400" /> {s}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-white/[0.06] p-3">
            <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-ink-900 p-2 focus-within:ring-2 focus-within:ring-gas-400/70">
              <textarea
                rows={1}
                aria-label="Ask a follow-up question"
                placeholder="Ask a follow-up…"
                className="flex-1 resize-none bg-transparent px-1.5 py-1 text-[13px] outline-none placeholder:text-fog"
              />
              <button aria-label="Send" className="grid size-7 place-items-center rounded-md bg-white text-black">
                <ArrowUp className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Graph canvas */}
        <div className="dot-grid relative min-h-[560px] overflow-hidden">
          <div className="scrollbar-thin absolute inset-0 overflow-auto overscroll-contain">
            <div className="relative h-full min-h-[560px] min-w-[480px] px-10 pb-16 pt-16">
              <EvidenceGraph nodes={caseGraph.nodes} edges={caseGraph.edges} selected={selected} onSelect={setSelected} showEdgeLabels />
            </div>
          </div>
          <div className="absolute right-4 top-4 z-10 flex flex-col overflow-hidden rounded-lg border border-white/[0.08] bg-ink-900/80 backdrop-blur">
            {zoomActions.map(([label, I]) => (
              <button
                key={label}
                aria-label={label}
                title={label}
                className="grid size-8 place-items-center text-fog hover:bg-white/5 hover:text-paper focus-visible:-outline-offset-3"
              >
                <I className="size-3.5" />
              </button>
            ))}
          </div>
          <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-3 rounded-lg border border-white/[0.08] bg-ink-900/80 px-3 py-2 text-[11px] text-fog backdrop-blur">
            <span className="flex items-center gap-1.5">
              <RiskMark risk="high" /> High risk
            </span>
            <span className="flex items-center gap-1.5">
              <RiskMark risk="medium" /> Medium risk
            </span>
            <span>{caseGraph.nodes.length} of {caseGraph.nodes.length} shown</span>
          </div>
        </div>

        {/* Inspector */}
        <div className="scrollbar-thin border-white/[0.06] p-5 xl:min-h-0 xl:overflow-y-auto xl:overscroll-contain xl:border-l">
          <h2 className="text-[13px] font-semibold text-fog">Selected</h2>
          <div className="mt-3 flex items-start gap-3">
            <span
              className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                node.risk === 'high' ? 'bg-risk/15 text-risk' : node.root ? 'bg-white text-black' : 'bg-white/[0.08] text-paper-dim'
              }`}
            >
              <NodeIcon className="size-5" />
            </span>
            <div className="min-w-0">
              <div className="break-all font-mono text-[13px] text-paper">{node.label}</div>
              <div className="mt-1 text-xs capitalize text-fog">{node.kind}</div>
            </div>
          </div>

          {node.risk && node.risk !== 'low' && (
            <div
              className={`mt-5 flex items-center gap-2 rounded-xl border p-3.5 text-[13px] font-medium ${
                node.risk === 'high' ? 'border-risk/25 bg-risk/5 text-risk' : 'border-caution/25 bg-caution/5 text-caution'
              }`}
            >
              <RiskMark risk={node.risk} />
              {node.risk === 'high' ? 'High risk' : 'Medium risk'}
            </div>
          )}

          {node.risk && node.risk !== 'low' && (
            <p className="mt-5 text-[13px] leading-relaxed text-paper-dim">{riskNote[node.risk as keyof typeof riskNote]}</p>
          )}

          <dl className="mt-5 divide-y divide-white/[0.06] rounded-xl border border-transparent bg-ink-850 ring-1 ring-white/[0.06]">
            <div className="flex justify-between gap-3 px-3.5 py-2.5 text-xs">
              <dt className="text-fog">Type</dt>
              <dd className="text-right text-paper/90 capitalize">{node.kind}</dd>
            </div>
            <div className="flex justify-between gap-3 px-3.5 py-2.5 text-xs">
              <dt className="text-fog">Linked items</dt>
              <dd className="text-right text-paper/90">
                {caseGraph.edges.filter((e: any) => e.from === selected || e.to === selected).length}
              </dd>
            </div>
          </dl>

          <h2 className="mt-5 text-[13px] font-semibold text-fog">Evidence</h2>
          <ol className="mt-2 space-y-1.5">
            <li className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-xs">
              <span className="tabular-nums text-gas-400">[1]</span>
              <span className="text-paper-dim">WHOIS / RDAP</span>
            </li>
          </ol>

          <div className="mt-6 grid grid-cols-2 gap-2">
            <button className="rounded-lg border border-white/10 py-2 text-xs text-paper-dim hover:text-paper">Search from here</button>
            <button className="rounded-lg bg-white/10 py-2 text-xs text-paper hover:bg-white/15">Add to report</button>
          </div>
        </div>
      </div>
    </div>
  )
}

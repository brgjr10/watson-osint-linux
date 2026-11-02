export default function Help() {
  return (
    <div className="mx-auto max-w-[760px] px-5 pb-16 pt-8">
      <h1 className="text-[34px] font-semibold leading-[1.1] tracking-[-0.02em]">Help</h1>
      <p className="mt-1 text-[15px] text-fog">How to use Watson.</p>
      <div className="mt-8 space-y-4 text-[15px] leading-relaxed">
        <p><b>Search:</b> Enter a nickname, email, phone, website, or company. Watson detects the type automatically.</p>
        <p><b>Sources:</b> Connect providers in Sources for deeper lookups (Shodan, VirusTotal, Hunter.io need API keys).</p>
        <p><b>Export:</b> Save results as PDF, JSON, or CSV from the Results page.</p>
        <p><b>Shortcuts:</b> Ctrl+K / Cmd+K opens Quick find. Escape closes dialogs.</p>
        <p><b>Privacy:</b> No account, no tracking. History and cases stay on this computer.</p>
      </div>
    </div>
  )
}

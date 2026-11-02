const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron')
const { spawn, execFileSync } = require('node:child_process')
const path = require('node:path')
const fs = require('node:fs')

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: 'Watson',
    backgroundColor: '#05070C',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: { contextIsolation: true, sandbox: false, preload: path.join(__dirname, 'preload.cjs') },
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  win.once('ready-to-show', () => win.show())
  win.loadFile(path.join(__dirname, '..', 'dist', 'app.html'), { hash: '/app' })
}

Menu.setApplicationMenu(
  Menu.buildFromTemplate([
    ...(process.platform === 'darwin' ? [{ role: 'appMenu' }] : []),
    { role: 'editMenu' },
    { role: 'viewMenu' },
  ]),
)

function runCmd(cmd, args, timeoutMs) {
  return new Promise((resolve) => {
    let out = '', err = ''
    const p = spawn(cmd, args, { shell: false })
    const t = setTimeout(() => { try { p.kill('SIGKILL') } catch {} }, timeoutMs)
    p.stdout.on('data', (d) => { out += d })
    p.stderr.on('data', (d) => { err += d })
    p.on('close', () => { clearTimeout(t); resolve({ out, err }) })
    p.on('error', (e) => { clearTimeout(t); resolve({ out, err: String(e) }) })
  })
}

function extractAll(text) {
  const urls = text.match(/https?:\/\/[^\s\)\]\"]+/gi) || []
  const emails = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []
  const phones = []
  const phonePatterns = [
    /\+\d{1,3}[\s.-]?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g,
    /\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/g,
    /\b\d{3}[\s.-]\d{3}[\s.-]\d{4}\b/g
  ]
  for (const p of phonePatterns) {
    const m = text.match(p) || []
    for (const x of m) {
      const digits = x.replace(/\D/g,'')
      if(digits.length >= 10 && digits.length <= 15 && !(digits.startsWith('20') && digits.length === 4)) {
        if(x.includes('+') || digits.length === 10) phones.push(x.trim())
      }
    }
  }
  return { 
    urls, 
    emails: Array.from(new Set(emails)), 
    phones: Array.from(new Set(phones)) 
  }
}

function categorizeSite(site) {
  const s = site.toLowerCase()
  if (/github|gitlab|stackoverflow|dev\.to|npm|docker/.test(s)) return 'Dev'
  if (/reddit|4chan|habr|forum/.test(s)) return 'Forums'
  if (/steam|twitch|xbox|psn|chess\.com/.test(s)) return 'Gaming'
  if (/youtube|soundcloud|medium|pinterest|imgur/.test(s)) return 'Media'
  return 'Social'
}

const NO_SETUP = new Set(['waybackmachine','crtsh','wayback machine','WaybackMachine','crt.sh','Wayback Machine'])
ipcMain.handle('checkBinary', async (_e, name) => {
  if (NO_SETUP.has(name) || NO_SETUP.has(String(name).toLowerCase().replace(/[^a-z0-9]/g,''))) return true
  const fs = require('node:fs')
  try {
    const data = JSON.parse(fs.readFileSync('/home/brgjr10/.config/watson/keys.json','utf8'))
    if (data && data[name]) return true
  } catch {}
  const candidates = [name, name.toLowerCase()]
  for (const c of candidates) {
    try { execFileSync('which', [c], { stdio: 'ignore' }); return true } catch {}
  }
  const common = ['/usr/bin','/usr/local/bin','/home/brgjr10/.local/bin','/opt']
  for (const dir of common) {
    for (const c of candidates) {
      try { fs.accessSync(require('node:path').join(dir,c)); return true } catch {}
    }
  }
  return false
})


const INSTALL_CMDS = {
  'Maigret': ['python3', ['-m', 'pip', 'install', '--user', 'maigret']],
  'Holehe': ['python3', ['-m', 'pip', 'install', '--user', 'holehe']],
  'Sherlock': ['python3', ['-m', 'pip', 'install', '--user', 'sherlock-project']],
  'WhatsMyName': ['bash', ['-c', 'mkdir -p /home/brgjr10/.local/share/watson && (cd /home/brgjr10/.local/share/watson/WhatsMyName && git pull) || git clone https://github.com/WebBreacher/WhatsMyName.git /home/brgjr10/.local/share/watson/WhatsMyName']],
  'Subfinder': ['bash', ['-c', 'mkdir -p /home/brgjr10/.local/bin && curl -sL https://github.com/projectdiscovery/subfinder/releases/latest/download/subfinder_linux_amd64.zip -o /tmp/subfinder.zip && unzip -o /tmp/subfinder.zip -d /home/brgjr10/.local/bin && chmod +x /home/brgjr10/.local/bin/subfinder']],
  'Amass': null,
}

ipcMain.handle('connectSource', async (_e, name) => {
  const cfg = INSTALL_CMDS[name]
  if (!cfg) return { ok: false, msg: 'No auto-installer; set API key or install manually.' }
  const [cmd, args] = cfg
  const r = await runCmd(cmd, args, 300000)
  return { ok: !r.err, msg: (r.out + r.err).slice(-500) }
})

ipcMain.handle('setApiKey', async (_e, name, key) => {
  const fs = require('node:fs')
  const dir = '/home/brgjr10/.config/watson'
  fs.mkdirSync(dir, { recursive: true })
  const f = dir + '/keys.json'
  let data = {}
  try { data = JSON.parse(fs.readFileSync(f,'utf8')) } catch {}
  data[name] = key
  fs.writeFileSync(f, JSON.stringify(data, null, 2))
  return { ok: true }
})

ipcMain.handle('lookup', async (_e, kind, query) => {
  const results = []
  const seen = new Set()
  const connections = []
  const addResult = (site, group, detail, match='exact', extra={}) => {
    const k = site.toLowerCase()
    if (seen.has(k)) return
    seen.add(k)
    results.push({ site, group, since: extra.since || '', hue: '#58a6ff', detail, match, username: query, ...extra })
  }
  try {
    if (kind === 'username') {
      try {
        const { out } = await runCmd('/home/brgjr10/.local/bin/maigret', [query, '--top-sites', '50', '--timeout', '15'], 120000)
        const combined = out
        const extracted = extractAll(combined)
        for (const e of extracted.emails) if (e.toLowerCase() !== query.toLowerCase()) connections.push({type: 'email', value: e, source: 'maigret'})
        for (const p of extracted.phones) connections.push({type: 'phone', value: p, source: 'maigret'})
        for (const url of extracted.urls) {
          try {
            if (/patreon\.com\/soxoj|googleapis|gstatic|akamai|cloudfront|fbcdn|tiktokcdn|twimg|githubusercontent|sndcdn|rapidproxy/.test(url)) continue
            const u = new URL(url)
            let site = u.hostname.replace(/^www\./,'')
            const map = [['soundcloud','SoundCloud'],['github.com','GitHub'],['gitlab','GitLab'],['reddit.com','Reddit'],['facebook.com','Facebook'],['tiktok.com','TikTok'],['gravatar','Gravatar'],['imgur.com','Imgur'],['snapchat','Snapchat'],['steamcommunity.com','Steam'],['gist.github.com','GitHubGist']]
            for (const [k,v] of map) if (site.includes(k)) { site = v; break }
            if (!map.some(([k])=>site.toLowerCase().includes(k))) {
              const p2 = site.split('.')
              if (p2.length < 2) continue
              site = p2[p2.length-2].charAt(0).toUpperCase() + p2[p2.length-2].slice(1)
            }
            addResult(site, categorizeSite(site), 'username match', 'exact', { url, connections: connections.slice(0,20) })
          } catch {}
        }
      } catch {}
      try {
        const { out: out2 } = await runCmd('/home/brgjr10/.local/bin/sherlock', [query, '--timeout', '10', '--no-color'], 60000)
        const ex2 = extractAll(out2)
        for (const url of ex2.urls) {
          try {
            if (/googleapis|gstatic|akamai|cloudfront|fbcdn|tiktokcdn|twimg|githubusercontent|sndcdn|rapidproxy/.test(url)) continue
            const u = new URL(url)
            let site = u.hostname.replace(/^www\./,'')
            const p2 = site.split('.')
            if (p2.length >= 2 && !/github|reddit|steam|twitch|medium|telegram|pinterest|stackoverflow|chess|soundcloud|habr|docker/.test(site)) {
              site = p2[p2.length-2].charAt(0).toUpperCase() + p2[p2.length-2].slice(1)
            }
            addResult(site, categorizeSite(site), 'username match', 'exact', { url, connections: connections.slice(0,20) })
          } catch {}
        }
      // GitHub user search
      try {
        const { out } = await runCmd('curl', ['-s', '-m', '20', '-H', 'Accept: application/vnd.github+json', `https://api.github.com/users/${encodeURIComponent(query)}`], 30000)
        try {
          const j = JSON.parse(out)
          if (j && j.login) {
            addResult('GitHub', 'Dev', j.bio || 'GitHub profile', 'exact', { url: j.html_url, name: j.name, location: j.location, bio: j.bio, since: j.created_at ? String(j.created_at).slice(0,4) : '' })
            if (j.email) connections.push({type:'email', value:j.email, source:'github'})
            if (j.blog) connections.push({type:'url', value:j.blog, source:'github'})
          }
        } catch {}
      } catch {}
      } catch {}
    } else if (kind === 'email') {
      try {
        const { out } = await runCmd('/home/brgjr10/.local/bin/holehe', [query], 90000)
        for (const line of out.split('\n')) {
          const m = line.match(/\[\+\]\s*(.+)/)
          if (m) {
            const site = m[1].trim()
            if (site) addResult(site, categorizeSite(site), 'email registered', 'likely', { emails: [query], connections: connections.slice(0,20) })
          }
        }
      // HIBP breach check (public, no key for count)
      try {
        const { out } = await runCmd('curl', ['-s', '-m', '20', '-H', 'hibp-api-key: 00000000000000000000000000000000', `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(query)}?truncateResponse=false`], 30000)
        if (out && out.trim().startsWith('[')) {
          try {
            const arr = JSON.parse(out)
            for (const b of (Array.isArray(arr)?arr:[]).slice(0,20)) {
              addResult(b.Name || 'Breach', 'Threat intel', `breached: ${b.Title || b.Name}`, 'likely', { since: b.BreachDate ? String(b.BreachDate).slice(0,4) : '', url: `https://haveibeenpwned.com` })
            }
          } catch {}
        }
      } catch {}
        const ex = extractAll(out)
        for (const e of ex.emails) if (e.toLowerCase() !== query.toLowerCase()) connections.push({type:'email',value:e,source:'holehe'})
        for (const ph of ex.phones) connections.push({type:'phone',value:ph,source:'holehe'})
      } catch {}
    } else if (kind === 'domain') {
      // crt.sh certificate transparency
      try {
        const { out } = await runCmd('curl', ['-s', '-m', '30', `https://crt.sh/?q=%25.${query}&output=json`], 40000)
        let arr = []
        try { arr = JSON.parse(out) } catch {}
        const subs = new Set()
        for (const r of (Array.isArray(arr)?arr:[])) {
          for (const n of String(r.name_value||'').split('\n')) {
            const s = n.trim().toLowerCase()
            if (s && s.endsWith(query.toLowerCase())) subs.add(s)
          }
        }
        for (const s of Array.from(subs).slice(0, 40)) {
          addResult(s, 'Infrastructure', 'certificate transparency', 'exact', { since: '', url: `https://${s}` })
        }
      } catch {}
      // wayback machine availability
      try {
        const { out } = await runCmd('curl', ['-s', '-m', '20', `https://archive.org/wayback/available?url=${encodeURIComponent(query)}`], 30000)
        try {
          const j = JSON.parse(out)
          if (j && j.archived_snapshots && j.archived_snapshots.closest) {
            addResult('Wayback Machine', 'Web & archive', 'historical snapshots available', 'likely', { url: j.archived_snapshots.closest.url })
          }
        } catch {}
      } catch {}
      // WHOIS via rdap
      try {
        const { out } = await runCmd('curl', ['-s', '-m', '20', `https://rdap.org/domain/${encodeURIComponent(query)}`], 30000)
        try {
          const j = JSON.parse(out)
          const ns = (j.nameservers||[]).map(n=>n.ldhName).filter(Boolean)
          if (ns.length) addResult('RDAP/WHOIS', 'Infrastructure', `nameservers: ${ns.slice(0,3).join(', ')}`, 'exact', { url: `https://rdap.org/domain/${query}` })
          if (j.events) {
            const reg = j.events.find(e=>e.eventAction==='registration')
            if (reg) addResult(query, 'Infrastructure', `registered ${String(reg.eventDate).slice(0,10)}`, 'exact', {})
          }
        } catch {}
      } catch {}
    } else if (kind === 'phone') {
      // best-effort: no free reliable API; return empty gracefully
    } else if (kind === 'company') {
      // GLEIF legal entity search (public)
      try {
        const { out } = await runCmd('curl', ['-s', '-m', '20', `https://api.gleif.org/api/v1/lei-records?filter[entity.legalName]=${encodeURIComponent(query)}&page[size]=10`], 30000)
        try {
          const j = JSON.parse(out)
          const data = j && j.data ? j.data : []
          for (const d of data) {
            const name = d?.attributes?.entity?.legalName?.name || query
            addResult(name, 'Corporate', 'legal entity (GLEIF)', 'likely', { url: `https://search.gleif.org/#/record/${d.id}` })
          }
        } catch {}
      } catch {}
    }
  } catch (e) {}
  try { require('node:fs').appendFileSync('/tmp/lookup.log', JSON.stringify({count: results.length, query, kind}) + '\n'); } catch (e) {}
  return results
})

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

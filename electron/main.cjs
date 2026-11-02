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
  try {
    if (kind === 'username') {
      const { out } = await runCmd('/home/brgjr10/.local/bin/maigret', [query, '--top-sites', '100', '--dns-resolver', 'threaded', '-n', '3', '--timeout', '20'], 180000)
      const { out: out2 } = await runCmd('/home/brgjr10/.local/bin/sherlock', [query, '--timeout', '15', '--no-color'], 90000)
      const combined = out + '\n' + out2
      const extracted = extractAll(combined)
      for (const e of extracted.emails) if (e.toLowerCase() !== query.toLowerCase()) connections.push({type: 'email', value: e, source: 'combined'})
      for (const p of extracted.phones) connections.push({type: 'phone', value: p, source: 'combined'})
      const nameMatches = combined.match(/fullname:\s*(.+)/gi) || []
      for (const nm of nameMatches) {
        const v = nm.replace(/fullname:\s*/i,'').trim()
        if (v && v.length > 2 && v.length < 60 && !/[0-9]/.test(v) && !v.includes('http') && !/avatar|image|count|id|uid/i.test(v)) connections.push({type: 'name', value: v, source: 'maigret'})
      }
      for (const url of extracted.urls) {
        try {
          if (/patreon\.com\/soxoj|googleapis|gstatic|akamai|cloudfront|fbcdn|tiktokcdn|twimg|githubusercontent/.test(url)) continue
          const u = new URL(url)
          let site = u.hostname.replace(/^www\./,'')
          if (/soundcloud/.test(site)) site = 'SoundCloud'
          else if (/github\.com/.test(site)) site = 'GitHub'
          else if (/gitlab/.test(site)) site = 'GitLab'
          else if (/reddit\.com/.test(site)) site = 'Reddit'
          else if (/facebook\.com|^fb\.com$/.test(site)) site = 'Facebook'
          else if (/tiktok\.com/.test(site)) site = 'TikTok'
          else if (/gravatar/.test(site)) site = 'Gravatar'
          else if (/imgur\.com/.test(site)) site = 'Imgur'
          else if (/snapchat/.test(site)) site = 'Snapchat'
          else if (/steamcommunity\.com/.test(site)) site = 'Steam'
          else if (/gist\.github\.com/.test(site)) site = 'GitHubGist'
          else if (/sndcdn/.test(site)) continue
          else if (/rapidproxy/.test(site)) continue
          else {
            const p2 = site.split('.')
            if (p2.length < 2) continue
            site = p2[p2.length-2].charAt(0).toUpperCase() + p2[p2.length-2].slice(1)
          }
          const k = site.toLowerCase()
          if (site && !seen.has(k)) {
            seen.add(k)
            const uniqConns = Array.from(new Map(connections.map(c=>[c.type+':'+c.value+':'+site,c])).values()).slice(0, 30)
            results.push({ site, group: categorizeSite(site), since: '', hue: '#58a6ff', detail: 'username match', match: 'exact', url, username: query, connections: uniqConns })
          }
        } catch {}
      }
    } else if (kind === 'email') {
      const { out } = await runCmd('/home/brgjr10/.local/bin/holehe', [query], 90000)
      const extracted = extractAll(out)
      for (const e of extracted.emails) if (e.toLowerCase() !== query.toLowerCase()) connections.push({type: 'email', value: e, source: 'holehe'})
      for (const p of extracted.phones) connections.push({type: 'phone', value: p, source: 'holehe'})
      for (const line of out.split('\n')) {
        const m = line.match(/\[\+\]\s*(.+)/)
        if (m) {
          const site = m[1].trim()
          if (site && !seen.has(site.toLowerCase())) {
            seen.add(site.toLowerCase())
            const uniqConns = Array.from(new Map(connections.map(c=>[c.type+':'+c.value,c])).values()).slice(0, 20)
            results.push({ site, group: categorizeSite(site), since: '', hue: '#58a6ff', detail: 'email registered', match: 'likely', emails: [query], connections: uniqConns })
          }
        }
      }
    }
  } catch (e) {}
  try { fs.appendFileSync('/tmp/lookup.log', JSON.stringify({count: results.length, query, kind}) + '\n'); } catch (e) {}
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

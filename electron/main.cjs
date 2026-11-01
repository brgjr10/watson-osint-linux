const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron')
const { spawn } = require('node:child_process')
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
  const emails = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []
  const phones = text.match(/\+?\d[\d\s().-]{7,}\d/g) || []
  return { urls, emails: Array.from(new Set(emails)), phones: Array.from(new Set(phones)) }
}

function categorizeSite(site) {
  const s = site.toLowerCase()
  if (/github|gitlab|stackoverflow|dev\.to|npm|docker/.test(s)) return 'Dev'
  if (/reddit|4chan|habr|forum/.test(s)) return 'Forums'
  if (/steam|twitch|xbox|psn|chess\.com/.test(s)) return 'Gaming'
  if (/youtube|soundcloud|medium|pinterest|imgur/.test(s)) return 'Media'
  return 'Social'
}

ipcMain.handle('lookup', async (_e, kind, query) => {
  const results = []
  const seen = new Set()
  const connections = []
  try {
    if (kind === 'username') {
      const { out } = await runCmd('/home/brgjr10/.local/bin/maigret', [query, '--top-sites', '30', '--dns-resolver', 'threaded', '-n', '2', '--timeout', '15'], 90000)
      const extracted = extractAll(out)
      for (const e of extracted.emails) if (e.toLowerCase() !== query.toLowerCase()) connections.push({type: 'email', value: e, source: 'maigret'})
      for (const p of extracted.phones) connections.push({type: 'phone', value: p, source: 'maigret'})
      const nameMatches = out.match(/fullname:\s*(.+)/gi) || []
      for (const nm of nameMatches) {
        const v = nm.replace(/fullname:\s*/i,'').trim()
        if (v && v.length > 2 && !v.includes('http')) connections.push({type: 'name', value: v, source: 'maigret'})
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
            const uniqConns = Array.from(new Map(connections.map(c=>[c.type+':'+c.value,c])).values()).slice(0, 20)
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


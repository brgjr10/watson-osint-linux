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

  // Links to the outside world open in the user's browser, not inside the app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  win.once('ready-to-show', () => win.show())
  win.loadFile(path.join(__dirname, '..', 'dist', 'app.html'), { hash: '/app' })
}

// Role menus keep zoom (Ctrl/Cmd +/-/0) and copy/paste shortcuts working;
// autoHideMenuBar keeps the bar itself out of sight on Windows.
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

ipcMain.handle('lookup', async (_e, kind, query) => {
  const results = []
  const seen = new Set()
  try {
    if (kind === 'username') {
      const { out } = await runCmd('timeout', ['30', 'python3', '-m', 'maigret', query, '--top-sites', '50'], 90000)
      const urls = out.match(/https?:\/\/[^\s\)\]\"]+/gi) || []
      for (const url of urls) {
        try {
          const u = new URL(url)
          let site = u.hostname.replace(/^www\./,'')
          if (/patreon|sndcdn|githubusercontent|akamai|cloudfront|fbcdn|tiktokcdn|googleapis|gstatic|twimg/.test(site)) continue
          if (/soundcloud/.test(site)) site = 'SoundCloud'
          else if (/github/.test(site) && !/githubusercontent/.test(site)) site = 'GitHub'
          else if (/gitlab/.test(site)) site = 'GitLab'
          else if (/reddit/.test(site)) site = 'Reddit'
          else if (/facebook|^fb\.com$/.test(site)) site = 'Facebook'
          else if (/tiktok/.test(site)) site = 'TikTok'
          else if (/gravatar/.test(site)) site = 'Gravatar'
          else if (/imgur/.test(site)) site = 'Imgur'
          else if (/snapchat/.test(site)) site = 'Snapchat'
          else if (/steamcommunity/.test(site)) site = 'Steam'
          else {
            const p2 = site.split('.')
            site = p2.length >= 2 ? p2[p2.length-2].charAt(0).toUpperCase() + p2[p2.length-2].slice(1) : site
          }
          const k = site.toLowerCase()
          if (site && !seen.has(k)) {
            seen.add(k)
            results.push({ site, group: 'Social', since: '', hue: '#58a6ff', detail: 'username match', match: 'exact' })
          }
        } catch {}
      }
    } else if (kind === 'email') {
      const { out } = await runCmd('python3', ['-m', 'holehe', query], 60000)
      for (const line of out.split('\n')) {
        const m = line.match(/\[\+\]\s*(\S+)/)
        if (m) {
          results.push({ site: m[1], group: 'Social', since: '', hue: '#58a6ff', detail: 'email registered', match: 'likely' })
        }
      }
    }
  } catch (e) {
    // ignore
  }
  try { fs.appendFileSync('/tmp/lookup.log', JSON.stringify(results.length) + ' ' + query + '\n'); } catch (e) {}
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

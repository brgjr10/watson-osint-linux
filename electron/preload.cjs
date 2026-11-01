const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('api', {
  runLookup: (kind, query) => ipcRenderer.invoke('lookup', kind, query),
})
contextBridge.exposeInMainWorld('__preloadLoaded', true)

const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('api', {
  runLookup: (kind, query) => ipcRenderer.invoke('lookup', kind, query),
  checkBinary: (name) => ipcRenderer.invoke('checkBinary', name),
})
contextBridge.exposeInMainWorld('__preloadLoaded', true)

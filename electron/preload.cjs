const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('api', {
  runLookup: (kind, query) => ipcRenderer.invoke('lookup', kind, query),
  checkBinary: (name) => ipcRenderer.invoke('checkBinary', name),
  connectSource: (name) => ipcRenderer.invoke('connectSource', name),
  setApiKey: (name, key) => ipcRenderer.invoke('setApiKey', name, key),
  loadCases: () => ipcRenderer.invoke('loadCases'),
  saveCases: (cases) => ipcRenderer.invoke('saveCases', cases),
})
contextBridge.exposeInMainWorld('__preloadLoaded', true)

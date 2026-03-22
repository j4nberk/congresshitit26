const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (payload) => ipcRenderer.invoke('save-settings', payload),
  testConnection: (config) => ipcRenderer.invoke('test-connection', config),
  loadDashboard: (payload) => ipcRenderer.invoke('load-dashboard', payload),
  pollLive: (payload) => ipcRenderer.invoke('poll-live', payload),
  exportPdf: (payload) => ipcRenderer.invoke('export-pdf', payload),
});

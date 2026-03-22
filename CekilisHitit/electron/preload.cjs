const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    scrapeComments: (data) => ipcRenderer.invoke('scrape-comments', data),
    scrapeApify: (data) => ipcRenderer.invoke('apify-scrape-comments', data),
    scrapeGraphApi: (data) => ipcRenderer.invoke('graph-api-scrape-comments', data),
    resetCookies: () => ipcRenderer.invoke('reset-cookies'),
    onScrapeProgress: (callback) => ipcRenderer.on('scrape-progress', (event, ...args) => callback(...args)),
    saveJsonFile: (data) => ipcRenderer.invoke('save-json-dialog', data),
    openJsonFile: () => ipcRenderer.invoke('open-json-dialog'),
    exportExcel: (payload) => ipcRenderer.invoke('export-excel', payload),
    readExcel: () => ipcRenderer.invoke('read-excel'),
});

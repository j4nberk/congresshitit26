const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Persist
    loadSettings: () => ipcRenderer.invoke('load-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
    
    // Data Storage (Teachers & Students)
    loadData: (key) => ipcRenderer.invoke('load-data', key),
    saveData: (key, data) => ipcRenderer.invoke('save-data', { key, data }),

    // SMTP
    testSmtp: (config) => ipcRenderer.invoke('test-smtp', config),

    // Attachments & DOCX
    openAttachment: () => ipcRenderer.invoke('open-attachment-dialog'),
    selectDocx: () => ipcRenderer.invoke('select-docx'),
    copyDocx: (payload) => ipcRenderer.invoke('copy-docx', payload),
    openPath: (filePath) => ipcRenderer.invoke('open-path', filePath),
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
    deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),

    // Send — artık recipients göndermiyoruz, sadece config
    sendBulkEmails: (payload) => ipcRenderer.invoke('send-bulk-emails', payload),
    stopSending: () => ipcRenderer.invoke('stop-sending'),

    // PDF
    exportPdf: (payload) => ipcRenderer.invoke('export-pdf', payload),

    // Logs
    exportLogs: (logs) => ipcRenderer.invoke('export-logs', logs),

    // Progress
    onMailProgress: (callback) => {
        ipcRenderer.removeAllListeners('mail-progress');
        ipcRenderer.on('mail-progress', (_event, data) => callback(data));
    },
    removeMailProgressListeners: () => {
        ipcRenderer.removeAllListeners('mail-progress');
    }
});

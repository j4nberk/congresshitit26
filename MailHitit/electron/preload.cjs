const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Persist
    loadSettings: () => ipcRenderer.invoke('load-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

    // SMTP
    testSmtp: (config) => ipcRenderer.invoke('test-smtp', config),

    // Excel — artık sadece metadata + preview dönüyor
    openExcel: () => ipcRenderer.invoke('open-excel-dialog'),
    getExcelPreview: (range) => ipcRenderer.invoke('get-excel-preview', range),
    countValidEmails: (params) => ipcRenderer.invoke('count-valid-emails', params),

    // Attachments
    openAttachment: () => ipcRenderer.invoke('open-attachment-dialog'),

    // Send — artık recipients göndermiyoruz, sadece config
    sendBulkEmails: (payload) => ipcRenderer.invoke('send-bulk-emails', payload),
    stopSending: () => ipcRenderer.invoke('stop-sending'),

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

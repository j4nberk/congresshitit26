import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { createTransport } from 'nodemailer';
import * as XLSX from 'xlsx';
import Store from 'electron-store';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';

// ─── Persist Store ──────────────────────────────────────────
const store = new Store({
    name: 'mailhitit-settings',
    defaults: {
        config: {
            smtpHost: '',
            smtpPort: '465',
            senderEmail: '',
            senderPassword: '',
            senderName: '',
        },
        subject: '',
        htmlContent: '',
        rateLimit: 150,
    }
});

// ─── GPU & Performance Switches ─────────────────────────────
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('enable-features', 'Metal');
app.commandLine.appendSwitch('use-angle', 'metal');
app.commandLine.appendSwitch('enable-accelerated-2d-canvas');
app.commandLine.appendSwitch('disable-frame-rate-limit');

// ─── State ───────────────────────────────────────────────────
let sendingAborted = false;
let cachedExcelData = null; // { columns, rows, fileName } — main process'te tutulur, IPC'ye gönderilmez

// ─── Window ──────────────────────────────────────────────────
function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 860,
        title: 'MailHitit',
        show: false,
        backgroundColor: '#050505',
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#000000',
            symbolColor: '#22c55e',
            height: 40
        },
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            devTools: isDev,
            backgroundThrottling: false,
        }
    });

    win.once('ready-to-show', () => win.show());

    if (isDev) {
        win.loadURL('http://localhost:5173');
        win.webContents.on('console-message', (_e, _level, message) => {
            console.log(`[REACT]: ${message}`);
        });
    } else {
        win.loadFile(path.join(__dirname, '../dist/index.html'));
        win.webContents.on('devtools-opened', () => {
            win.webContents.closeDevTools();
        });
    }
}

// ─── Helpers ────────────────────────────────────────────────
function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function cleanEmail(raw) {
    if (!raw) return '';
    let e = String(raw).trim();
    if (e.toLowerCase().startsWith('mailto:')) {
        e = e.slice(7);
    }
    return e.trim();
}

function splitEmails(raw) {
    if (!raw) return [];
    return String(raw)
        .split(/[,;]+/)
        .map(e => cleanEmail(e))
        .filter(e => e && e.includes('@'));
}

// ─── App Ready ──────────────────────────────────────────────
app.whenReady().then(() => {

    // ========== Persist: Load Settings ==========
    ipcMain.handle('load-settings', async () => {
        return {
            config: store.get('config'),
            subject: store.get('subject'),
            htmlContent: store.get('htmlContent'),
            rateLimit: store.get('rateLimit'),
        };
    });

    // ========== Persist: Save Settings ==========
    ipcMain.handle('save-settings', async (_event, settings) => {
        if (settings.config) store.set('config', settings.config);
        if (settings.subject !== undefined) store.set('subject', settings.subject);
        if (settings.htmlContent !== undefined) store.set('htmlContent', settings.htmlContent);
        if (settings.rateLimit !== undefined) store.set('rateLimit', settings.rateLimit);
        return { success: true };
    });

    // ========== Test SMTP Connection ==========
    ipcMain.handle('test-smtp', async (_event, config) => {
        try {
            const transporter = createTransport({
                host: config.smtpHost,
                port: Number(config.smtpPort),
                secure: Number(config.smtpPort) === 465,
                auth: {
                    user: config.senderEmail,
                    pass: config.senderPassword
                },
                tls: { rejectUnauthorized: false }
            });
            await transporter.verify();
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    });

    // ========== Open Excel Dialog ==========
    // Excel verisi artık main process'te cacheleniyor, renderer'a sadece metadata gidiyor
    ipcMain.handle('open-excel-dialog', async () => {
        try {
            const result = await dialog.showOpenDialog({
                title: 'Excel Dosyası Seç',
                filters: [{ name: 'Excel', extensions: ['xlsx', 'xls', 'csv'] }],
                properties: ['openFile']
            });
            if (result.canceled || result.filePaths.length === 0) {
                return { success: false, reason: 'cancelled' };
            }
            const filePath = result.filePaths[0];
            const fileBuffer = fs.readFileSync(filePath);

            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            const firstSheet = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheet];
            const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

            if (rows.length === 0) {
                return { success: false, reason: 'Excel dosyası boş.' };
            }

            const columns = Object.keys(rows[0]);
            const fileName = path.basename(filePath);

            // Veriyi main process'te sakla — renderer'a satır verisi GÖNDERME
            cachedExcelData = { columns, rows, fileName };

            // Renderer'a sadece metadata + preview (ilk 5 satır) gönder
            return {
                success: true,
                fileName,
                columns,
                rowCount: rows.length,
                previewRows: rows.slice(0, 5),
            };
        } catch (err) {
            return { success: false, reason: err.message };
        }
    });

    // ========== Get Excel Preview (satır aralığı değişince) ==========
    ipcMain.handle('get-excel-preview', async (_event, { from, to }) => {
        if (!cachedExcelData) return { success: false };
        const start = Math.max(0, (from || 1) - 1);
        const end = Math.min(to || cachedExcelData.rows.length, cachedExcelData.rows.length);
        return {
            success: true,
            previewRows: cachedExcelData.rows.slice(start, Math.min(start + 5, end)),
            selectedCount: end - start,
        };
    });

    // ========== Count Valid Emails (renderer'da hesaplamak yerine) ==========
    ipcMain.handle('count-valid-emails', async (_event, { emailColumn, from, to }) => {
        if (!cachedExcelData || !emailColumn) return { count: 0 };
        const start = Math.max(0, (from || 1) - 1);
        const end = Math.min(to || cachedExcelData.rows.length, cachedExcelData.rows.length);
        let count = 0;
        for (let i = start; i < end; i++) {
            count += splitEmails(cachedExcelData.rows[i][emailColumn]).length;
        }
        return { count };
    });

    // ========== Open Attachment Dialog ==========
    ipcMain.handle('open-attachment-dialog', async () => {
        try {
            const result = await dialog.showOpenDialog({
                title: 'Ek Dosya Seç',
                properties: ['openFile', 'multiSelections']
            });
            if (result.canceled || result.filePaths.length === 0) {
                return { success: false, reason: 'cancelled' };
            }
            const attachments = result.filePaths.map(fp => ({
                path: fp,
                filename: path.basename(fp),
                size: fs.statSync(fp).size
            }));
            return { success: true, attachments };
        } catch (err) {
            return { success: false, reason: err.message };
        }
    });

    // ========== Stop Sending ==========
    ipcMain.handle('stop-sending', async () => {
        sendingAborted = true;
        return { success: true };
    });

    // ========== Send Bulk Emails ==========
    // Artık recipients renderer'dan gelmiyor — main process cachedExcelData'dan kendi oluşturuyor
    ipcMain.handle('send-bulk-emails', async (event, payload) => {
        const {
            config,
            subject,
            htmlTemplate,
            emailColumn,
            rowRange,           // { from, to }
            placeholderMapping, // { placeholderName: columnName }
            attachmentPaths,
            rateLimit,
        } = payload;

        if (!cachedExcelData) {
            return { success: false, error: 'Excel verisi yüklenmemiş.' };
        }

        sendingAborted = false;
        const perHour = rateLimit || 150;
        const delayMs = Math.ceil(3600000 / perHour);

        const transporter = createTransport({
            host: config.smtpHost,
            port: Number(config.smtpPort),
            secure: Number(config.smtpPort) === 465,
            auth: {
                user: config.senderEmail,
                pass: config.senderPassword
            },
            tls: { rejectUnauthorized: false },
            pool: true,
            maxConnections: 3,
            maxMessages: 100,
        });

        const attachments = (attachmentPaths || []).map(fp => ({
            filename: path.basename(fp),
            path: fp
        }));

        // Recipient listesini main process'te oluştur (IPC'den geçmez, RAM'de kalmaz renderer'da)
        const from = Math.max(0, (rowRange?.from || 1) - 1);
        const to = Math.min(rowRange?.to || cachedExcelData.rows.length, cachedExcelData.rows.length);
        const selectedRows = cachedExcelData.rows.slice(from, to);

        // Placeholder key → regex eşlemesini ÖNCEDEN derle (her mail için yeniden oluşturmamak için)
        const placeholderKeys = Object.entries(placeholderMapping || {}).filter(([, col]) => col);
        const compiledRegexes = placeholderKeys.map(([key, colName]) => ({
            regex: new RegExp(`\\{${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}`, 'g'),
            colName,
        }));

        // Flat recipient listesi oluştur (hücrede çoklu email varsa böl)
        const recipients = [];
        for (const row of selectedRows) {
            const emails = splitEmails(row[emailColumn]);
            for (const email of emails) {
                recipients.push({ email, row });
            }
        }

        let sentCount = 0;
        let failedCount = 0;
        let skippedCount = 0;
        let consecutiveFailures = 0;
        const total = recipients.length;

        // Renderer'a toplam sayıyı bildir
        event.sender.send('mail-progress', { type: 'total', total });

        for (let i = 0; i < total; i++) {
            if (sendingAborted) {
                event.sender.send('mail-progress', {
                    type: 'aborted', index: i, total,
                    message: 'Gönderim durduruldu.'
                });
                break;
            }

            const { email: toEmail, row } = recipients[i];

            if (!toEmail || !toEmail.includes('@')) {
                skippedCount++;
                event.sender.send('mail-progress', {
                    type: 'skipped', index: i, total,
                    log: { index: i, email: toEmail || '(boş)', status: 'skipped', error: 'Geçersiz email', timestamp: new Date().toISOString() }
                });
                continue;
            }

            // Placeholder replace — önceden derlenmiş regex kullan
            let html = htmlTemplate;
            let mailSubject = subject;
            for (const { regex, colName } of compiledRegexes) {
                const val = row[colName] ?? '';
                html = html.replace(regex, val);
                mailSubject = mailSubject.replace(regex, val);
            }

            try {
                await transporter.sendMail({
                    from: `"${config.senderName || ''}" <${config.senderEmail}>`,
                    to: toEmail,
                    subject: mailSubject,
                    html,
                    attachments
                });

                consecutiveFailures = 0;
                sentCount++;
                event.sender.send('mail-progress', {
                    type: 'sent', index: i, total,
                    log: { index: i, email: toEmail, status: 'sent', timestamp: new Date().toISOString() }
                });
            } catch (err) {
                consecutiveFailures++;
                failedCount++;
                event.sender.send('mail-progress', {
                    type: 'failed', index: i, total,
                    log: { index: i, email: toEmail, status: 'failed', error: err.message, timestamp: new Date().toISOString() }
                });

                if (consecutiveFailures >= 3) {
                    const resumeAt = new Date(Date.now() + 3600000).toISOString();
                    event.sender.send('mail-progress', {
                        type: 'rate-limit', index: i, total,
                        message: '3 ardışık hata! Rate limit algılandı. 1 saat bekleniyor...',
                        resumeAt
                    });

                    for (let s = 0; s < 360; s++) {
                        if (sendingAborted) break;
                        await sleep(10000);
                    }

                    if (sendingAborted) {
                        event.sender.send('mail-progress', {
                            type: 'aborted', index: i, total,
                            message: 'Gönderim durduruldu (rate limit bekleme sırasında).'
                        });
                        break;
                    }

                    consecutiveFailures = 0;
                    event.sender.send('mail-progress', {
                        type: 'resumed', index: i, total,
                        message: 'Rate limit bekleme süresi doldu, devam ediliyor...'
                    });
                }
            }

            // Delay between sends (skip if last)
            if (i < total - 1 && !sendingAborted) {
                await sleep(delayMs);
            }
        }

        // Transporter'ı kapat — connection pool temizle
        transporter.close();

        event.sender.send('mail-progress', {
            type: 'complete', total,
            sent: sentCount,
            failed: failedCount,
            skipped: skippedCount,
        });

        return { success: true };
    });

    // ========== Export Logs ==========
    ipcMain.handle('export-logs', async (_event, logs) => {
        try {
            const result = await dialog.showSaveDialog({
                title: 'Logları Kaydet',
                defaultPath: `mail-logs-${Date.now()}.json`,
                filters: [{ name: 'JSON', extensions: ['json'] }]
            });
            if (result.canceled || !result.filePath) return { success: false };
            fs.writeFileSync(result.filePath, JSON.stringify(logs, null, 2), 'utf-8');
            return { success: true, filePath: result.filePath };
        } catch (err) {
            return { success: false, reason: err.message };
        }
    });

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { createTransport } from 'nodemailer';
import mammoth from 'mammoth';
import Store from 'electron-store';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';

// ─── Persist Store ──────────────────────────────────────────
const store = new Store({
    name: 'bildirihitit-settings',
    defaults: {
        config: {
            smtpHost: '',
            smtpPort: '465',
            senderEmail: '',
            senderPassword: '',
            senderName: '',
            docxSavePath: '',
        },
        templates: {
            accept: { subject: '', htmlContent: '' },
            reject: { subject: '', htmlContent: '' }
        },
        rateLimit: 150,
        theme: 'hitit-green',
        resultThreshold: 50,
        teacherScoringForm: {
            path: '',
            name: ''
        }
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

// ─── Window ──────────────────────────────────────────────────
function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 860,
        title: 'BildiriHitit',
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

function sanitizeFilename(value) {
    return String(value || 'bildiri-hitit')
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\s/g, '-')
        .toLowerCase();
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatPdfCell(value) {
    return escapeHtml(value || '-').replace(/\n/g, '<br />');
}

function getLogoPath() {
    return isDev
        ? path.join(__dirname, '../public/logo.png')
        : path.join(__dirname, '../dist/logo.png');
}

function getLogoDataUri() {
    const logoPath = getLogoPath();
    if (!fs.existsSync(logoPath)) {
        return '';
    }

    const buffer = fs.readFileSync(logoPath);
    return `data:image/png;base64,${buffer.toString('base64')}`;
}

function buildPdfHtml(payload) {
    const headers = Array.isArray(payload?.headers) ? payload.headers : [];
    const rows = Array.isArray(payload?.rows) ? payload.rows : [];
    const meta = Array.isArray(payload?.meta) ? payload.meta : [];
    const generatedAt = new Intl.DateTimeFormat('tr-TR', {
        dateStyle: 'long',
        timeStyle: 'short',
    }).format(new Date());
    const logo = getLogoDataUri();

    const metaRows = [
        ...meta,
        { label: 'Üretim', value: generatedAt },
        { label: 'Toplam Satır', value: rows.length },
    ].map(item => `
      <div><strong>${escapeHtml(item?.label || '')}:</strong> ${escapeHtml(item?.value || '-')}</div>
    `).join('');

    const bodyRows = rows.map((row) => `
      <tr>
        ${row.map((value) => `<td>${formatPdfCell(value)}</td>`).join('')}
      </tr>
    `).join('');

    return `<!doctype html>
  <html lang="tr">
  <head>
    <meta charset="UTF-8" />
    <style>
      @page {
        size: A4 landscape;
        margin: 20mm 12mm 16mm;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Arial, "Arial Unicode MS", sans-serif;
        -webkit-font-smoothing: antialiased;
        text-rendering: geometricPrecision;
        color: #102418;
        background: #f5fbf7;
      }

      .sheet {
        padding: 20px 24px 14px;
        border: 1px solid #d8ebe0;
        border-radius: 20px;
        background:
          linear-gradient(180deg, rgba(242, 250, 245, 1), rgba(255, 255, 255, 1)),
          #ffffff;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 24px;
        padding-bottom: 18px;
        border-bottom: 2px solid #d7eadc;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .brand img {
        width: 66px;
        height: 66px;
        border-radius: 18px;
        object-fit: cover;
        border: 1px solid #d7eadc;
        background: #ffffff;
      }

      .eyebrow {
        font-size: 12px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: #2d7d4d;
        font-weight: 700;
      }

      h1 {
        margin: 6px 0 4px;
        font-size: 28px;
        line-height: 1.1;
      }

      .subtitle {
        margin: 0;
        color: #537362;
        font-size: 13px;
      }

      .meta {
        min-width: 220px;
        text-align: right;
        font-size: 12px;
        color: #476756;
        line-height: 1.8;
      }

      .meta strong {
        color: #163524;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 18px;
        font-size: 12px;
      }

      thead th {
        background: #e8f5ed;
        color: #17452a;
        text-align: left;
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        padding: 10px 8px;
        border-bottom: 1px solid #cfe3d5;
      }

      tbody td {
        padding: 9px 8px;
        border-bottom: 1px solid #e2eee6;
        vertical-align: top;
        white-space: normal;
      }

      tbody td:first-child {
        font-family: "SF Mono", "Menlo", "Monaco", monospace;
        color: #2d7d4d;
      }

      tbody tr:nth-child(even) td {
        background: #fbfefc;
      }

      .footer {
        margin-top: 14px;
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        color: #64826f;
      }
    </style>
  </head>
  <body>
    <div class="sheet">
      <div class="header">
        <div class="brand">
          ${logo ? `<img src="${logo}" alt="Kongre Logosu" />` : ''}
          <div>
            <div class="eyebrow">3. Ulusal Tıp Öğrenci Kongresi</div>
            <h1>${escapeHtml(payload?.title || 'Bildiriler ve Öğrenciler Listesi')}</h1>
            <p class="subtitle">${escapeHtml(payload?.subtitle || 'BildiriHitit PDF export')}</p>
          </div>
        </div>
        <div class="meta">
          ${metaRows}
        </div>
      </div>

      <table>
        <thead>
          <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${bodyRows || `<tr><td colspan="${headers.length || 1}">Kayıt bulunamadı.</td></tr>`}
        </tbody>
      </table>

      <div class="footer">
        <span>BildiriHitit tarafından oluşturuldu.</span>
        <span>${escapeHtml(payload?.title || 'PDF')}</span>
      </div>
    </div>
  </body>
  </html>`;
}

async function createPdfFile(payload) {
    const title = payload?.title || 'bildiriler-ve-ogrenciler-listesi';
    const suggestedName = `${sanitizeFilename(title)}.pdf`;
    const saveResult = await dialog.showSaveDialog({
        title: 'PDF Kaydet',
        defaultPath: suggestedName,
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });

    if (saveResult.canceled || !saveResult.filePath) {
        return { success: false, cancelled: true };
    }

    const pdfWindow = new BrowserWindow({
        show: false,
        width: 1400,
        height: 1000,
        backgroundColor: '#ffffff',
        webPreferences: {
            sandbox: false,
        },
    });

    try {
        await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(buildPdfHtml(payload))}`);
        const pdfBuffer = await pdfWindow.webContents.printToPDF({
            printBackground: true,
            landscape: true,
            preferCSSPageSize: true,
        });

        fs.writeFileSync(saveResult.filePath, pdfBuffer);
        return { success: true, filePath: saveResult.filePath };
    } finally {
        pdfWindow.close();
    }
}

// ─── App Ready ──────────────────────────────────────────────
app.whenReady().then(() => {

    // ========== Persist: Load Settings ==========
    ipcMain.handle('load-settings', async () => {
        return {
            config: store.get('config'),
            templates: store.get('templates'),
            rateLimit: store.get('rateLimit'),
            theme: store.get('theme'),
            resultThreshold: store.get('resultThreshold'),
            teacherScoringForm: store.get('teacherScoringForm'),
        };
    });

    // ========== Persist: Save Settings ==========
    ipcMain.handle('save-settings', async (_event, settings) => {
        if (settings.config) store.set('config', settings.config);
        if (settings.templates) store.set('templates', settings.templates);
        if (settings.rateLimit !== undefined) store.set('rateLimit', settings.rateLimit);
        if (settings.theme !== undefined) store.set('theme', settings.theme);
        if (settings.resultThreshold !== undefined) store.set('resultThreshold', settings.resultThreshold);
        if (settings.teacherScoringForm !== undefined) store.set('teacherScoringForm', settings.teacherScoringForm);
        return { success: true };
    });

    // ========== Persist: Custom Data ==========
    ipcMain.handle('load-data', async (_event, key) => {
        return store.get(key) || [];
    });

    ipcMain.handle('save-data', async (_event, { key, data }) => {
        store.set(key, data);
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

    ipcMain.handle('export-pdf', async (_event, payload) => {
        try {
            return await createPdfFile(payload);
        } catch (err) {
            return { success: false, error: err.message };
        }
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

    // ========== Select and Parse DOCX ==========
    ipcMain.handle('select-docx', async () => {
        try {
            const result = await dialog.showOpenDialog({
                title: 'Bildiri Özeti Seç (.docx)',
                filters: [{ name: 'Word Documents', extensions: ['docx'] }],
                properties: ['openFile']
            });
            if (result.canceled || result.filePaths.length === 0) {
                return { success: false, reason: 'cancelled' };
            }
            
            const filePath = result.filePaths[0];

            const extraction = await mammoth.extractRawText({ path: filePath });
            const fullText = extraction.value || '';
            
            // Sadece orijinal dosyanın yolu ve metnini dönüyoruz.
            return { success: true, filePath, text: fullText };
        } catch (err) {
            return { success: false, reason: err.message };
        }
    });

    // ========== Copy DOCX ==========
    ipcMain.handle('copy-docx', async (_event, { originalPath, studentName, paperNumber }) => {
        try {
            if (!originalPath) {
                return { success: false, reason: 'Orijinal dosya yolu girilmedi' };
            }
            try {
                await fs.promises.access(originalPath);
            } catch {
                return { success: false, reason: 'Orijinal dosya bulunamadı' };
            }

            const appConfig = store.get('config') || {};
            const saveDir = appConfig.docxSavePath;

            if (!saveDir) {
                return { success: true, filePath: originalPath };
            }
            try {
                await fs.promises.access(saveDir);
            } catch {
                return { success: true, filePath: originalPath }; // Klasör yoksa orijinali kullan
            }

            const ext = path.extname(originalPath);
            let safeName = `${studentName}-${paperNumber}`;
            
            // Türkçe karakterleri temizle
            const charMap = {
                'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ş': 's', 'Ş': 's',
                'ö': 'o', 'Ö': 'o', 'ı': 'i', 'İ': 'i', 'ü': 'u', 'Ü': 'u'
            };
            safeName = safeName.replace(/[çÇğĞşŞöÖıİüÜ]/g, m => charMap[m]);
            // İstenmeyen karakterleri tire yap ve küçük harfe çevir
            safeName = safeName.replace(/[^a-zA-Z0-9\-]/g, '-').replace(/\-+/g, '-').toLowerCase();

            const newFileName = `${safeName}${ext}`;
            const newFilePath = path.join(saveDir, newFileName);

            await fs.promises.copyFile(originalPath, newFilePath);

            return { success: true, filePath: newFilePath };
        } catch (err) {
            return { success: false, reason: err.message };
        }
    });

    // ========== Select Directory ==========
    ipcMain.handle('select-directory', async () => {
        try {
            const result = await dialog.showOpenDialog({
                title: 'Klasör Seç',
                properties: ['openDirectory']
            });
            if (result.canceled || result.filePaths.length === 0) {
                return { success: false, reason: 'cancelled' };
            }
            return { success: true, path: result.filePaths[0] };
        } catch (err) {
            return { success: false, reason: err.message };
        }
    });

    // ========== Delete File (optional, when removing a paper) ==========
    ipcMain.handle('delete-file', async (_event, filePath) => {
        try {
            if (!filePath) {
                return { success: false, reason: 'Dosya yolu belirtilmedi' };
            }
            if (!fs.existsSync(filePath)) {
                return { success: false, reason: 'Dosya zaten bulunamadı' };
            }
            await fs.promises.unlink(filePath);
            return { success: true };
        } catch (err) {
            return { success: false, reason: err.message };
        }
    });

    // ========== Open Path (with System Default App) ==========
    ipcMain.handle('open-path', async (_event, filePath) => {
        try {
            if (!filePath || !fs.existsSync(filePath)) {
                return { success: false, reason: 'Dosya bulunamadı' };
            }
            const error = await shell.openPath(filePath);
            if (error) {
                return { success: false, reason: error };
            }
            return { success: true };
        } catch(err) {
            return { success: false, reason: err.message };
        }
    });

    // ========== Stop Sending ==========
    ipcMain.handle('stop-sending', async () => {
        sendingAborted = true;
        return { success: true };
    });

    // ========== Send Bulk Emails ==========
    // Generic mail sender that takes `jobs` array
    ipcMain.handle('send-bulk-emails', async (event, payload) => {
        const { config, rateLimit, jobs } = payload;

        if (!jobs || jobs.length === 0) {
            return { success: false, error: 'Gönderilecek mail bulunamadı.' };
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

        let sentCount = 0;
        let failedCount = 0;
        let skippedCount = 0;
        let consecutiveFailures = 0;
        const total = jobs.length;

        event.sender.send('mail-progress', { type: 'total', total });

        for (let i = 0; i < total; i++) {
            if (sendingAborted) {
                if (!event.sender.isDestroyed()) {
                    event.sender.send('mail-progress', {
                        type: 'aborted', index: i, total,
                        message: 'Gönderim durduruldu.'
                    });
                }
                break;
            }

            const { to, subject, html, attachments, paperIds, studentId } = jobs[i];

            if (!to || !to.includes('@')) {
                skippedCount++;
                if (!event.sender.isDestroyed()) {
                    event.sender.send('mail-progress', {
                        type: 'skipped', index: i, total,
                        log: { index: i, email: to || '(boş)', status: 'skipped', error: 'Geçersiz email', timestamp: new Date().toISOString() }
                    });
                }
                continue;
            }

            try {
                await transporter.sendMail({
                    from: `"${config.senderName || ''}" <${config.senderEmail}>`,
                    to,
                    subject,
                    html,
                    attachments: attachments || []
                });

                consecutiveFailures = 0;
                sentCount++;
                if (!event.sender.isDestroyed()) {
                    event.sender.send('mail-progress', {
                        type: 'sent', index: i, total,
                        paperIds: paperIds || [],
                        studentId: studentId || null,
                        log: {
                            index: i, email: to, status: 'sent',
                            paperIds: paperIds || [],
                            studentId: studentId || null,
                            timestamp: new Date().toISOString()
                        }
                    });
                }
            } catch (err) {
                consecutiveFailures++;
                failedCount++;
                if (!event.sender.isDestroyed()) {
                    event.sender.send('mail-progress', {
                        type: 'failed', index: i, total,
                        log: { index: i, email: to, status: 'failed', error: err.message, timestamp: new Date().toISOString() }
                    });
                }

                if (consecutiveFailures >= 3) {
                    const resumeAt = new Date(Date.now() + 3600000).toISOString();
                    if (!event.sender.isDestroyed()) {
                        event.sender.send('mail-progress', {
                            type: 'rate-limit', index: i, total,
                            message: '3 ardışık hata! Rate limit algılandı. 1 saat bekleniyor...',
                            resumeAt
                        });
                    }

                    for (let s = 0; s < 360; s++) {
                        if (sendingAborted) break;
                        await sleep(10000);
                    }

                    if (sendingAborted) {
                        if (!event.sender.isDestroyed()) {
                            event.sender.send('mail-progress', {
                                type: 'aborted', index: i, total,
                                message: 'Gönderim durduruldu (rate limit bekleme sırasında).'
                            });
                        }
                        break;
                    }

                    consecutiveFailures = 0;
                    if (!event.sender.isDestroyed()) {
                        event.sender.send('mail-progress', {
                            type: 'resumed', index: i, total,
                            message: 'Rate limit bekleme süresi doldu, devam ediliyor...'
                        });
                    }
                }
            }

            if (i < total - 1 && !sendingAborted) {
                await sleep(delayMs);
            }
        }

        transporter.close();

        if (!event.sender.isDestroyed()) {
            event.sender.send('mail-progress', {
                type: 'complete', total,
                sent: sentCount,
                failed: failedCount,
                skipped: skippedCount,
            });
        }

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

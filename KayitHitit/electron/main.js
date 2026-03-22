import { app, BrowserWindow, dialog, ipcMain, net } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Store from 'electron-store';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === 'development';

const store = new Store({
  name: 'kayithitit-settings',
  defaults: {
    config: {
      baseUrl: '',
      apiKey: '',
    },
    cache: {
      sort: 'basvuru',
      bootstrap: null,
      participants: [],
      workshops: [],
      liveFeed: [],
      lastSeenEntryId: 0,
      lastSyncAt: '',
      selectedWorkshopKey: '',
      pollingEnabled: false,
      stateToken: '',
    },
  },
});

app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('enable-features', 'Metal');
app.commandLine.appendSwitch('use-angle', 'metal');
app.commandLine.appendSwitch('enable-accelerated-2d-canvas');
app.commandLine.appendSwitch('disable-frame-rate-limit');

function normalizeBaseUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function ensureConfig(config) {
  const baseUrl = normalizeBaseUrl(config?.baseUrl);
  const apiKey = String(config?.apiKey || '').trim();

  if (!baseUrl) {
    throw new Error('Site URL zorunludur.');
  }

  if (!apiKey) {
    throw new Error('Masaüstü API anahtarı zorunludur.');
  }

  return { baseUrl, apiKey };
}

function sanitizeFilename(value) {
  return String(value || 'kayit-hitit')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s/g, '-')
    .toLowerCase();
}

async function requestJson(config, endpoint, query = {}) {
  const normalized = ensureConfig(config);
  const url = new URL(`${normalized.baseUrl}/wp-json/kongre-desktop/v1/${endpoint}`);

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await net.fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'X-Hitit-Desktop-Key': normalized.apiKey,
    },
  });

  const text = await response.text();
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (_error) {
      data = { message: text };
    }
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.code || `HTTP ${response.status}`);
  }

  return data;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getLogoPath() {
  return isDev
    ? path.join(__dirname, '../public/congress-logo.png')
    : path.join(__dirname, '../dist/congress-logo.png');
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
  const rows = Array.isArray(payload?.rows) ? payload.rows : [];
  const type = payload?.type === 'workshop' ? 'workshop' : 'participants';
  const sortLabel = payload?.sort === 'alfabetik' ? 'Alfabetik' : 'Başvuru Sırası';
  const generatedAt = new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date());
  const logo = getLogoDataUri();

  const headers = type === 'workshop'
    ? ['Sıra', 'Ad Soyad', 'Dönem', 'Telefon', 'E-posta', 'Paket', 'Katılımcı Türü']
    : ['Başvuru No', 'Başvuru Tarihi', 'Ad Soyad', 'Dönem', 'Telefon', 'E-posta', 'Paket', 'Katılımcı Türü', 'Bilimsel Atölye', 'Sosyal Atölye'];

  const bodyRows = rows.map((row) => {
    const values = type === 'workshop'
      ? [row.sira, row.ad_soyad, row.donem, row.telefon, row.email, row.paket, row.katilimci_turu]
      : [row.basvuru_no, row.basvuru_tarihi, row.ad_soyad, row.donem, row.telefon, row.email, row.paket, row.katilimci_turu, row.bilimsel_atolye, row.sosyal_atolye];

    return `
      <tr>
        ${values.map((value) => `<td>${escapeHtml(value || '-')}</td>`).join('')}
      </tr>
    `;
  }).join('');

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
            <h1>${escapeHtml(payload?.title || 'Katılımcı Listesi')}</h1>
            <p class="subtitle">${escapeHtml(payload?.subtitle || 'KayıtHitit PDF export')}</p>
          </div>
        </div>
        <div class="meta">
          <div><strong>Üretim:</strong> ${escapeHtml(generatedAt)}</div>
          <div><strong>Sıralama:</strong> ${escapeHtml(sortLabel)}</div>
          <div><strong>Toplam Satır:</strong> ${rows.length}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${bodyRows || `<tr><td colspan="${headers.length}">Kayıt bulunamadı.</td></tr>`}
        </tbody>
      </table>

      <div class="footer">
        <span>KayıtHitit tarafından oluşturuldu.</span>
        <span>${escapeHtml(payload?.title || 'PDF')}</span>
      </div>
    </div>
  </body>
  </html>`;
}

async function createPdfFile(payload) {
  const title = payload?.title || 'kayit-hitit';
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

function createWindow() {
  const iconPath = process.platform === 'darwin'
    ? path.join(__dirname, '../electron-icons/macos/icon.icns')
    : process.platform === 'win32'
      ? path.join(__dirname, '../electron-icons/windows/icon.ico')
      : path.join(__dirname, '../electron-icons/linux/icons/512x512.png');

  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1200,
    minHeight: 760,
    title: 'KayıtHitit',
    icon: iconPath,
    show: false,
    backgroundColor: '#010101',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#010101',
      symbolColor: '#d7f6e2',
      height: 52,
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      backgroundThrottling: false,
      devTools: isDev,
    },
  });

  win.once('ready-to-show', () => win.show());

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  ipcMain.handle('load-settings', async () => ({
    config: store.get('config'),
    cache: store.get('cache'),
  }));

  ipcMain.handle('save-settings', async (_event, payload) => {
    if (payload?.config) {
      store.set('config', payload.config);
    }

    if (payload?.cache) {
      store.set('cache', payload.cache);
    }

    return { success: true };
  });

  ipcMain.handle('test-connection', async (_event, config) => {
    try {
      const data = await requestJson(config, 'bootstrap');
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('load-dashboard', async (_event, payload) => {
    try {
      const bootstrap = await requestJson(payload.config, 'bootstrap');
      const participants = await requestJson(payload.config, 'participants', { sort: payload.sort || 'basvuru' });
      const workshops = await requestJson(payload.config, 'workshops', { sort: payload.sort || 'basvuru' });

      return {
        success: true,
        data: {
          bootstrap,
          participants,
          workshops,
        },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('poll-live', async (_event, payload) => {
    try {
      const data = await requestJson(payload.config, 'live', {
        after_entry_id: payload.afterEntryId || 0,
      });

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('export-pdf', async (_event, payload) => {
    try {
      return await createPdfFile(payload);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

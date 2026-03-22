import { app, BrowserWindow, ipcMain, session, net, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';

// Force Hardware Acceleration and optimize performance for production builds
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('enable-features', 'Metal');
app.commandLine.appendSwitch('use-angle', 'metal');
app.commandLine.appendSwitch('enable-accelerated-2d-canvas');
app.commandLine.appendSwitch('disable-frame-rate-limit');

function createWindow() {
    const iconPath = process.platform === 'darwin'
        ? path.join(__dirname, '../electron-icons/macos/icon.icns')
        : process.platform === 'win32'
            ? path.join(__dirname, '../electron-icons/windows/icon.ico')
            : path.join(__dirname, '../electron-icons/icon.png');

    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        title: 'CekilisHitit',
        icon: iconPath,
        show: false, // don't show until ready
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
            backgroundThrottling: false, // Prevent animation lag when window loses focus
        }
    });

    // Show window only when fully loaded — prevents white flash
    win.once('ready-to-show', () => {
        win.show();
    });

    if (isDev) {
        win.loadURL('http://localhost:5173');
        win.webContents.on('console-message', (event, level, message, line, sourceId) => {
            const text = message || (level && level.message) || level;
            console.log(`[REACT CONSOLE]: ${text}`);
        });
    } else {
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(() => {
    // ========== Reset cookies handler ==========
    ipcMain.handle('reset-cookies', async () => {
        try {
            await session.defaultSession.clearStorageData({ storages: ['cookies', 'serviceworkers', 'caches', 'indexdb', 'localstorage'] });
            return true;
        } catch (e) {
            console.error("Cookie wipe error:", e);
            return false;
        }
    });

    // ========== Apify Cloud Scraper ==========
    ipcMain.handle('apify-scrape-comments', async (event, data) => {
        try {
            const { url, token } = data;
            if (!url || !token) {
                return [{ id: 0, username: 'hata', text: 'Eksik bilgi: URL veya Apify API Token bulunamadı.' }];
            }

            const ACTOR_ID = 'apify~instagram-comment-scraper';
            console.log(`[APIFY] Starting Actor Run...`);

            const runRes = await net.fetch(`https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ directUrls: [url], resultsLimit: 10000 })
            });

            if (!runRes.ok) {
                const text = await runRes.text();
                return [{ id: 0, username: 'hata', text: 'Apify API Hatası: ' + text.substring(0, 200) }];
            }

            const runData = await runRes.json();
            const runId = runData.data.id;
            const defaultDatasetId = runData.data.defaultDatasetId;
            console.log(`[APIFY] Run ID: ${runId}, Dataset: ${defaultDatasetId}`);

            // Poll for completion (max 20 minutes)
            let isReady = false;
            for (let i = 0; i < 600 && !isReady; i++) {
                await new Promise(r => setTimeout(r, 2000));
                const statusRes = await net.fetch(`https://api.apify.com/v2/acts/${ACTOR_ID}/runs/${runId}?token=${token}`);
                const statusData = await statusRes.json();
                const status = statusData.data.status;
                if (status === 'SUCCEEDED') isReady = true;
                else if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
                    return [{ id: 0, username: 'hata', text: `Apify İşlemi Başarısız: ${status}` }];
                }
            }

            if (!isReady) return [{ id: 0, username: 'hata', text: 'Apify Zaman Aşımı (20dk). Apify konsolundan işlem durumunu kontrol edin.' }];

            // Fetch dataset
            let allItems = [];
            let offset = 0;
            while (true) {
                const dataRes = await net.fetch(`https://api.apify.com/v2/datasets/${defaultDatasetId}/items?token=${token}&limit=1000&offset=${offset}`);
                const page = await dataRes.json();
                if (!Array.isArray(page) || page.length === 0) break;
                allItems = allItems.concat(page);
                if (page.length < 1000) break;
                offset += 1000;
            }

            console.log(`[APIFY] ${allItems.length} raw comments`);
            if (allItems.length === 0) return [{ id: 0, username: 'hata', text: 'Yorum bulunamadı.' }];

            const allExtracted = [];
            const seen = new Set();
            for (const item of allItems) {
                const username = item.ownerUsername || item.user?.username || item.username;
                if (username && !seen.has(username)) {
                    seen.add(username);
                    allExtracted.push({
                        id: seen.size,
                        username,
                        picUrl: item.ownerProfilePicUrl || item.user?.profile_pic_url || null,
                        text: item.text || 'Katılıyorum'
                    });
                }
            }
            console.log(`[APIFY] ${allExtracted.length} unique commenters`);
            return allExtracted;
        } catch (err) {
            console.error("[APIFY] Error:", err);
            return [{ id: 0, username: 'hata', text: 'Apify Hatası: ' + err.message }];
        }
    });

    // ========== Direct GraphQL Comment Scraper (net.fetch) ==========
    const QUERY_HASH = '97b41c52301f77ce508f55e66d17620e';

    ipcMain.handle('graph-api-scrape-comments', async (event, data) => {
        try {
            const { url, sessionId, rps } = data;
            const delayMs = Math.max(parseInt(rps) || 300, 200);

            if (!url) return [{ id: 0, username: 'hata', text: 'URL bulunamadı.' }];
            if (!sessionId?.trim()) return [{ id: 0, username: 'hata', text: 'Session ID gereklidir.' }];

            const sid = sessionId.trim().replace('sessionid=', '');

            const match = url.match(/instagram\.com\/(?:p|reel)\/([^/?#]+)/);
            const shortcode = match ? match[1] : url;

            // Step 1: Visit the post page to bootstrap cookies (csrftoken, mid, ig_did)
            console.log(`[GRAPHQL] Bootstrapping cookies from post page...`);
            const bootstrapHeaders = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9,tr;q=0.8',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Cookie': `sessionid=${sid}`
            };

            let csrfToken = '';
            let fullCookieStr = `sessionid=${sid}`;

            try {
                const pageRes = await net.fetch(`https://www.instagram.com/p/${shortcode}/`, {
                    headers: bootstrapHeaders,
                    redirect: 'follow'
                });

                // Extract cookies from Set-Cookie headers
                const setCookies = pageRes.headers.getSetCookie?.() || [];
                const cookieMap = {};
                for (const c of setCookies) {
                    const nameVal = c.split(';')[0];
                    const eqIdx = nameVal.indexOf('=');
                    if (eqIdx > 0) {
                        const name = nameVal.substring(0, eqIdx).trim();
                        const value = nameVal.substring(eqIdx + 1).trim();
                        if (value && value !== '""') cookieMap[name] = value;
                    }
                }

                csrfToken = cookieMap['csrftoken'] || '';

                // Also try to extract from page HTML
                if (!csrfToken) {
                    const html = await pageRes.text();
                    const csrfMatch = html.match(/"csrf_token":"([^"]+)"/);
                    if (csrfMatch) csrfToken = csrfMatch[1];
                }

                // Build full cookie string
                const allCookies = { sessionid: sid, ...cookieMap };
                // Generate ig_did and mid if not present
                if (!allCookies['ig_did']) {
                    allCookies['ig_did'] = crypto.randomUUID().toUpperCase();
                }
                fullCookieStr = Object.entries(allCookies)
                    .map(([k, v]) => `${k}=${v}`)
                    .join('; ');

                console.log(`[GRAPHQL] Bootstrap OK. csrftoken: ${csrfToken ? 'found' : 'missing'}, cookies: ${Object.keys(allCookies).length}`);
            } catch (bootstrapErr) {
                console.warn(`[GRAPHQL] Bootstrap failed (continuing with sessionid only):`, bootstrapErr.message);
            }

            // Step 2: GraphQL request headers
            const headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'X-Requested-With': 'XMLHttpRequest',
                'X-IG-App-ID': '936619743392459',
                'Referer': `https://www.instagram.com/p/${shortcode}/`,
                'Cookie': fullCookieStr
            };

            // Add CSRF token if available
            if (csrfToken) {
                headers['X-CSRFToken'] = csrfToken;
            }

            console.log(`[GRAPHQL] Shortcode: ${shortcode}, delay: ${delayMs}ms`);

            // Helper: fetch with retry + exponential backoff
            const fetchWithRetry = async (fetchUrl, retries = 3) => {
                for (let attempt = 0; attempt <= retries; attempt++) {
                    const res = await net.fetch(fetchUrl, { headers });

                    if (res.status === 200) return res;

                    if (res.status === 429 || res.status === 401) {
                        const backoffMs = [5000, 15000, 30000][attempt] || 30000;
                        console.warn(`[GRAPHQL] HTTP ${res.status}, retry ${attempt + 1}/${retries} after ${backoffMs}ms...`);
                        if (attempt < retries) {
                            await new Promise(r => setTimeout(r, backoffMs));
                            continue;
                        }
                    }

                    // Non-retryable error or out of retries
                    const errText = await res.text();
                    return { _error: true, status: res.status, text: errText.substring(0, 300) };
                }
            };

            // Step 3: Fetch first page
            const vars1 = JSON.stringify({ shortcode, first: 50 });
            const url1 = `https://www.instagram.com/graphql/query/?query_hash=${QUERY_HASH}&variables=${encodeURIComponent(vars1)}`;

            const res1 = await fetchWithRetry(url1);

            if (res1?._error) {
                return [{ id: 0, username: 'hata', text: `HTTP ${res1.status}: ${res1.text}` }];
            }

            const data1 = await res1.json();
            const edgeInfo = data1?.data?.shortcode_media?.edge_media_to_parent_comment;
            if (!edgeInfo) return [{ id: 0, username: 'hata', text: 'Yanıt yapısı geçersiz. Session ID\'nin geçerli & aktif olduğundan emin olun.' }];

            const totalCount = edgeInfo.count || 0;
            console.log(`[GRAPHQL] Total: ${totalCount}`);

            let allComments = [];
            for (const edge of (edgeInfo.edges || [])) {
                const u = edge.node?.owner?.username;
                if (u) allComments.push({ username: u, text: edge.node.text || '' });
            }

            let hasNext = edgeInfo.page_info?.has_next_page || false;
            let cursor = edgeInfo.page_info?.end_cursor;

            // Step 4: Paginate with retry
            while (hasNext && cursor) {
                await new Promise(r => setTimeout(r, delayMs));
                const vars = JSON.stringify({ shortcode, first: 50, after: cursor });
                const pageUrl = `https://www.instagram.com/graphql/query/?query_hash=${QUERY_HASH}&variables=${encodeURIComponent(vars)}`;

                try {
                    const pageRes = await fetchWithRetry(pageUrl, 2);

                    if (pageRes?._error) {
                        console.warn(`[GRAPHQL] Page fetch failed at ${allComments.length} comments, stopping pagination.`);
                        break;
                    }

                    const pageData = await pageRes.json();
                    const ei = pageData.data.shortcode_media.edge_media_to_parent_comment;
                    for (const edge of (ei.edges || [])) {
                        const u = edge.node?.owner?.username;
                        if (u) allComments.push({ username: u, text: edge.node.text || '' });
                    }
                    hasNext = ei.page_info?.has_next_page || false;
                    cursor = ei.page_info?.end_cursor;
                } catch { break; }

                if (totalCount > 0) {
                    console.log(`[GRAPHQL] ${allComments.length}/${totalCount} (${Math.round(allComments.length / totalCount * 100)}%)`);
                }
            }

            console.log(`[GRAPHQL] Done: ${allComments.length} comments`);
            if (allComments.length === 0) return [{ id: 0, username: 'hata', text: 'Yorum bulunamadı.' }];

            // Deduplicate
            const result = [];
            const seen = new Set();
            for (const c of allComments) {
                if (c.username && !seen.has(c.username)) {
                    seen.add(c.username);
                    result.push({ id: seen.size, username: c.username, picUrl: null, text: c.text || 'Katılıyorum' });
                }
            }
            console.log(`[GRAPHQL] ${result.length} unique`);
            return result;
        } catch (err) {
            console.error('[GRAPHQL] Fatal:', err);
            return [{ id: 0, username: 'hata', text: 'GraphQL Hatası: ' + (err.message || String(err)) }];
        }
    });

    // ========== Native Scraper (BrowserWindow login) ==========
    ipcMain.handle('scrape-comments', async (event, data) => {
        return [{ id: 0, username: 'hata', text: 'Bu motor artık desteklenmiyor. InstaTouch veya Apify kullanın.' }];
    });

    // ========== Save JSON Dialog ==========
    ipcMain.handle('save-json-dialog', async (event, data) => {
        try {
            const result = await dialog.showSaveDialog({
                title: 'Yorumları Kaydet',
                defaultPath: `instagram-yorumlar-${Date.now()}.json`,
                filters: [{ name: 'JSON Dosyası', extensions: ['json'] }]
            });
            if (result.canceled || !result.filePath) return { success: false, reason: 'cancelled' };
            fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf-8');
            return { success: true, filePath: result.filePath };
        } catch (err) {
            console.error('[SAVE-JSON] Error:', err);
            return { success: false, reason: err.message };
        }
    });

    // ========== Open JSON Dialog ==========
    ipcMain.handle('open-json-dialog', async () => {
        try {
            const result = await dialog.showOpenDialog({
                title: 'Yorum Dosyası Seç',
                filters: [{ name: 'JSON Dosyası', extensions: ['json'] }],
                properties: ['openFile']
            });
            if (result.canceled || result.filePaths.length === 0) return { success: false, reason: 'cancelled' };
            const content = fs.readFileSync(result.filePaths[0], 'utf-8');
            const parsed = JSON.parse(content);
            return { success: true, data: parsed, filePath: result.filePaths[0] };
        } catch (err) {
            console.error('[OPEN-JSON] Error:', err);
            return { success: false, reason: err.message };
        }
    });

    // ========== Export Excel (Gala kazanan listesi) ==========
    ipcMain.handle('export-excel', async (_event, { data: rows, fileName }) => {
        try {
            const result = await dialog.showSaveDialog({
                title: 'Excel Olarak Kaydet',
                defaultPath: fileName || `gala_kazananlar_listesi.xlsx`,
                filters: [{ name: 'Excel', extensions: ['xlsx'] }]
            });
            if (result.canceled || !result.filePath) return { success: false, reason: 'cancelled' };

            const worksheet = XLSX.utils.json_to_sheet(rows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Kazananlar');
            XLSX.writeFile(workbook, result.filePath);

            return { success: true, filePath: result.filePath };
        } catch (err) {
            console.error('[EXPORT-EXCEL] Error:', err);
            return { success: false, reason: err.message };
        }
    });

    // ========== Read Excel (Gala katılımcı/ödül listesi) ==========
    ipcMain.handle('read-excel', async () => {
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

            return { success: true, data: rows, fileName: path.basename(filePath) };
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

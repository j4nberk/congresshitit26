import { startTransition, useDeferredValue, useEffect, useEffectEvent, useState } from 'react';
import {
  Activity,
  ArrowDownAZ,
  ArrowUpDown,
  BookUser,
  Clock3,
  Download,
  FileText,
  GraduationCap,
  LoaderCircle,
  Radio,
  RefreshCw,
  ShieldCheck,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';

const DEFAULT_CONFIG = {
  baseUrl: '',
  apiKey: '',
};

const DEFAULT_CACHE = {
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
};

function normalizeBaseUrl(value) {
  return value.trim().replace(/\/+$/, '');
}

function formatDate(value) {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(parsed);
}

function mergeLiveFeed(nextItems, prevItems) {
  const merged = new Map();

  [...nextItems, ...prevItems].forEach((item) => {
    const key = `${item.form_entry_id || 0}:${item.entry_id || 0}:${item.submitted_at || ''}`;
    if (!merged.has(key)) {
      merged.set(key, item);
    }
  });

  return Array.from(merged.values()).slice(0, 14);
}

function buildParticipantKey(item) {
  return `${item?.form_entry_id || 0}:${item?.entry_id || 0}`;
}

function pruneLiveFeed(items, participants) {
  const activeKeys = new Set((participants || []).map((participant) => buildParticipantKey(participant)));
  return (items || []).filter((item) => activeKeys.has(buildParticipantKey(item))).slice(0, 14);
}

function App() {
  const [loaded, setLoaded] = useState(false);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [sort, setSort] = useState(DEFAULT_CACHE.sort);
  const [bootstrap, setBootstrap] = useState(DEFAULT_CACHE.bootstrap);
  const [participants, setParticipants] = useState(DEFAULT_CACHE.participants);
  const [workshops, setWorkshops] = useState(DEFAULT_CACHE.workshops);
  const [liveFeed, setLiveFeed] = useState(DEFAULT_CACHE.liveFeed);
  const [lastSeenEntryId, setLastSeenEntryId] = useState(DEFAULT_CACHE.lastSeenEntryId);
  const [lastSyncAt, setLastSyncAt] = useState(DEFAULT_CACHE.lastSyncAt);
  const [selectedWorkshopKey, setSelectedWorkshopKey] = useState(DEFAULT_CACHE.selectedWorkshopKey);
  const [pollingEnabled, setPollingEnabled] = useState(DEFAULT_CACHE.pollingEnabled);
  const [stateToken, setStateToken] = useState(DEFAULT_CACHE.stateToken);
  const [status, setStatus] = useState({
    connected: false,
    syncing: false,
    testing: false,
    exporting: false,
    error: '',
    message: '',
  });

  const deferredParticipants = useDeferredValue(participants);
  const sessionList = workshops.flatMap((workshop) =>
    workshop.sessions.map((session) => ({
      key: `${workshop.tur}-${workshop.no}-${session.id}`,
      workshop,
      session,
    })),
  );
  const selectedSessionItem = sessionList.find((item) => item.key === selectedWorkshopKey) || sessionList[0] || null;
  const selectedSessionStudents = useDeferredValue(selectedSessionItem?.session?.students || []);
  const totalParticipants = bootstrap?.total_participants || participants.length;

  async function syncDashboard(showSpinner = true) {
    if (!window.electronAPI || !config.baseUrl || !config.apiKey) {
      return false;
    }

    if (showSpinner) {
      setStatus((prev) => ({ ...prev, syncing: true, error: '', message: '' }));
    } else {
      setStatus((prev) => ({ ...prev, error: '', message: '' }));
    }

    try {
      const response = await window.electronAPI.loadDashboard({
        config,
        sort,
      });

      if (!response.success) {
        throw new Error(response.error || 'Senkronizasyon başarısız oldu.');
      }

      startTransition(() => {
        setBootstrap(response.data.bootstrap);
        setParticipants(response.data.participants.items || []);
        setWorkshops(response.data.workshops.items || []);
        setLastSeenEntryId((prev) => Math.max(prev, response.data.bootstrap.last_entry_id || 0));
        setLastSyncAt(response.data.bootstrap.generated_at || new Date().toISOString());
        setStateToken(response.data.bootstrap.state_token || response.data.participants.state_token || '');
        setLiveFeed((prev) => {
          const nextParticipants = response.data.participants.items || [];
          const nextFeed = pruneLiveFeed(prev, nextParticipants);

          if (nextFeed.length > 0) {
            return nextFeed;
          }

          return nextParticipants.slice(0, 8);
        });
      });

      setStatus((prev) => ({
        ...prev,
        connected: true,
        syncing: false,
        error: '',
        message: 'Veriler güncellendi.',
      }));
      return true;
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        connected: false,
        syncing: false,
        error: error.message || 'Senkronizasyon başarısız oldu.',
      }));
      return false;
    }
  }

  const runPollingCycle = useEffectEvent(async () => {
    if (!window.electronAPI || !config.baseUrl || !config.apiKey || !pollingEnabled) {
      return;
    }

    try {
      const response = await window.electronAPI.pollLive({
        config,
        afterEntryId: lastSeenEntryId,
      });

      if (!response.success) {
        throw new Error(response.error || 'Canlı izleme bağlantısı kesildi.');
      }

      const data = response.data;
      const nextStateToken = data.state_token || '';
      let shouldRefreshSnapshot = false;

      setStatus((prev) => ({
        ...prev,
        connected: true,
        error: '',
      }));

      setLastSyncAt(data.generated_at || new Date().toISOString());

      if (data.last_entry_id && data.last_entry_id > lastSeenEntryId) {
        setLastSeenEntryId(data.last_entry_id);
      }

      if (data.items?.length) {
        setLiveFeed((prev) => mergeLiveFeed(data.items, prev));
        shouldRefreshSnapshot = true;
      }

      if (typeof data.total_participants === 'number' && data.total_participants !== totalParticipants) {
        shouldRefreshSnapshot = true;
      }

      if (nextStateToken && nextStateToken !== stateToken) {
        setStateToken(nextStateToken);
        shouldRefreshSnapshot = true;
      }

      if (shouldRefreshSnapshot) {
        await syncDashboard(false);
      }
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        connected: false,
        error: error.message || 'Canlı izleme bağlantısı kesildi.',
      }));
    }
  });

  async function handlePollingToggle() {
    if (pollingEnabled) {
      setPollingEnabled(false);
      setStatus((prev) => ({
        ...prev,
        error: '',
        message: 'Canlı polling durduruldu.',
      }));
      return;
    }

    const synced = await syncDashboard(true);
    if (synced) {
      setPollingEnabled(true);
      setStatus((prev) => ({
        ...prev,
        message: 'Canlı polling başlatıldı.',
      }));
    }
  }

  async function handleConnectionTest() {
    if (!window.electronAPI) {
      return;
    }

    setStatus((prev) => ({ ...prev, testing: true, error: '', message: '' }));

    try {
      const response = await window.electronAPI.testConnection(config);
      if (!response.success) {
        throw new Error(response.error || 'Bağlantı kurulamadı.');
      }

      setStatus((prev) => ({
        ...prev,
        testing: false,
        connected: true,
        error: '',
        message: 'API bağlantısı başarılı.',
      }));
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        testing: false,
        connected: false,
        error: error.message || 'Bağlantı kurulamadı.',
      }));
    }
  }

  async function handleExport(document) {
    if (!window.electronAPI) {
      return;
    }

    setStatus((prev) => ({ ...prev, exporting: true, error: '', message: '' }));

    try {
      const response = await window.electronAPI.exportPdf(document);
      if (!response.success) {
        throw new Error(response.error || 'PDF oluşturulamadı.');
      }

      setStatus((prev) => ({
        ...prev,
        exporting: false,
        error: '',
        message: response.filePath ? `PDF kaydedildi: ${response.filePath}` : 'PDF kaydedildi.',
      }));
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        exporting: false,
        error: error.message || 'PDF oluşturulamadı.',
      }));
    }
  }

  useEffect(() => {
    if (!window.electronAPI) {
      setLoaded(true);
      return;
    }

    window.electronAPI.loadSettings().then((saved) => {
      const savedConfig = saved?.config || DEFAULT_CONFIG;
      const savedCache = saved?.cache || DEFAULT_CACHE;

      setConfig({
        baseUrl: savedConfig.baseUrl || '',
        apiKey: savedConfig.apiKey || '',
      });
      setSort(savedCache.sort || 'basvuru');
      setBootstrap(savedCache.bootstrap || null);
      setParticipants(savedCache.participants || []);
      setWorkshops(savedCache.workshops || []);
      setLiveFeed(savedCache.liveFeed || []);
      setLastSeenEntryId(savedCache.lastSeenEntryId || 0);
      setLastSyncAt(savedCache.lastSyncAt || '');
      setSelectedWorkshopKey(savedCache.selectedWorkshopKey || '');
      setPollingEnabled(savedCache.pollingEnabled ?? false);
      setStateToken(savedCache.stateToken || '');
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded || !window.electronAPI) {
      return;
    }

    const timer = setTimeout(() => {
      window.electronAPI.saveSettings({
        config,
        cache: {
          sort,
          bootstrap,
          participants,
          workshops,
          liveFeed,
          lastSeenEntryId,
          lastSyncAt,
          selectedWorkshopKey,
          pollingEnabled,
          stateToken,
        },
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [loaded, config, sort, bootstrap, participants, workshops, liveFeed, lastSeenEntryId, lastSyncAt, selectedWorkshopKey, pollingEnabled, stateToken]);

  useEffect(() => {
    if (!loaded || !config.baseUrl || !config.apiKey) {
      return;
    }

    syncDashboard(false);
  }, [loaded, sort]);

  useEffect(() => {
    if (!loaded || !config.baseUrl || !config.apiKey || !pollingEnabled || !window.electronAPI) {
      return;
    }

    let timeoutId = null;
    let cancelled = false;

    const scheduleNext = (delay) => {
      timeoutId = window.setTimeout(async () => {
        if (cancelled) {
          return;
        }

        await runPollingCycle();

        if (!cancelled) {
          scheduleNext(bootstrap?.poll_interval_ms || 5000);
        }
      }, delay);
    };

    scheduleNext(0);

    return () => {
      cancelled = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [loaded, config.baseUrl, config.apiKey, pollingEnabled, bootstrap?.poll_interval_ms]);

  useEffect(() => {
    if (!selectedWorkshopKey && sessionList[0]) {
      setSelectedWorkshopKey(sessionList[0].key);
      return;
    }

    if (selectedWorkshopKey && !sessionList.some((item) => item.key === selectedWorkshopKey) && sessionList[0]) {
      setSelectedWorkshopKey(sessionList[0].key);
    }
  }, [selectedWorkshopKey, workshops]);

  const workshopPdfRows = selectedSessionStudents.map((student, index) => ({
    sira: index + 1,
    ad_soyad: student.ad_soyad,
    donem: student.donem,
    telefon: student.telefon,
    email: student.email,
    paket: student.paket,
    katilimci_turu: student.katilimci_turu,
  }));
  const participantPdfRows = deferredParticipants.map((participant) => ({
    basvuru_no: participant.form_entry_id || '-',
    basvuru_tarihi: formatDate(participant.submitted_at),
    ad_soyad: participant.ad_soyad,
    donem: participant.donem,
    telefon: participant.telefon,
    email: participant.email,
    paket: participant.paket,
    katilimci_turu: participant.katilimci_turu,
    bilimsel_atolye: participant.bilimsel_atolye,
    sosyal_atolye: participant.sosyal_atolye,
  }));

  if (!loaded) {
    return (
      <div className="min-h-screen bg-brand-black text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-brand-300">
          <LoaderCircle className="w-5 h-5 animate-spin" />
          KayıtHitit yükleniyor...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black text-white font-sans" style={{ WebkitAppRegion: 'drag' }}>
      <div className="max-w-[1500px] mx-auto px-5 pt-7 pb-6 md:px-7 md:pt-8 md:pb-8">
        <header className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between" style={{ WebkitAppRegion: 'no-drag' }}>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-brand-200 via-brand-400 to-brand-500 bg-clip-text text-transparent">
              Kayıt<span className="text-white">Hitit</span>
            </h1>
            <p className="text-sm text-brand-100/55 mt-2">
              Hitit Form kayıtlarını canlı izleyin, listeleri sıralayın ve logolu PDF olarak dışa aktarın.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className={`status-pill ${status.connected ? 'status-pill-ok' : 'status-pill-muted'}`}>
              {status.connected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {status.connected ? 'Canlı bağlı' : 'Bağlı değil'}
            </div>
            <img src="./congress-logo.png" alt="Kongre logosu" className="w-12 h-12 rounded-full border border-brand-500/30 shadow-brand object-cover" />
          </div>
        </header>

        <main className="grid gap-5 mt-6" style={{ WebkitAppRegion: 'no-drag' }}>
          <section className="grid gap-5 xl:grid-cols-[1.1fr_1.2fr]">
            <Card
              title="Bağlantı"
              icon={<ShieldCheck className="w-4 h-4" />}
              actions={(
                <div className="flex gap-2">
                  <ActionButton
                    label={status.testing ? 'Test ediliyor' : 'Bağlantıyı Test Et'}
                    icon={<Radio className={`w-4 h-4 ${status.testing ? 'animate-pulse' : ''}`} />}
                    onClick={handleConnectionTest}
                    disabled={status.testing || !config.baseUrl || !config.apiKey}
                    tone="secondary"
                  />
                  <ActionButton
                    label={pollingEnabled ? 'Canlı Polling Durdur' : 'Canlı Polling Başlat'}
                    icon={<Wifi className="w-4 h-4" />}
                    onClick={handlePollingToggle}
                    disabled={status.testing || status.syncing || !config.baseUrl || !config.apiKey}
                    tone="secondary"
                  />
                  <ActionButton
                    label={status.syncing ? 'Senkronize ediliyor' : 'Şimdi Senkronize Et'}
                    icon={<RefreshCw className={`w-4 h-4 ${status.syncing ? 'animate-spin' : ''}`} />}
                    onClick={() => syncDashboard(true)}
                    disabled={status.syncing || !config.baseUrl || !config.apiKey}
                  />
                </div>
              )}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Site URL"
                  value={config.baseUrl}
                  onChange={(value) => setConfig((prev) => ({ ...prev, baseUrl: normalizeBaseUrl(value) }))}
                  placeholder="https://siteadresiniz.com"
                />
                <Field
                  label="Masaüstü API Anahtarı"
                  value={config.apiKey}
                  onChange={(value) => setConfig((prev) => ({ ...prev, apiKey: value.trim() }))}
                  placeholder="kh_..."
                  type="password"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-5 mt-5">
                <MetricCard icon={<BookUser className="w-4 h-4" />} label="Hedef Form" value={bootstrap?.form?.title || 'Seçilmedi'} />
                <MetricCard icon={<Users className="w-4 h-4" />} label="Toplam Katılımcı" value={String(totalParticipants || 0)} />
                <MetricCard icon={<Clock3 className="w-4 h-4" />} label="Son Senkron" value={lastSyncAt ? formatDate(lastSyncAt) : 'Henüz yok'} />
                <MetricCard icon={<Activity className="w-4 h-4" />} label="Yenileme" value={`${Math.round((bootstrap?.poll_interval_ms || 5000) / 1000)} sn`} />
                <MetricCard icon={<Wifi className="w-4 h-4" />} label="Canlı Polling" value={pollingEnabled ? 'Açık' : 'Kapalı'} />
              </div>

              {(status.error || status.message) && (
                <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${status.error ? 'border-red-500/35 bg-red-500/10 text-red-200' : 'border-brand-500/30 bg-brand-500/10 text-brand-100'}`}>
                  {status.error || status.message}
                </div>
              )}
            </Card>

            <Card
              title="Canlı Akış"
              icon={<Wifi className="w-4 h-4" />}
              subtitle="5 saniyelik polling ile yeni başvurular üstte görünür."
            >
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {(bootstrap?.workshop_summary?.bilimsel || []).slice(0, 4).map((item) => (
                  <SummaryTile key={`bilimsel-${item.no}`} item={item} title={`Bilimsel #${item.no}`} />
                ))}
              </div>

              <div className="mt-5 overflow-hidden rounded-3xl border border-white/8 bg-white/3">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Son Kayıtlar</h3>
                    <p className="text-xs text-brand-100/50">Yeni gelen öğrenciler form geliş sırasına göre listelenir.</p>
                  </div>
                  <span className="status-pill status-pill-soft">
                    {liveFeed.length} kayıt
                  </span>
                </div>

                <div className="max-h-[390px] overflow-y-auto">
                  {liveFeed.length === 0 ? (
                    <div className="px-4 py-10 text-sm text-brand-100/50">Canlı akış henüz başlamadı. Bağlantı testinden sonra senkronize edin.</div>
                  ) : (
                    liveFeed.map((item) => (
                      <div key={`${item.form_entry_id}-${item.entry_id}-${item.submitted_at}`} className="px-4 py-3 border-b border-white/6 last:border-b-0 hover:bg-white/[0.04] transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-white">{item.ad_soyad || 'İsimsiz kayıt'}</div>
                            <div className="text-xs text-brand-100/55 mt-1">{item.donem || 'Dönem yok'} / {item.email || 'E-posta yok'}</div>
                            <div className="text-xs text-brand-100/45 mt-2">{item.bilimsel_atolye || 'Bilimsel atama yok'}</div>
                            <div className="text-xs text-brand-100/45">{item.sosyal_atolye || 'Sosyal atama yok'}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs font-semibold text-brand-300">#{item.form_entry_id || '-'}</div>
                            <div className="text-[11px] text-brand-100/45 mt-1">{formatDate(item.submitted_at)}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <Card
              title="Listeler ve Export"
              icon={<FileText className="w-4 h-4" />}
              actions={(
                <div className="flex items-center gap-2">
                  <SortSwitch sort={sort} onChange={setSort} />
                  <ActionButton
                    label={status.exporting ? 'PDF hazırlanıyor' : 'Toplam Liste PDF'}
                    icon={<Download className="w-4 h-4" />}
                    onClick={() => handleExport({
                      type: 'participants',
                      title: 'Toplam Katılımcı Listesi',
                      subtitle: bootstrap?.form?.title || 'KayıtHitit',
                      sort,
                      rows: participantPdfRows,
                    })}
                    disabled={status.exporting || participantPdfRows.length === 0}
                  />
                </div>
              )}
            >
              <div className="overflow-hidden rounded-3xl border border-white/8 bg-white/3">
                <div className="grid grid-cols-[110px_150px_1.6fr_1fr_1fr_1.6fr] gap-3 px-4 py-3 border-b border-white/8 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-100/45">
                  <div>Başvuru</div>
                  <div>Tarih</div>
                  <div>Ad Soyad</div>
                  <div>Dönem</div>
                  <div>Paket</div>
                  <div>Bilimsel / Sosyal</div>
                </div>
                <div className="max-h-[560px] overflow-y-auto">
                  {deferredParticipants.length === 0 ? (
                    <div className="px-4 py-10 text-sm text-brand-100/50">Katılımcı listesi boş. Önce bağlantı kurup veriyi çekin.</div>
                  ) : (
                    deferredParticipants.map((participant) => (
                      <div key={`${participant.form_entry_id}-${participant.entry_id}`} className="grid grid-cols-[110px_150px_1.6fr_1fr_1fr_1.6fr] gap-3 px-4 py-3 border-b border-white/6 last:border-b-0 text-sm hover:bg-white/[0.04] transition-colors">
                        <div className="font-semibold text-brand-200">#{participant.form_entry_id || '-'}</div>
                        <div className="text-brand-100/60">{formatDate(participant.submitted_at)}</div>
                        <div>
                          <div className="font-semibold text-white">{participant.ad_soyad}</div>
                          <div className="text-xs text-brand-100/45 mt-1">{participant.email || '-'}</div>
                        </div>
                        <div className="text-brand-100/75">{participant.donem || '-'}</div>
                        <div className="text-brand-100/75">{participant.paket || '-'}</div>
                        <div className="text-xs text-brand-100/60 leading-5">
                          <div>{participant.bilimsel_atolye || '-'}</div>
                          <div>{participant.sosyal_atolye || '-'}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>

            <Card
              title="Atölye Listeleri"
              icon={<GraduationCap className="w-4 h-4" />}
              actions={selectedSessionItem ? (
                <ActionButton
                  label={status.exporting ? 'PDF hazırlanıyor' : 'Seçili Atölye PDF'}
                  icon={<Download className="w-4 h-4" />}
                  onClick={() => handleExport({
                    type: 'workshop',
                    title: selectedSessionItem.workshop.name || `${selectedSessionItem.workshop.title} #${selectedSessionItem.workshop.no}`,
                    subtitle: `${selectedSessionItem.workshop.title} #${selectedSessionItem.workshop.no} / ${selectedSessionItem.session.session_label}`,
                    sort,
                    rows: workshopPdfRows,
                  })}
                  disabled={status.exporting || workshopPdfRows.length === 0}
                />
              ) : null}
            >
              <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
                <div className="rounded-3xl border border-white/8 bg-white/3 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/8 text-sm font-semibold">Atölye / Oturum Seç</div>
                  <div className="max-h-[520px] overflow-y-auto p-2">
                    {sessionList.length === 0 ? (
                      <div className="px-3 py-6 text-sm text-brand-100/50">Atölye verisi henüz gelmedi.</div>
                    ) : (
                      sessionList.map((item) => {
                        const isActive = item.key === selectedWorkshopKey;
                        return (
                          <button
                            key={item.key}
                            onClick={() => setSelectedWorkshopKey(item.key)}
                            className={`w-full text-left rounded-2xl px-3 py-3 mb-2 border transition-all ${isActive ? 'border-brand-500/50 bg-brand-500/12' : 'border-white/6 bg-white/[0.03] hover:bg-white/[0.05]'}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-white">{item.workshop.title} #{item.workshop.no}</div>
                                <div className="text-xs text-brand-100/55 mt-1">{item.workshop.name}</div>
                                <div className="text-xs text-brand-300 mt-2">{item.session.session_label}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-semibold text-brand-200">{item.session.students.length}</div>
                                <div className="text-[11px] text-brand-100/45">{item.session.remaining} boş</div>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/8 bg-white/3 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {selectedSessionItem
                          ? `${selectedSessionItem.workshop.title} #${selectedSessionItem.workshop.no} / ${selectedSessionItem.session.session_label}`
                          : 'Atölye seçilmedi'}
                      </div>
                      <div className="text-xs text-brand-100/50 mt-1">
                        {selectedSessionItem
                          ? `${selectedSessionItem.workshop.name} / ${selectedSessionStudents.length} katılımcı`
                          : 'PDF export seçili listeyi kullanır.'}
                      </div>
                    </div>
                    {selectedSessionItem && (
                      <span className="status-pill status-pill-soft">
                        {selectedSessionItem.session.filled}/{selectedSessionItem.session.capacity}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-[56px_1.5fr_1fr_1fr_1.4fr] gap-3 px-4 py-3 border-b border-white/8 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-100/45">
                    <div>Sıra</div>
                    <div>Ad Soyad</div>
                    <div>Dönem</div>
                    <div>Paket</div>
                    <div>İletişim</div>
                  </div>

                  <div className="max-h-[520px] overflow-y-auto">
                    {selectedSessionStudents.length === 0 ? (
                      <div className="px-4 py-10 text-sm text-brand-100/50">Bu oturumda öğrenci yok.</div>
                    ) : (
                      selectedSessionStudents.map((student, index) => (
                        <div key={`${student.form_entry_id}-${student.entry_id}-${index}`} className="grid grid-cols-[56px_1.5fr_1fr_1fr_1.4fr] gap-3 px-4 py-3 border-b border-white/6 last:border-b-0 text-sm hover:bg-white/[0.04] transition-colors">
                          <div className="font-semibold text-brand-200">{index + 1}</div>
                          <div>
                            <div className="font-semibold text-white">{student.ad_soyad}</div>
                            <div className="text-xs text-brand-100/45 mt-1">#{student.form_entry_id || '-'}</div>
                          </div>
                          <div className="text-brand-100/70">{student.donem || '-'}</div>
                          <div className="text-brand-100/70">{student.paket || '-'}</div>
                          <div className="text-xs text-brand-100/60 leading-5">
                            <div>{student.telefon || '-'}</div>
                            <div>{student.email || '-'}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}

function Card({ title, subtitle, icon, actions, children }) {
  return (
    <section className="card-surface">
      <div className="flex flex-col gap-4 border-b border-white/8 px-5 py-5 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-brand-200 text-sm font-semibold">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-brand-500/12 border border-brand-500/20 text-brand-300">
              {icon}
            </span>
            {title}
          </div>
          {subtitle && <p className="text-sm text-brand-100/50 mt-2">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.22em] text-brand-100/45">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-brand-100/25 focus:border-brand-500/45 focus:bg-white/6"
      />
    </label>
  );
}

function MetricCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-brand-100/40">
        {icon}
        {label}
      </div>
      <div className="mt-3 text-sm font-semibold text-white leading-6">{value}</div>
    </div>
  );
}

function SummaryTile({ title, item }) {
  const totalRemaining = item.sessions.reduce((sum, session) => sum + session.remaining, 0);
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4">
      <div className="text-xs uppercase tracking-[0.18em] text-brand-100/40">{title}</div>
      <div className="mt-2 text-sm font-semibold text-white">{item.name}</div>
      <div className="mt-3 text-xs text-brand-100/50">{item.sessions.map((session) => `${session.session_label}: ${session.remaining} boş`).join(' / ')}</div>
      <div className="mt-3 text-sm text-brand-200">{totalRemaining} toplam boş yer</div>
    </div>
  );
}

function ActionButton({ label, icon, onClick, disabled, tone = 'primary' }) {
  const toneClass = tone === 'secondary'
    ? 'border-white/10 bg-white/[0.03] text-brand-100/80 hover:bg-white/[0.06]'
    : 'border-brand-500/30 bg-brand-600/85 text-white hover:bg-brand-500';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition-all ${toneClass} disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {icon}
      {label}
    </button>
  );
}

function SortSwitch({ sort, onChange }) {
  return (
    <div className="inline-flex rounded-2xl border border-white/10 bg-white/[0.03] p-1">
      <button
        onClick={() => onChange('basvuru')}
        className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${sort === 'basvuru' ? 'bg-brand-500/14 text-brand-100' : 'text-brand-100/55 hover:text-white'}`}
      >
        <ArrowUpDown className="w-4 h-4" />
        Başvuru
      </button>
      <button
        onClick={() => onChange('alfabetik')}
        className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${sort === 'alfabetik' ? 'bg-brand-500/14 text-brand-100' : 'text-brand-100/55 hover:text-white'}`}
      >
        <ArrowDownAZ className="w-4 h-4" />
        Alfabetik
      </button>
    </div>
  );
}

export default App;

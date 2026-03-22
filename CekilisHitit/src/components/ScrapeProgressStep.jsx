import React, { useEffect, useState, useRef, memo } from 'react';
import { Loader2, CheckCircle2, Save, ChevronDown, ChevronUp } from 'lucide-react';

function ScrapeProgressStep({ data, onReset }) {
    const [phase, setPhase] = useState('fetching'); // fetching -> saving -> done
    const [progress, setProgress] = useState(0);
    const [scrapeError, setScrapeError] = useState(null);
    const [errorLog, setErrorLog] = useState('');
    const [showLog, setShowLog] = useState(false);
    const [comments, setComments] = useState([]);
    const [savedPath, setSavedPath] = useState(null);
    const hasFetched = useRef(false);

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;

        let isMounted = true;
        const fetchComments = async () => {
            try {
                const progressInterval = setInterval(() => {
                    setProgress((p) => (p >= 90 ? 90 : p + 5));
                }, 500);

                let result = [];

                if (data.scrapeEngine === 'apify') {
                    result = await window.electronAPI.scrapeApify({
                        url: data.url,
                        token: data.apifyToken
                    });
                } else if (data.scrapeEngine === 'graphapi') {
                    result = await window.electronAPI.scrapeGraphApi({
                        url: data.url,
                        sessionId: data.sessionId || '',
                        rps: data.rps || 250
                    });
                } else {
                    result = await window.electronAPI.scrapeComments({
                        url: data.url,
                        apiParams: data.apiParams
                    });
                }

                clearInterval(progressInterval);
                if (!isMounted) return;
                setProgress(100);

                if (!Array.isArray(result) || result.length === 0) {
                    setScrapeError('Yorumlar çekilemedi veya gönderi yapılandırması uygun değil.');
                    setErrorLog('Result was empty or not an array.\nRaw result: ' + JSON.stringify(result, null, 2));
                    return;
                }

                if (result.length === 1 && result[0].username === 'hata') {
                    const errText = result[0].text || 'Bilinmeyen scraper hatası.';
                    setScrapeError(errText);
                    setErrorLog('Scraper returned error object:\n' + JSON.stringify(result[0], null, 2));
                    return;
                }

                setComments(result);
                setPhase('saving');
            } catch (err) {
                if (isMounted) {
                    setProgress(100);
                    const errMsg = err?.message || err?.toString() || 'Bilinmeyen hata';
                    setScrapeError('Hata: ' + errMsg);
                    setErrorLog('Exception caught:\n' + (err?.stack || err?.toString() || JSON.stringify(err)));
                }
            }
        };

        fetchComments();
        return () => { isMounted = false; };
    }, []);

    const handleSave = async () => {
        const payload = {
            meta: {
                url: data.url,
                engine: data.scrapeEngine,
                date: new Date().toISOString(),
                totalComments: comments.length,
                uniqueUsers: new Set(comments.map(c => c.username)).size
            },
            comments
        };

        const result = await window.electronAPI.saveJsonFile(payload);
        if (result.success) {
            setSavedPath(result.filePath);
            setPhase('done');
        }
    };

    const uniqueCount = new Set(comments.map(c => c.username)).size;

    const getProgressText = (p) => {
        if (p < 30) return "Sayfa yükleniyor...";
        if (p < 60) return "Yorumlar taranıyor...";
        if (p < 85) return "Daha fazla yorum yükleniyor...";
        return "Liste hazırlanıyor...";
    };

    return (
        <div
            className="w-full flex flex-col items-center justify-center min-h-[400px]"
            style={{ animation: 'fadeIn 0.3s ease both' }}
        >
            {scrapeError && (
                <div className="w-full max-w-md mb-8 text-center">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                        <p className="text-red-400 font-semibold text-lg mb-2">⚠️ Yorum Çekme Hatası</p>
                        <p className="text-red-300/80 text-sm mb-4">{scrapeError}</p>

                        {errorLog && (
                            <button
                                onClick={() => setShowLog(!showLog)}
                                className="flex items-center gap-1 mx-auto mb-3 text-xs text-red-300/60 hover:text-red-300 transition-colors"
                            >
                                {showLog ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                {showLog ? 'Logları Gizle' : 'Logları Gör'}
                            </button>
                        )}

                        {showLog && errorLog && (
                            <pre className="text-left text-[10px] text-red-200/60 bg-black/40 rounded-lg p-3 max-h-40 overflow-auto font-mono whitespace-pre-wrap break-all mb-4 border border-red-500/10">
                                {errorLog}
                            </pre>
                        )}

                        <button
                            onClick={onReset}
                            className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-medium border border-red-500/30 transition-all hover:scale-105 active:scale-95"
                        >
                            Geri Dön ve Tekrar Dene
                        </button>
                    </div>
                </div>
            )}


            {!scrapeError && (
                <>
                    <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                        {phase === 'fetching' && (
                            <div className="absolute inset-0 rounded-full border-4 border-brand-900 border-t-brand-500 animate-[spin_1.5s_linear_infinite]" />
                        )}
                        {phase === 'saving' && (
                            <div className="absolute inset-0 rounded-full border-4 border-brand-500/50 flex items-center justify-center" style={{ animation: 'scaleIn 0.3s ease both' }}>
                                <Save className="w-12 h-12 text-brand-400" />
                            </div>
                        )}
                        {phase === 'done' && (
                            <div className="absolute inset-0 bg-brand-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.5)]" style={{ animation: 'scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) both' }}>
                                <CheckCircle2 className="w-16 h-16 text-brand-900" />
                            </div>
                        )}
                        {phase === 'fetching' && <Loader2 className="w-10 h-10 text-brand-400 animate-spin" />}
                    </div>

                    <div className="text-center flex flex-col items-center justify-center gap-4 w-full max-w-md">
                        {phase === 'fetching' && (
                            <div style={{ animation: 'fadeIn 0.2s ease both' }}>
                                <h3 className="text-xl font-medium text-white mb-2">{getProgressText(progress)}</h3>
                                <p className="text-brand-400 font-mono text-lg">{progress}%</p>
                                <p className="text-brand-100/50 text-xs mt-2 w-64 mx-auto">Instagram'dan yorumlar çekiliyor...</p>
                            </div>
                        )}

                        {phase === 'saving' && (
                            <div style={{ animation: 'fadeIn 0.3s ease both' }} className="w-full">
                                <h3 className="text-xl font-bold text-white mb-2">Yorumlar Hazır!</h3>
                                <div className="bg-brand-gray border border-brand-500/20 rounded-xl p-4 mb-6 text-left">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-brand-100/60 text-sm">Toplam Yorum</span>
                                        <span className="text-white font-bold">{comments.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-brand-100/60 text-sm">Benzersiz Kullanıcı</span>
                                        <span className="text-white font-bold">{uniqueCount}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSave}
                                    className="w-full px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_4px_20px_rgba(22,163,74,0.3)]"
                                >
                                    <Save className="w-5 h-5" />
                                    <span>JSON Olarak Kaydet</span>
                                </button>
                            </div>
                        )}

                        {phase === 'done' && (
                            <div style={{ animation: 'fadeIn 0.3s ease both' }} className="w-full">
                                <h3 className="text-2xl font-bold text-white mb-2">Başarıyla Kaydedildi!</h3>
                                <p className="text-brand-100/50 text-sm mb-1">{comments.length} yorum • {uniqueCount} benzersiz kullanıcı</p>
                                {savedPath && (
                                    <p className="text-brand-400 text-xs font-mono bg-brand-gray/50 rounded-lg p-2 mt-3 break-all">{savedPath}</p>
                                )}
                                <button
                                    onClick={onReset}
                                    className="mt-6 w-full px-8 py-4 bg-brand-gray hover:bg-brand-900 border border-brand-500/20 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                                >
                                    Ana Menüye Dön
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default memo(ScrapeProgressStep);

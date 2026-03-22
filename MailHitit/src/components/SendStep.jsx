import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Play, Square, Download, RotateCcw, CheckCircle, XCircle, Clock, AlertTriangle, Loader2, Mail, SkipForward } from 'lucide-react';

const MAX_VISIBLE_LOGS = 200;

export default function SendStep({ data, setData, onPrev, onReset }) {
    const [status, setStatus] = useState('idle'); // idle | sending | paused | rate-limit | complete | aborted
    const [logs, setLogs] = useState([]);
    const [progress, setProgress] = useState({ sent: 0, failed: 0, skipped: 0, current: 0, total: 0 });
    const [rateLimitResumeAt, setRateLimitResumeAt] = useState(null);
    const [rateLimitRemaining, setRateLimitRemaining] = useState(null);
    const logContainerRef = useRef(null);
    const rateLimitIntervalRef = useRef(null);
    const allLogsRef = useRef([]);

    // Toplam alıcı sayısını excelMeta'dan al (main process hesapladı)
    const estimatedTotal = progress.total || 0;

    // Auto-scroll logs
    useEffect(() => {
        const container = logContainerRef.current;
        if (!container) return;
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 60;
        if (isNearBottom) {
            container.scrollTop = container.scrollHeight;
        }
    }, [logs]);

    // Rate limit countdown timer
    useEffect(() => {
        if (rateLimitResumeAt) {
            rateLimitIntervalRef.current = setInterval(() => {
                const remaining = Math.max(0, new Date(rateLimitResumeAt).getTime() - Date.now());
                setRateLimitRemaining(remaining);
                if (remaining <= 0) {
                    clearInterval(rateLimitIntervalRef.current);
                    setRateLimitResumeAt(null);
                    setRateLimitRemaining(null);
                }
            }, 1000);
            return () => clearInterval(rateLimitIntervalRef.current);
        }
    }, [rateLimitResumeAt]);

    // Listen for progress events
    useEffect(() => {
        if (!window.electronAPI) return;

        window.electronAPI.removeMailProgressListeners();

        window.electronAPI.onMailProgress((progressData) => {
            const { type, index, total, log, message, resumeAt } = progressData;

            // main process'ten gelen 'total' event'i ile toplam sayıyı al
            if (type === 'total') {
                setProgress(prev => ({ ...prev, total }));
                return;
            }

            if (log) {
                allLogsRef.current = [...allLogsRef.current, log];
                setLogs(prev => {
                    const next = [...prev, log];
                    return next.length > MAX_VISIBLE_LOGS ? next.slice(-MAX_VISIBLE_LOGS) : next;
                });
            }

            switch (type) {
                case 'sent':
                    setProgress(prev => ({ ...prev, sent: prev.sent + 1, current: index + 1, total }));
                    break;
                case 'failed':
                    setProgress(prev => ({ ...prev, failed: prev.failed + 1, current: index + 1, total }));
                    break;
                case 'skipped':
                    setProgress(prev => ({ ...prev, skipped: prev.skipped + 1, current: index + 1, total }));
                    break;
                case 'rate-limit':
                    setStatus('rate-limit');
                    setRateLimitResumeAt(resumeAt);
                    break;
                case 'resumed':
                    setStatus('sending');
                    setRateLimitResumeAt(null);
                    setRateLimitRemaining(null);
                    break;
                case 'aborted':
                    setStatus('aborted');
                    break;
                case 'complete':
                    setStatus('complete');
                    setProgress(prev => ({
                        ...prev,
                        sent: progressData.sent,
                        failed: progressData.failed,
                        skipped: progressData.skipped,
                    }));
                    break;
            }
        });

        return () => {
            window.electronAPI.removeMailProgressListeners();
        };
    }, []);

    const handleStart = useCallback(async () => {
        setStatus('sending');
        setLogs([]);
        allLogsRef.current = [];
        setProgress({ sent: 0, failed: 0, skipped: 0, current: 0, total: 0 });

        try {
            // Artık recipients göndermiyoruz — main process kendi oluşturuyor
            await window.electronAPI.sendBulkEmails({
                config: data.config,
                subject: data.subject,
                htmlTemplate: data.htmlContent,
                emailColumn: data.emailColumn,
                rowRange: data.rowRange,
                placeholderMapping: data.placeholderMapping,
                attachmentPaths: data.attachments.map(a => a.path),
                rateLimit: data.rateLimit,
            });
        } catch (err) {
            console.error('Bulk send error:', err);
        }
    }, [data]);

    const handleStop = async () => {
        await window.electronAPI.stopSending();
    };

    const handleExportLogs = async () => {
        await window.electronAPI.exportLogs(allLogsRef.current);
    };

    const percentComplete = progress.total > 0
        ? Math.round((progress.current / progress.total) * 100)
        : 0;

    const formatTime = (ms) => {
        if (!ms) return '';
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}dk ${seconds}sn`;
    };

    const delayBetween = Math.ceil(3600 / (data.rateLimit || 150));

    return (
        <div className="flex-1 flex flex-col gap-5 py-6" style={{ animation: 'fadeIn 0.3s ease both' }}>

            {/* Summary card */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-brand-gray border border-brand-500/15 rounded-2xl p-4 text-center">
                    <Mail className="w-5 h-5 text-brand-500/60 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-white">{progress.total || '—'}</p>
                    <p className="text-brand-100/40 text-xs">Toplam Alıcı</p>
                </div>
                <div className="bg-brand-gray border border-brand-500/15 rounded-2xl p-4 text-center">
                    <CheckCircle className="w-5 h-5 text-green-400/60 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-green-400">{progress.sent}</p>
                    <p className="text-brand-100/40 text-xs">Gönderildi</p>
                </div>
                <div className="bg-brand-gray border border-brand-500/15 rounded-2xl p-4 text-center">
                    <XCircle className="w-5 h-5 text-red-400/60 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-red-400">{progress.failed}</p>
                    <p className="text-brand-100/40 text-xs">Başarısız</p>
                </div>
                <div className="bg-brand-gray border border-brand-500/15 rounded-2xl p-4 text-center">
                    <SkipForward className="w-5 h-5 text-yellow-400/60 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-yellow-400">{progress.skipped}</p>
                    <p className="text-brand-100/40 text-xs">Atlandı</p>
                </div>
            </div>

            {/* Progress bar */}
            {status !== 'idle' && (
                <div style={{ animation: 'fadeIn 0.2s ease both' }}>
                    <div className="flex items-center justify-between text-xs text-brand-100/50 mb-2">
                        <span>{progress.current} / {progress.total}</span>
                        <span>{percentComplete}%</span>
                    </div>
                    <div className="w-full h-3 bg-brand-dark rounded-full overflow-hidden border border-brand-500/10">
                        <div
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{
                                width: `${percentComplete}%`,
                                background: status === 'rate-limit'
                                    ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                                    : status === 'aborted'
                                        ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                                        : status === 'complete'
                                            ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                                            : 'linear-gradient(90deg, #4ade80, #22c55e)',
                                ...(status === 'sending' ? { animation: 'pulse-glow 2s ease-in-out infinite' } : {})
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Rate limit warning */}
            {status === 'rate-limit' && (
                <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3" style={{ animation: 'fadeIn 0.2s ease both' }}>
                    <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                    <div>
                        <p className="text-yellow-400 text-sm font-medium">Rate Limit Algılandı</p>
                        <p className="text-yellow-400/70 text-xs">
                            3 ardışık hata oluştu. {rateLimitRemaining ? `Kalan bekleme süresi: ${formatTime(rateLimitRemaining)}` : 'Bekleniyor...'}
                        </p>
                    </div>
                </div>
            )}

            {/* Status message */}
            {status === 'idle' && (
                <div className="bg-brand-gray/50 border border-brand-500/10 rounded-2xl p-6 text-center" style={{ animation: 'fadeIn 0.25s ease both' }}>
                    <Mail className="w-12 h-12 text-brand-500/40 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-white mb-1">Gönderime Hazır</h3>
                    <p className="text-brand-100/50 text-sm mb-3">
                        Alıcılara <b>{delayBetween} saniye</b> aralıkla mail gönderilecek.
                    </p>
                    <p className="text-brand-100/30 text-xs">
                        {data.attachments.length > 0 && `${data.attachments.length} ek dosya`}
                    </p>
                </div>
            )}

            {/* Log stream */}
            {logs.length > 0 && (
                <div className="bg-brand-dark border border-brand-500/10 rounded-2xl overflow-hidden flex-1 min-h-0">
                    <div className="px-4 py-2 border-b border-brand-500/10 flex items-center justify-between">
                        <span className="text-xs text-brand-100/50 font-medium">
                            Gönderim Logları ({allLogsRef.current.length})
                            {allLogsRef.current.length > MAX_VISIBLE_LOGS && (
                                <span className="text-brand-100/30 ml-1">(son {MAX_VISIBLE_LOGS} gösteriliyor)</span>
                            )}
                        </span>
                        {status === 'sending' && (
                            <Loader2 className="w-3 h-3 text-brand-400 animate-spin" />
                        )}
                    </div>
                    <div
                        ref={logContainerRef}
                        className="max-h-[300px] overflow-y-auto p-2 space-y-0.5"
                    >
                        {logs.map((log, i) => (
                            <div
                                key={`${log.index}-${log.timestamp}`}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${log.status === 'sent'
                                    ? 'text-green-400/80'
                                    : log.status === 'failed'
                                        ? 'text-red-400/80 bg-red-500/5'
                                        : 'text-yellow-400/80 bg-yellow-500/5'
                                    }`}
                            >
                                {log.status === 'sent' && <CheckCircle className="w-3 h-3 flex-shrink-0" />}
                                {log.status === 'failed' && <XCircle className="w-3 h-3 flex-shrink-0" />}
                                {log.status === 'skipped' && <SkipForward className="w-3 h-3 flex-shrink-0" />}
                                <span className="font-mono">{String(log.index + 1).padStart(3, ' ')}</span>
                                <span className="truncate flex-1">{log.email}</span>
                                {log.error && <span className="text-red-400/50 truncate max-w-[200px]">{log.error}</span>}
                                <span className="text-brand-100/20 ml-auto flex-shrink-0">
                                    {new Date(log.timestamp).toLocaleTimeString('tr-TR')}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 mt-2">
                {status === 'idle' && (
                    <>
                        <button
                            onClick={onPrev}
                            className="px-6 py-3 rounded-xl text-sm font-medium bg-brand-gray border border-brand-500/15 text-brand-100/60 hover:text-white hover:border-brand-500/30 transition-all flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" /> Geri
                        </button>
                        <button
                            onClick={handleStart}
                            className="flex-1 px-8 py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all bg-brand-600 hover:bg-brand-500 text-white shadow-[0_4px_20px_rgba(22,163,74,0.3)] hover:shadow-[0_4px_25px_rgba(34,197,94,0.5)] active:scale-95"
                        >
                            <Play className="w-5 h-5" /> Gönderime Başla
                        </button>
                    </>
                )}

                {(status === 'sending' || status === 'rate-limit') && (
                    <button
                        onClick={handleStop}
                        className="flex-1 px-8 py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all bg-red-600 hover:bg-red-500 text-white shadow-[0_4px_20px_rgba(239,68,68,0.3)] active:scale-95"
                    >
                        <Square className="w-5 h-5" /> Durdur
                    </button>
                )}

                {(status === 'complete' || status === 'aborted') && (
                    <>
                        <button
                            onClick={handleExportLogs}
                            className="px-6 py-3 rounded-xl text-sm font-medium bg-brand-gray border border-brand-500/15 text-brand-100/60 hover:text-white hover:border-brand-500/30 transition-all flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" /> Logları İndir
                        </button>
                        <button
                            onClick={onReset}
                            className="flex-1 px-8 py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all bg-brand-600 hover:bg-brand-500 text-white shadow-[0_4px_20px_rgba(22,163,74,0.3)] active:scale-95"
                        >
                            <RotateCcw className="w-5 h-5" /> Yeni Gönderim
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

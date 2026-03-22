import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Send, AlertTriangle, CheckCircle, XCircle, Loader2, Save } from 'lucide-react';

const selectionCheckboxClassName = 'mt-0.5 h-4 w-4 min-h-4 min-w-4 flex-shrink-0 cursor-pointer rounded-sm appearance-none border bg-black/40 disabled:cursor-not-allowed disabled:opacity-40';

const parseNumericScore = (value) => {
    if (value === null || value === undefined) return null;

    const normalized = String(value).trim().replace(',', '.');
    if (!normalized) return null;

    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : null;
};

const applyResultThreshold = (students, threshold) => {
    const safeThreshold = Number.isFinite(threshold) ? threshold : 50;
    const mainStudents = students.filter(student => !student.isCoAuthor);
    const decisionByRootId = new Map();

    mainStudents.forEach(student => {
        const score = parseNumericScore(student.score);
        const resultDecision = score === null ? null : (score >= safeThreshold ? 'accept' : 'reject');
        decisionByRootId.set(student.id, resultDecision);
    });

    return students.map(student => {
        const rootId = student.isCoAuthor ? student.parentPaperId : student.id;
        const resultDecision = rootId ? (decisionByRootId.get(rootId) ?? null) : null;
        const normalizedThreshold = resultDecision ? safeThreshold : null;
        const decisionChanged =
            student.resultDecision !== resultDecision ||
            student.resultThreshold !== normalizedThreshold;

        if (!decisionChanged) {
            return student;
        }

        return {
            ...student,
            resultDecision,
            resultThreshold: normalizedThreshold,
            isResultSent: false
        };
    });
};

const buildJobs = (students, settings, selectedStudentIds) => {
    if (!settings || !students.length) return [];

    const selectedIdSet = new Set(selectedStudentIds);
    const jobs = [];

    students
        .filter(student => !student.isCoAuthor)
        .forEach(student => {
            if (!selectedIdSet.has(student.id)) return;
            if (student.isResultSent) return;

            if (!student.resultDecision) return;

            const isAccepted = student.resultDecision === 'accept';
            const template = isAccepted ? settings.templates?.accept : settings.templates?.reject;

            if (!template?.subject?.trim() || !template?.htmlContent?.trim()) {
                return;
            }

            let html = template.htmlContent;
            let subject = template.subject;

            const vars = {
                'ad_soyad': student.name || '',
                'donem': student.term || '',
                'e-posta': student.email || '',
                'tel': student.phone || '',
                'bildiri_basligi': student.paperTitle || '',
                'bildiri_ozeti': student.paperAbstract || '',
                'bildiri_no': student.paperNumber || '',
                'puan': student.score ?? '',
                'atanan_hoca': student.assignedTeacherName || ''
            };

            for (const [k, v] of Object.entries(vars)) {
                const regex = new RegExp(`\\{${k}\\}`, 'g');
                html = html.replace(regex, v);
                subject = subject.replace(regex, v);
            }

            jobs.push({
                studentId: student.id,
                to: student.email,
                subject,
                html,
                isAccepted
            });
        });

    return jobs;
};

export default function Sending() {
    const [students, setStudents] = useState([]);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [thresholdDraft, setThresholdDraft] = useState(50);
    const [appliedThreshold, setAppliedThreshold] = useState(50);
    const [thresholdSaving, setThresholdSaving] = useState(false);
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);

    // Sending state
    const [sending, setSending] = useState(false);
    const [progress, setProgress] = useState(null); // { type, total, index, sent, failed, skipped, message }
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const controller = new AbortController();
        let isMounted = true;

        const loadAllData = async () => {
            if (!window.electronAPI) return;
            setLoading(true);
            try {
                const [sData, stData] = await Promise.all([
                    window.electronAPI.loadData('students'),
                    window.electronAPI.loadSettings()
                ]);
                if (isMounted) {
                    const loadedSettings = stData || null;
                    const savedThreshold = Number.isFinite(loadedSettings?.resultThreshold) ? loadedSettings.resultThreshold : 50;
                    const normalizedStudents = applyResultThreshold(sData || [], savedThreshold);

                    setStudents(normalizedStudents);
                    setSettings(loadedSettings ? { ...loadedSettings, resultThreshold: savedThreshold } : { resultThreshold: savedThreshold });
                    setThresholdDraft(savedThreshold);
                    setAppliedThreshold(savedThreshold);
                    if (window.electronAPI && JSON.stringify(normalizedStudents) !== JSON.stringify(sData || [])) {
                        window.electronAPI.saveData('students', normalizedStudents);
                    }
                    setLoading(false);
                }
            } catch (err) {
                if (isMounted && err.name !== 'AbortError') {
                    console.error('Data load error:', err);
                    setLoading(false);
                }
            }
        };

        loadAllData();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, []);

    const mainStudents = useMemo(
        () => students.filter(student => !student.isCoAuthor),
        [students]
    );

    const acceptedStudents = useMemo(
        () => mainStudents.filter(student => student.resultDecision === 'accept'),
        [mainStudents]
    );

    const rejectedStudents = useMemo(
        () => mainStudents.filter(student => student.resultDecision === 'reject'),
        [mainStudents]
    );

    const selectableStudents = useMemo(
        () => mainStudents.filter(student => student.resultDecision && !student.isResultSent),
        [mainStudents]
    );

    useEffect(() => {
        const eligibleIds = selectableStudents.map(student => student.id);
        const eligibleIdSet = new Set(eligibleIds);

        setSelectedStudentIds(prev => {
            const preserved = prev.filter(id => eligibleIdSet.has(id));
            const next = [...preserved];

            eligibleIds.forEach(id => {
                if (!next.includes(id)) {
                    next.push(id);
                }
            });

            return next;
        });
    }, [selectableStudents]);

    const jobs = useMemo(
        () => buildJobs(students, settings, selectedStudentIds),
        [students, settings, selectedStudentIds]
    );

    const selectedIdSet = useMemo(() => new Set(selectedStudentIds), [selectedStudentIds]);
    const selectedStudents = useMemo(
        () => mainStudents.filter(student => selectedIdSet.has(student.id) && !student.isResultSent && student.resultDecision),
        [mainStudents, selectedIdSet]
    );

    useEffect(() => {
        if (!window.electronAPI) return;
        window.electronAPI.onMailProgress((data) => {
            setProgress(prev => ({ ...prev, ...data }));
            if(data.log) {
                setLogs(prev => [data.log, ...prev]);
            }

            // Başarıyla gönderilen öğrenciyi isSent=true yap
            const eventStatus = data.type === 'sent' ? 'sent' : data.log?.status
            if (eventStatus === 'sent') {
                const sid = data.studentId || data.log?.studentId
                if (sid) {
                    setStudents(prev => {
                        const updated = prev.map(s => s.id === sid ? { ...s, isResultSent: true } : s)
                        window.electronAPI?.saveData('students', updated)
                        return updated
                    })
                }
            }

            if(data.type === 'complete' || data.type === 'aborted') {
                setSending(false);
            }
        });
        return () => window.electronAPI.removeMailProgressListeners();
    }, []);

    const startSending = useCallback(async () => {
        if(!window.electronAPI || selectedStudents.length === 0 || sending) return;

        if (jobs.length === 0) {
            const needsAcceptTemplate = selectedStudents.some(student => student.resultDecision === 'accept');
            const needsRejectTemplate = selectedStudents.some(student => student.resultDecision === 'reject');
            const hasAcceptTemplate = Boolean(settings?.templates?.accept?.subject?.trim() && settings?.templates?.accept?.htmlContent?.trim());
            const hasRejectTemplate = Boolean(settings?.templates?.reject?.subject?.trim() && settings?.templates?.reject?.htmlContent?.trim());

            const missing = [];
            if (needsAcceptTemplate && !hasAcceptTemplate) missing.push('kabul');
            if (needsRejectTemplate && !hasRejectTemplate) missing.push('ret');

            alert(
                missing.length > 0
                    ? `Seçili bildiriler için ${missing.join(' ve ')} mail şablonu eksik. Lütfen Ayarlar ekranından şablonları doldurun.`
                    : 'Seçili bildiriler için gönderilecek mail oluşturulamadı.'
            );
            return;
        }
        
        const confirmMsg = `${jobs.length} öğrenciye mail gönderilecek. Onaylıyor musunuz?\n\nKabul Edilen: ${jobs.filter(j => j.isAccepted).length}\nReddedilen: ${jobs.filter(j => !j.isAccepted).length}`;
        if(!confirm(confirmMsg)) return;

        setSending(true);
        setLogs([]);
        setProgress({ type: 'start', total: jobs.length, index: 0 });

        await window.electronAPI.sendBulkEmails({
            config: settings.config,
            rateLimit: settings.rateLimit,
            jobs
        });
    }, [jobs, selectedStudents, sending, settings]);

    const toggleStudentSelection = useCallback((studentId) => {
        setSelectedStudentIds(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    }, []);

    const toggleDecisionSelection = useCallback((decision, shouldSelect) => {
        const targetIds = mainStudents
            .filter(student => student.resultDecision === decision && !student.isResultSent)
            .map(student => student.id);

        setSelectedStudentIds(prev => {
            const nextSet = new Set(prev);

            targetIds.forEach(id => {
                if (shouldSelect) {
                    nextSet.add(id);
                } else {
                    nextSet.delete(id);
                }
            });

            return Array.from(nextSet);
        });
    }, [mainStudents]);

    const handleApplyThreshold = useCallback(async () => {
        if (!window.electronAPI) return;

        const normalizedThreshold = Number.isFinite(thresholdDraft) ? thresholdDraft : 50;
        const updatedStudents = applyResultThreshold(students, normalizedThreshold);

        setThresholdSaving(true);
        try {
            setStudents(updatedStudents);
            setAppliedThreshold(normalizedThreshold);

            const nextSettings = {
                ...(settings || {}),
                resultThreshold: normalizedThreshold
            };

            setSettings(nextSettings);
            await Promise.all([
                window.electronAPI.saveData('students', updatedStudents),
                window.electronAPI.saveSettings({ resultThreshold: normalizedThreshold })
            ]);
        } finally {
            setThresholdSaving(false);
        }
    }, [settings, students, thresholdDraft]);

    const stopSending = async () => {
        if (!window.electronAPI) return;
        await window.electronAPI.stopSending();
    };

    const clearStudentsSentMark = async () => {
        // İstenirse tüm isSent flagleri temizlenebilir, şimdilik UI'da isSent kullanılmıyor (always process)
    };

    if (loading) return <div>Yükleniyor...</div>;

    if (!settings?.config?.smtpHost) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
                <h3 className="text-xl font-medium mb-2">SMTP Ayarları Eksik</h3>
                <p className="text-brand-100/60 max-w-sm">Lütfen "Ayarlar" sekmesinden SMTP sunucu bilgilerini ve şablonlarınızı yapılandırın.</p>
            </div>
        );
    }

    const acceptedJobs = acceptedStudents.filter(student => !student.isResultSent).length;
    const rejectedJobs = rejectedStudents.filter(student => !student.isResultSent).length;
    const unScoredCount = mainStudents.filter(student => parseNumericScore(student.score) === null).length;
    const selectedAcceptedCount = acceptedStudents.filter(student => !student.isResultSent && selectedIdSet.has(student.id)).length;
    const selectedRejectedCount = rejectedStudents.filter(student => !student.isResultSent && selectedIdSet.has(student.id)).length;
    const acceptedSelectableCount = acceptedStudents.filter(student => !student.isResultSent).length;
    const rejectedSelectableCount = rejectedStudents.filter(student => !student.isResultSent).length;

    return (
        <div className="space-y-6 h-full flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300 pb-28">
            <h2 className="text-xl font-semibold flex items-center gap-2 flex-shrink-0">
                <Send className="text-brand-400" />
                Sonuç Gönderimi
            </h2>

            {!sending && progress?.type !== 'complete' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-brand-900/10 border border-brand-800 p-6 rounded-xl flex-shrink-0">
                    <div>
                        <h3 className="font-medium text-lg mb-2">Gönderim Kriterleri</h3>
                        <p className="text-sm text-brand-100/50 mb-4">Bildiri kabul/red kararını belirleyen minimum puan eşiğini seçin. Puanı girilmemiş ana bildiriler ({unScoredCount} adet) işleme alınmaz.</p>
                        
                        <div className="flex flex-wrap items-center gap-4 bg-black/40 border border-brand-800 p-4 rounded-lg">
                            <label className="text-sm text-brand-100/70 font-medium">Kabul Barajı:</label>
                            <input 
                                type="number" 
                                value={thresholdDraft} 
                                onChange={e => setThresholdDraft(Number.parseFloat(e.target.value) || 0)} 
                                className="w-24 bg-brand-dark border border-brand-800 rounded px-3 py-1.5 text-white font-bold"
                            />
                            <button
                                onClick={handleApplyThreshold}
                                disabled={thresholdSaving}
                                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-brand-500 disabled:opacity-50"
                            >
                                {thresholdSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Eşiği Kaydet ve Uygula
                            </button>
                        </div>
                        <p className="text-xs text-brand-100/35 mt-3">Kayıtlı eşik: {appliedThreshold}. Bu tuşa bastığınızda bildiriler mevcut puanlarıyla tekrar karşılaştırılır ve kararlar belleğe kaydedilir.</p>
                    </div>

                    <div className="bg-black/20 border border-brand-800/50 p-4 rounded-lg flex flex-col justify-center gap-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-brand-100/60">Seçili Gönderim:</span>
                            <span className="font-bold text-white text-lg">{jobs.length}</span>
                        </div>
                        <div className="flex justify-between text-sm border-t border-brand-800/30 pt-2">
                            <span className="text-brand-100/60">Kabul (&gt;= {appliedThreshold} Puan):</span>
                            <span className="font-bold text-green-400">{selectedAcceptedCount} / {acceptedJobs} Kişi</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-brand-100/60">Ret (&lt; {appliedThreshold} Puan):</span>
                            <span className="font-bold text-red-400">{selectedRejectedCount} / {rejectedJobs} Kişi</span>
                        </div>
                    </div>
                </div>
            )}

            {!sending && progress?.type !== 'complete' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-shrink-0">
                    <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-semibold text-green-400">Kabul Edilen Bildiriler</h3>
                                <span className="text-xs text-green-300/70">{acceptedStudents.length} kayıt</span>
                            </div>
                            <button
                                onClick={() => toggleDecisionSelection('accept', selectedAcceptedCount !== acceptedSelectableCount)}
                                disabled={acceptedSelectableCount === 0}
                                className="rounded-lg border border-green-500/20 px-3 py-1.5 text-xs font-medium text-green-300 transition-colors hover:bg-green-500/10 disabled:opacity-40"
                            >
                                {selectedAcceptedCount === acceptedSelectableCount ? 'Seçimi Temizle' : 'Tümünü Seç'}
                            </button>
                        </div>
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {acceptedStudents.length === 0 ? (
                                <div className="rounded-lg border border-green-500/10 bg-black/20 px-4 py-6 text-sm text-brand-100/40">
                                    Kayıtlı eşik sonucuna göre kabul edilen bildiri yok.
                                </div>
                            ) : (
                                acceptedStudents.map(student => (
                                    <div key={student.id} className="rounded-lg border border-green-500/10 bg-black/20 px-4 py-3">
                                        <div className="grid grid-cols-[minmax(0,1fr)_72px] items-start gap-4">
                                            <div className="flex min-w-0 items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIdSet.has(student.id)}
                                                    disabled={student.isResultSent}
                                                    onChange={() => toggleStudentSelection(student.id)}
                                                    className={`${selectionCheckboxClassName} border-green-500/30 checked:border-transparent checked:bg-green-500`}
                                                />
                                                <div className="min-w-0">
                                                    <div className="text-sm font-medium text-white">{student.name}</div>
                                                    <div className="truncate text-xs text-brand-100/45" title={student.paperTitle}>
                                                        {student.paperNumber} • {student.paperTitle}
                                                    </div>
                                                    {student.isResultSent && (
                                                        <div className="mt-1 text-[10px] uppercase tracking-wider text-brand-100/35">Sonuç maili gönderildi</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="w-[72px] text-right">
                                                <div className="text-sm font-bold text-green-400">{student.score ?? '-'}</div>
                                                <div className="text-[10px] uppercase tracking-wider text-green-300/70">Kabul</div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-semibold text-red-400">Reddedilen Bildiriler</h3>
                                <span className="text-xs text-red-300/70">{rejectedStudents.length} kayıt</span>
                            </div>
                            <button
                                onClick={() => toggleDecisionSelection('reject', selectedRejectedCount !== rejectedSelectableCount)}
                                disabled={rejectedSelectableCount === 0}
                                className="rounded-lg border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-40"
                            >
                                {selectedRejectedCount === rejectedSelectableCount ? 'Seçimi Temizle' : 'Tümünü Seç'}
                            </button>
                        </div>
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {rejectedStudents.length === 0 ? (
                                <div className="rounded-lg border border-red-500/10 bg-black/20 px-4 py-6 text-sm text-brand-100/40">
                                    Kayıtlı eşik sonucuna göre reddedilen bildiri yok.
                                </div>
                            ) : (
                                rejectedStudents.map(student => (
                                    <div key={student.id} className="rounded-lg border border-red-500/10 bg-black/20 px-4 py-3">
                                        <div className="grid grid-cols-[minmax(0,1fr)_72px] items-start gap-4">
                                            <div className="flex min-w-0 items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIdSet.has(student.id)}
                                                    disabled={student.isResultSent}
                                                    onChange={() => toggleStudentSelection(student.id)}
                                                    className={`${selectionCheckboxClassName} border-red-500/30 checked:border-transparent checked:bg-red-500`}
                                                />
                                                <div className="min-w-0">
                                                    <div className="text-sm font-medium text-white">{student.name}</div>
                                                    <div className="truncate text-xs text-brand-100/45" title={student.paperTitle}>
                                                        {student.paperNumber} • {student.paperTitle}
                                                    </div>
                                                    {student.isResultSent && (
                                                        <div className="mt-1 text-[10px] uppercase tracking-wider text-brand-100/35">Sonuç maili gönderildi</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="w-[72px] text-right">
                                                <div className="text-sm font-bold text-red-400">{student.score ?? '-'}</div>
                                                <div className="text-[10px] uppercase tracking-wider text-red-300/70">Ret</div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {!sending && progress?.type !== 'complete' && (
                <div className="fixed bottom-6 right-6 z-30">
                    <button 
                        onClick={startSending}
                        disabled={selectedStudents.length === 0}
                        className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-medium flex items-center gap-2 shadow-[0_10px_30px_rgba(22,163,74,0.28)] transition-all border border-brand-500/30 backdrop-blur-sm"
                    >
                        <Send className="w-5 h-5" />
                        {selectedStudents.length > 0 ? `Seçili ${selectedStudents.length} Kişi İçin Gönderimi Başlat` : 'Gönderim İçin Bildiri Seçin'}
                    </button>
                </div>
            )}

            {(sending || progress) && (
                <div className="flex-1 min-h-0 flex flex-col bg-black/40 border border-brand-800 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-medium text-white flex items-center gap-2">
                                {sending && <Loader2 className="w-5 h-5 animate-spin text-brand-400" />}
                                {progress?.type === 'complete' ? 'Gönderim Tamamlandı' : 'Gönderim İşlemi'}
                            </h3>
                            {progress?.message && <p className="text-sm text-yellow-400 mt-1">{progress.message}</p>}
                        </div>
                        {sending && (
                            <button onClick={stopSending} className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors">
                                Durdur
                            </button>
                        )}
                        {progress?.type === 'complete' && (
                            <button onClick={() => { setProgress(null); setLogs([]); }} className="px-4 py-2 bg-brand-800 text-white hover:bg-brand-700 rounded-lg text-sm font-medium transition-colors">
                                Yeni Gönderim
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-6">
                         <div className="bg-brand-900/30 border border-brand-800 p-4 rounded-xl text-center">
                            <div className="text-xs text-brand-100/50 mb-1">Toplam</div>
                            <div className="text-2xl font-bold">{progress?.total || 0}</div>
                        </div>
                        <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl text-center">
                            <div className="text-xs text-green-400/70 mb-1">Başarılı</div>
                            <div className="text-2xl font-bold text-green-400">{progress?.sent || (logs.filter(l => l.status === 'sent').length)}</div>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center">
                            <div className="text-xs text-red-400/70 mb-1">Hatalı</div>
                            <div className="text-2xl font-bold text-red-400">{progress?.failed || logs.filter(l => l.status === 'failed').length}</div>
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl text-center">
                            <div className="text-xs text-yellow-400/70 mb-1">Atlanan</div>
                            <div className="text-2xl font-bold text-yellow-500">{progress?.skipped || logs.filter(l => l.status === 'skipped').length}</div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto bg-black/60 rounded-lg border border-brand-800 p-4 font-mono text-xs">
                        {logs.length === 0 ? (
                            <div className="text-brand-100/30 text-center py-10">Log kaydı bekleniyor...</div>
                        ) : (
                            logs.map((log, i) => (
                                <div key={i} className="mb-2 border-b border-brand-800/30 pb-2 last:border-0 last:pb-0">
                                    <span className="text-brand-100/40 mr-3">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                    {log.status === 'sent' && <span className="text-green-400">✅ BAŞARILI: {log.email}</span>}
                                    {log.status === 'failed' && <span className="text-red-400">❌ HATA: {log.email} - {log.error}</span>}
                                    {log.status === 'skipped' && <span className="text-yellow-400">⚠️ ATLANDI: {log.email} - {log.error}</span>}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

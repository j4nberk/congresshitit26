import React, { useState, useMemo, memo } from 'react';
import { Trophy, RefreshCcw, ExternalLink, Award, AlertCircle, ArrowRight, Download, Home } from 'lucide-react';

function ResultStep({ data, setData, onReset, onNextRound, isFinal }) {
    const { winners, backups } = data;
    const [activeWinners, setActiveWinners] = useState(winners);
    const [activeBackups, setActiveBackups] = useState(backups);

    const currentRoundDef = data.rounds?.[data.currentRound];
    const roundName = currentRoundDef?.name || `Tur ${(data.currentRound || 0) + 1}`;
    const hasMoreRounds = data.rounds && data.currentRound < data.rounds.length - 1;
    const isMultiRound = data.rounds && data.rounds.length > 1;

    // For final view: combine allRoundResults + current round (if not yet saved)
    const allResults = useMemo(() => {
        if (!isFinal) return [];
        const results = [...(data.allRoundResults || [])];
        // If there are unsaved current winners, add them
        if (winners.length > 0) {
            results.push({
                round: results.length + 1,
                name: currentRoundDef?.name || `Tur ${results.length + 1}`,
                winners: [...winners],
                backups: [...backups],
            });
        }
        return results;
    }, [isFinal, data.allRoundResults, winners, backups]);

    const swapWithBackup = (winnerIndex) => {
        if (activeBackups.length === 0) return;
        const newWinners = [...activeWinners];
        const newBackups = [...activeBackups];
        const backupToPromote = newBackups.shift();
        newWinners[winnerIndex] = backupToPromote;
        setActiveWinners(newWinners);
        setActiveBackups(newBackups);
    };

    const verifyLink = (username) => `https://instagram.com/${username}`;
    const getDelay = (idx) => idx < 5 ? `${idx * 0.08}s` : '0s';

    const handleExportAll = async () => {
        const rows = [];
        allResults.forEach(result => {
            result.winners.forEach((w, i) => {
                rows.push({
                    'Tur': result.round,
                    'Ödül': result.name,
                    'Sıra': i + 1,
                    'Kullanıcı Adı': w.username,
                    'Yorum': w.text || '',
                    'Durum': 'Kazanan',
                });
            });
            result.backups.forEach((b, i) => {
                rows.push({
                    'Tur': result.round,
                    'Ödül': result.name,
                    'Sıra': result.winners.length + i + 1,
                    'Kullanıcı Adı': b.username,
                    'Yorum': b.text || '',
                    'Durum': 'Yedek',
                });
            });
        });
        if (window.electronAPI?.exportExcel) {
            await window.electronAPI.exportExcel({ data: rows, fileName: 'cekilis-kazananlar-tum-turlar.xlsx' });
        }
    };

    // ==========================================
    // FINAL SUMMARY VIEW
    // ==========================================
    if (isFinal) {
        const totalWinners = allResults.reduce((sum, r) => sum + r.winners.length, 0);
        return (
            <div className="w-full max-w-2xl px-4" style={{ animation: 'fadeIn 0.3s ease both' }}>
                <div className="text-center mb-10">
                    <div
                        className="w-20 h-20 bg-brand-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-500/50 shadow-[0_0_30px_rgba(34,197,94,0.2)]"
                        style={{ animation: 'scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both' }}
                    >
                        <Trophy className="w-10 h-10 text-brand-400" />
                    </div>
                    <h2 className="text-4xl font-bold mb-2 text-white">Çekiliş Tamamlandı!</h2>
                    <p className="text-brand-100/60">
                        {allResults.length} tur, toplam {totalWinners} kazanan belirlendi.
                    </p>
                </div>

                <div className="space-y-6">
                    {allResults.map((result, rIdx) => (
                        <div
                            key={rIdx}
                            className="bg-brand-gray border border-brand-500/20 rounded-2xl p-5"
                            style={{ animation: 'fadeIn 0.3s ease both', animationDelay: getDelay(rIdx) }}
                        >
                            <h3 className="text-sm font-bold text-brand-400 mb-3 flex items-center gap-2">
                                <Award className="w-4 h-4" />
                                {result.name}
                            </h3>
                            <div className="space-y-2">
                                {result.winners.map((w, idx) => (
                                    <div key={w.username + idx} className="flex items-center gap-3 bg-brand-black/50 rounded-lg p-2.5">
                                        <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-400 text-xs font-bold overflow-hidden border border-brand-500/30 flex-shrink-0">
                                            {w.picUrl ? (
                                                <img src={w.picUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                idx + 1
                                            )}
                                        </div>
                                        <span className="font-medium text-white text-sm">@{w.username}</span>
                                        <span className="text-brand-500 text-[10px] bg-brand-500/10 px-1.5 py-0.5 rounded ml-auto">Kazanan</span>
                                    </div>
                                ))}
                                {result.backups.map((b, idx) => (
                                    <div key={b.username + idx} className="flex items-center gap-3 bg-brand-black/30 rounded-lg p-2.5 opacity-60">
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-brand-100/40 text-xs font-bold overflow-hidden border border-white/10 flex-shrink-0">
                                            {b.picUrl ? (
                                                <img src={b.picUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                b.username.substring(0, 2).toUpperCase()
                                            )}
                                        </div>
                                        <span className="font-medium text-white/70 text-sm">@{b.username}</span>
                                        <span className="text-brand-100/40 text-[10px] bg-white/5 px-1.5 py-0.5 rounded ml-auto">Yedek</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-10 flex flex-col gap-3">
                    <button
                        onClick={handleExportAll}
                        className="w-full px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_4px_20px_rgba(22,163,74,0.3)]"
                    >
                        <Download className="w-5 h-5" />
                        <span>Tümünü Excel Olarak İndir</span>
                    </button>
                    <button
                        onClick={onReset}
                        className="w-full px-8 py-4 bg-transparent border border-brand-500/30 text-brand-100 hover:bg-white/5 rounded-xl font-medium transition-all active:scale-95"
                    >
                        <Home className="w-4 h-4 inline mr-2" />Ana Menüye Dön
                    </button>
                </div>
            </div>
        );
    }

    // ==========================================
    // PER-ROUND RESULT VIEW
    // ==========================================
    return (
        <div
            className="w-full max-w-2xl px-4"
            style={{ animation: 'fadeIn 0.3s ease both' }}
        >
            <div className="text-center mb-10">
                <div
                    className="w-20 h-20 bg-brand-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-500/50 shadow-[0_0_30px_rgba(34,197,94,0.2)]"
                    style={{ animation: 'scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both' }}
                >
                    <Trophy className="w-10 h-10 text-brand-400" />
                </div>
                <h2 className="text-4xl font-bold mb-2 text-white">
                    {isMultiRound ? roundName : 'Tebrikler!'}
                </h2>
                <p className="text-brand-100/60">
                    {isMultiRound
                        ? `${roundName} kazananları belirlendi.`
                        : 'Kazananlar başarıyla seçildi.'}
                </p>
            </div>

            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium text-brand-400 mb-3 flex items-center gap-2">
                        <Award className="w-5 h-5" /> Asıl Kazananlar
                    </h3>
                    <div className="space-y-3">
                        {activeWinners.map((winner, idx) => (
                            <div
                                key={winner.username + idx}
                                className="bg-brand-gray border border-brand-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                                style={{ animation: 'fadeIn 0.3s ease both', animationDelay: getDelay(idx), willChange: idx < 5 ? 'transform, opacity' : 'auto' }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-400 font-bold overflow-hidden border border-brand-500/30">
                                        {winner.picUrl && winner.picUrl !== '' ? (
                                            <img src={winner.picUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            idx + 1
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-bold text-lg text-white">@{winner.username}</div>
                                    </div>
                                </div>

                                <div className="flex w-full sm:w-auto gap-2 opacity-10 hover:opacity-100 transition-opacity">
                                    <a href={verifyLink(winner.username)} target="_blank" rel="noreferrer" className="flex-1 sm:flex-none px-3 py-1.5 bg-brand-black text-brand-100/50 hover:bg-brand-500/10 hover:text-brand-400 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1">
                                        Profili İncele <ExternalLink className="w-3 h-3" />
                                    </a>
                                    <button
                                        onClick={() => swapWithBackup(idx)}
                                        disabled={activeBackups.length === 0}
                                        className="flex-1 sm:flex-none px-3 py-1.5 bg-brand-black text-brand-100/50 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 disabled:opacity-50 active:scale-95"
                                        title="Şartları sağlamıyorsa yedekle değiştir"
                                    >
                                        <RefreshCcw className="w-3 h-3" /> İptal & Yedek
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {activeBackups.length > 0 && (
                    <div style={{ animation: 'fadeIn 0.3s ease both', animationDelay: getDelay(Math.min(activeWinners.length, 5)) }}>
                        <h3 className="text-lg font-medium text-brand-100/60 mb-3 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" /> Yedek Talihliler ({activeBackups.length})
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {activeBackups.map((bkp, idx) => (
                                <div key={bkp.username + idx} className="bg-brand-gray/50 border border-white/5 rounded-lg p-3 text-center flex flex-col items-center justify-center">
                                    <div className="text-brand-100/40 text-xs mb-2">{idx + 1}. Yedek</div>
                                    <div className="w-12 h-12 rounded-full mb-2 overflow-hidden border border-brand-500/20 bg-brand-500/10 flex items-center justify-center text-brand-400 font-bold">
                                        {bkp.picUrl && bkp.picUrl !== '' ? (
                                            <img src={bkp.picUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            bkp.username.substring(0, 2).toUpperCase()
                                        )}
                                    </div>
                                    <div className="font-medium text-white/80 line-clamp-1 w-full truncate px-2">@{bkp.username}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-12 flex flex-col gap-3" style={{ animation: 'fadeIn 0.3s ease both', animationDelay: getDelay(Math.min(activeWinners.length + 1, 5)) }}>
                {/* Next Round or single-round Excel */}
                {onNextRound && hasMoreRounds ? (
                    <>
                        <button
                            onClick={onNextRound}
                            className="w-full px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_4px_20px_rgba(22,163,74,0.3)]"
                        >
                            <span>Sonraki Tur: {data.rounds[data.currentRound + 1]?.name}</span>
                            <ArrowRight className="w-5 h-5" />
                        </button>
                        <p className="text-brand-100/40 text-xs text-center">
                            Tur {data.currentRound + 1} / {data.rounds.length}
                        </p>
                    </>
                ) : onNextRound && !hasMoreRounds && isMultiRound ? (
                    <button
                        onClick={onNextRound}
                        className="w-full px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_4px_20px_rgba(22,163,74,0.3)]"
                    >
                        <Trophy className="w-5 h-5" />
                        <span>Sonuçları Göster & Excel İndir</span>
                    </button>
                ) : (
                    <button
                        onClick={() => {
                            // Single round: export directly
                            const rows = [
                                ...activeWinners.map((w, i) => ({
                                    'Sıra': i + 1,
                                    'Kullanıcı Adı': w.username,
                                    'Yorum': w.text || '',
                                    'Durum': 'Kazanan',
                                })),
                                ...activeBackups.map((b, i) => ({
                                    'Sıra': activeWinners.length + i + 1,
                                    'Kullanıcı Adı': b.username,
                                    'Yorum': b.text || '',
                                    'Durum': 'Yedek',
                                }))
                            ];
                            if (window.electronAPI?.exportExcel) {
                                window.electronAPI.exportExcel({ data: rows, fileName: 'cekilis-kazananlar.xlsx' });
                            }
                        }}
                        className="w-full px-8 py-4 bg-brand-gray border border-brand-500/20 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all hover:bg-brand-900 hover:border-brand-500/40 active:scale-95"
                    >
                        <Download className="w-5 h-5 text-brand-400" />
                        <span>Excel Olarak İndir</span>
                    </button>
                )}
                <button
                    onClick={onReset}
                    className="w-full px-8 py-4 bg-transparent border border-brand-500/30 text-brand-100 hover:bg-white/5 rounded-xl font-medium transition-all active:scale-95"
                >
                    Ana Menüye Dön
                </button>
            </div>
        </div>
    );
}

export default memo(ResultStep);




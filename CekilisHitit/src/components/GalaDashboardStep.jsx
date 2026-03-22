import React, { useState, useMemo, memo } from 'react';
import { Users, Gift, Play, Download, Trophy, CheckCircle, X, Zap, Timer, SkipForward } from 'lucide-react';

// Katılımcıdan benzersiz anahtar çıkar — bir kere hesapla, her yerde kullan
function getParticipantKey(p) {
    return p['İsim'] || p['Name'] || p['isim'] || p['name'] || Object.values(p)[0] || '';
}

function GalaDashboardStep({ data, setData, onNext, onFinal }) {
    const { participants, prizes, currentPrizeIndex, drawResults, autoMode, autoDelay, skipCountdown } = data.gala;
    const [viewingPrizeIndex, setViewingPrizeIndex] = useState(null);

    // Kazanan key'lerini Set olarak tut — O(1) lookup, JSON.stringify YOK
    const { winnerSet, totalWinnerCount } = useMemo(() => {
        const set = new Set();
        let count = 0;
        for (const winners of Object.values(drawResults)) {
            for (const w of winners) {
                set.add(getParticipantKey(w));
                count++;
            }
        }
        return { winnerSet: set, totalWinnerCount: count };
    }, [drawResults]);

    // Kalan katılımcı sayısını hesapla — sadece sayı yeter, yeni array oluşturma
    const remainingCount = useMemo(() => {
        return participants.filter(p => !winnerSet.has(getParticipantKey(p))).length;
    }, [participants, winnerSet]);

    const currentPrize = prizes[currentPrizeIndex];
    const isFinished = currentPrizeIndex >= prizes.length;

    const toggleAutoMode = () => {
        setData(prev => ({
            ...prev,
            gala: { ...prev.gala, autoMode: !prev.gala.autoMode }
        }));
    };

    const toggleSkipCountdown = () => {
        setData(prev => ({
            ...prev,
            gala: { ...prev.gala, skipCountdown: !prev.gala.skipCountdown }
        }));
    };

    const setAutoDelay = (val) => {
        setData(prev => ({
            ...prev,
            gala: { ...prev.gala, autoDelay: val }
        }));
    };

    return (
        <div
            className="w-full flex flex-col gap-6 max-w-4xl mx-auto"
            style={{ animation: 'fadeIn 0.3s ease both' }}
        >
            {/* Stats Header */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-brand-gray border border-brand-500/20 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-900/50 flex items-center justify-center text-brand-400">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-brand-100/60 text-xs font-medium">Kalan Katılımcı</p>
                        <p className="text-2xl font-bold text-white">{remainingCount}</p>
                    </div>
                </div>
                <div className="bg-brand-gray border border-brand-500/20 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-900/50 flex items-center justify-center text-brand-400">
                        <Gift className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-brand-100/60 text-xs font-medium">Toplam Ödül</p>
                        <p className="text-2xl font-bold text-white">{prizes.length}</p>
                    </div>
                </div>
                <div className="bg-brand-gray border border-brand-500/20 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-900/50 flex items-center justify-center text-brand-400">
                        <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-brand-100/60 text-xs font-medium">Dağıtılan</p>
                        <p className="text-2xl font-bold text-white">{totalWinnerCount}</p>
                    </div>
                </div>
                <div className="bg-brand-gray border border-brand-500/20 rounded-2xl p-4 flex items-center justify-center">
                    <button
                        onClick={onFinal}
                        className="w-full h-full flex items-center justify-center gap-2 text-brand-400 hover:text-white hover:bg-brand-500/10 rounded-xl transition-colors text-sm font-medium"
                    >
                        <Download className="w-4 h-4" /> Excel'e Aktar
                    </button>
                </div>
            </div>

            {/* Auto Mode Controls */}
            <div className={`rounded-2xl border p-5 transition-all ${autoMode ? 'bg-brand-900/40 border-brand-500/40' : 'bg-brand-gray border-brand-500/15'}`}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <Zap className={`w-5 h-5 ${autoMode ? 'text-brand-400' : 'text-brand-100/40'}`} />
                        <div>
                            <h3 className={`font-bold text-sm ${autoMode ? 'text-white' : 'text-brand-100/60'}`}>Otomatik Devam</h3>
                            <p className="text-brand-100/40 text-xs">Çekilişler arası otomatik geçiş</p>
                        </div>
                    </div>
                    <button
                        onClick={toggleAutoMode}
                        className={`relative w-12 h-7 rounded-full transition-all duration-300 ${autoMode ? 'bg-brand-500' : 'bg-brand-800 border border-brand-500/20'}`}
                    >
                        <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${autoMode ? 'left-6' : 'left-1'}`} />
                    </button>
                </div>

                {autoMode && (
                    <div className="space-y-4 pt-3 border-t border-brand-500/15" style={{ animation: 'fadeIn 0.2s ease both' }}>
                        {/* Delay Selector */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Timer className="w-4 h-4 text-brand-400/60" />
                                <span className="text-sm text-brand-100/60">Bekleme Süresi</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {[3, 5, 8, 10, 15].map(sec => (
                                    <button
                                        key={sec}
                                        onClick={() => setAutoDelay(sec)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${autoDelay === sec
                                            ? 'bg-brand-500 text-brand-900 shadow-[0_0_12px_rgba(34,197,94,0.3)]'
                                            : 'bg-brand-800 text-brand-100/50 hover:text-white hover:bg-brand-900'
                                            }`}
                                    >
                                        {sec}s
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Skip Countdown Toggle */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <SkipForward className="w-4 h-4 text-brand-400/60" />
                                <span className="text-sm text-brand-100/60">Geri Sayımı Atla</span>
                                <span className="text-[10px] text-brand-100/30">(5-4-3-2-1)</span>
                            </div>
                            <button
                                onClick={toggleSkipCountdown}
                                className={`relative w-12 h-7 rounded-full transition-all duration-300 ${skipCountdown ? 'bg-brand-500' : 'bg-brand-800 border border-brand-500/20'}`}
                            >
                                <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${skipCountdown ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Stage */}
            <div className="bg-brand-gray border border-brand-500/30 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full -mr-32 -mt-32 pointer-events-none" />

                <h2 className="text-xl font-medium text-brand-100/60 mb-6 flex items-center gap-2">
                    <Gift className="w-5 h-5" /> Çekiliş Sırası
                </h2>

                <div className="space-y-4">
                    {prizes.map((prize, idx) => {
                        const isCurrent = idx === currentPrizeIndex;
                        const isPast = idx < currentPrizeIndex;

                        return (
                            <div
                                key={prize.id}
                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isCurrent ? 'bg-brand-900/40 border-brand-500 shadow-[0_0_30px_rgba(34,197,94,0.15)] scale-[1.02]' :
                                    isPast ? 'bg-brand-black/50 border-brand-500/10 opacity-50' :
                                        'bg-brand-black border-brand-500/20'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isCurrent ? 'bg-brand-500 text-brand-900' : isPast ? 'bg-brand-500/20 text-brand-500' : 'bg-brand-800 text-brand-400'}`}>
                                        {isPast ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                                    </div>
                                    <div>
                                        <h3 className={`font-bold text-lg ${isCurrent ? 'text-white' : 'text-brand-100/80'}`}>{prize.name}</h3>
                                        <p className="text-sm text-brand-100/50">{prize.count} Kişi Kazanacak</p>
                                    </div>
                                </div>

                                {isCurrent && (
                                    <button
                                        onClick={onNext}
                                        className="px-6 py-3 bg-brand-500 hover:bg-brand-400 text-brand-900 rounded-xl font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:scale-105 transition-all"
                                    >
                                        <Play className="w-5 h-5 fill-current" /> {autoMode ? 'Otomatik Başlat' : 'Çekilişi Başlat'}
                                    </button>
                                )}

                                {isPast && (
                                    <button onClick={() => setViewingPrizeIndex(idx)}
                                        className="px-4 py-2 bg-brand-900/50 text-brand-400 hover:text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Kazananları Gör
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {isFinished && (
                    <div
                        className="mt-8 text-center p-8 bg-brand-900/30 border border-brand-500/30 rounded-2xl relative overflow-hidden"
                        style={{ animation: 'fadeIn 0.3s ease both' }}
                    >
                        <Trophy className="w-16 h-16 text-brand-400 mx-auto mb-4" />
                        <h3 className="text-3xl font-bold text-white mb-2">Tüm Çekilişler Tamamlandı!</h3>
                        <p className="text-brand-100/70 mb-6">Gala gecesi çekilişleri başarıyla sona erdi. Kazanan listesini Excel formatında alabilirsiniz.</p>
                        <button
                            onClick={onFinal}
                            className="px-8 py-4 bg-brand-500 hover:bg-brand-400 text-brand-900 rounded-xl font-bold text-lg inline-flex items-center gap-3 shadow-[0_0_30px_rgba(34,197,94,0.4)] hover:scale-105 transition-all"
                        >
                            <Download className="w-6 h-6" /> Kapanış ve Excel Çıktısı
                        </button>
                    </div>
                )}
            </div>

            {/* Past Winners Viewer Modal */}
            {viewingPrizeIndex !== null && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => setViewingPrizeIndex(null)}
                    style={{ animation: 'fadeIn 0.2s ease both' }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        className="bg-brand-gray border border-brand-500/30 rounded-2xl p-6 max-w-lg w-full max-h-[60vh] overflow-y-auto relative"
                        style={{ animation: 'scaleIn 0.2s ease out' }}
                    >
                        <button onClick={() => setViewingPrizeIndex(null)} className="absolute top-4 right-4 text-brand-100/50 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-brand-400" />
                            {prizes[viewingPrizeIndex]?.name}
                        </h3>
                        <p className="text-brand-100/50 text-sm mb-4">Kazananlar</p>
                        <div className="space-y-2">
                            {(drawResults[prizes[viewingPrizeIndex]?.id] || []).map((winner, idx) => {
                                const name = getParticipantKey(winner);
                                const dept = winner['Birim'] || winner['Kurum'] || winner['Şube'] || Object.values(winner)[1];
                                return (
                                    <div key={idx} className="flex items-center gap-3 bg-brand-black/50 border border-brand-500/10 rounded-lg p-3">
                                        <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-sm">{idx + 1}</div>
                                        <div>
                                            <div className="font-medium text-white">{name}</div>
                                            {dept && <div className="text-brand-100/50 text-xs">{dept}</div>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default memo(GalaDashboardStep);

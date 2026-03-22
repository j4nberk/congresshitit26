import React, { memo, useEffect, useState, useRef, useCallback, useLayoutEffect } from 'react';
import { ArrowRight, Trophy, Pause, Play, Gift } from 'lucide-react';

function GalaResultStep({ data, setData, onNext }) {
    const { prizes, currentPrizeIndex, drawResults, autoMode, autoDelay } = data.gala;
    const currentPrize = prizes[currentPrizeIndex];
    const currentWinners = drawResults[currentPrize?.id] || [];
    const nextPrize = prizes[currentPrizeIndex + 1];
    const isLastPrize = currentPrizeIndex >= prizes.length - 1;

    const [autoPhase, setAutoPhase] = useState('showing');
    const [progress, setProgress] = useState(0);
    const [secondsLeft, setSecondsLeft] = useState(Math.ceil(autoDelay || 5));
    const [paused, setPaused] = useState(false);
    const [overflowPx, setOverflowPx] = useState(0); // kazanan listesi ne kadar taşıyor

    const rafRef = useRef(null);
    const timerRef = useRef(null);
    const pausedRef = useRef(false);
    const startTimeRef = useRef(0);
    const accumulatedRef = useRef(0);
    const viewportRef = useRef(null);  // görünen alan
    const contentRef = useRef(null);   // kazanan kartları wrapper

    const totalMs = (autoDelay || 5) * 1000;
    const TRANSITION_MS = 2500;

    const handleNextPrize = useCallback(() => {
        setData(prev => ({
            ...prev,
            gala: {
                ...prev.gala,
                currentPrizeIndex: prev.gala.currentPrizeIndex + 1
            }
        }));
        onNext();
    }, [setData, onNext]);

    // ── Taşma ölçümü ──
    useLayoutEffect(() => {
        if (!viewportRef.current || !contentRef.current) return;
        const viewH = viewportRef.current.clientHeight;
        const contentH = contentRef.current.scrollHeight;
        const overflow = contentH - viewH;
        setOverflowPx(overflow > 20 ? overflow + 32 : 0); // 32px extra padding
    }, [currentWinners]);

    // ── Cleanup ──
    useEffect(() => {
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    // ── SHOWING phase: rAF-driven progress bar ──
    useEffect(() => {
        if (!autoMode || isLastPrize || autoPhase !== 'showing') return;

        accumulatedRef.current = 0;
        pausedRef.current = false;
        startTimeRef.current = performance.now();

        const tick = (now) => {
            if (pausedRef.current) {
                rafRef.current = requestAnimationFrame(tick);
                return;
            }

            const elapsed = accumulatedRef.current + (now - startTimeRef.current);
            const pct = Math.min((elapsed / totalMs) * 100, 100);
            const remaining = Math.max(0, totalMs - elapsed);

            setProgress(pct);
            setSecondsLeft(Math.ceil(remaining / 1000));

            if (pct >= 100) {
                rafRef.current = null;
                setAutoPhase('transition');
                return;
            }

            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, [autoMode, isLastPrize, autoPhase, totalMs]);

    // ── TRANSITION phase ──
    useEffect(() => {
        if (!autoMode || autoPhase !== 'transition') return;

        timerRef.current = setTimeout(() => {
            handleNextPrize();
        }, TRANSITION_MS);

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [autoMode, autoPhase, handleNextPrize]);

    // ── Pause / Resume ──
    const togglePause = () => {
        if (pausedRef.current) {
            accumulatedRef.current = accumulatedRef.current + (performance.now() - startTimeRef.current);
            startTimeRef.current = performance.now();
            pausedRef.current = false;
            setPaused(false);
        } else {
            accumulatedRef.current = accumulatedRef.current + (performance.now() - startTimeRef.current);
            startTimeRef.current = performance.now();
            pausedRef.current = true;
            setPaused(true);
        }
    };

    // Slide-up animasyon süresi: bekleme süresinin %80'i (başta ve sonda duraklama payı)
    const slideDurationMs = totalMs;

    // ══════════════════════════════════════════
    // TRANSITION SCREEN
    // ══════════════════════════════════════════
    if (autoMode && autoPhase === 'transition' && nextPrize) {
        return (
            <div
                className="w-full flex flex-col items-center justify-center min-h-[60vh]"
                style={{ animation: 'fadeIn 0.3s ease both' }}
            >
                <div className="text-center mb-12">
                    <div
                        className="w-24 h-24 rounded-full bg-brand-500/10 border-2 border-brand-500/30 flex items-center justify-center mx-auto mb-8"
                        style={{ animation: 'scaleIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both' }}
                    >
                        <Gift className="w-12 h-12 text-brand-400" />
                    </div>
                    <h2 className="text-3xl text-brand-100/50 font-medium mb-3">Sıradaki Çekiliş Başlıyor</h2>
                    <h3
                        className="text-5xl md:text-6xl font-bold text-white mb-4"
                        style={{ animation: 'fadeIn 0.4s ease 0.15s both' }}
                    >
                        {nextPrize.name}
                    </h3>
                    <p
                        className="text-xl md:text-2xl text-brand-400 font-medium"
                        style={{ animation: 'fadeIn 0.4s ease 0.3s both' }}
                    >
                        {nextPrize.count} kişi kazanacak
                    </p>
                </div>

                <div className="w-full max-w-lg">
                    <div className="h-2 bg-brand-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full"
                            style={{ animation: `barFill ${TRANSITION_MS}ms linear forwards` }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // ══════════════════════════════════════════
    // NORMAL RESULT VIEW
    // ══════════════════════════════════════════
    return (
        <div
            className="w-full flex flex-col items-center min-h-[50vh]"
            style={{ animation: 'fadeIn 0.3s ease both' }}
        >
            {/* Header — sabit */}
            <div className="text-center mb-8 flex-shrink-0">
                <Trophy className="w-14 h-14 text-brand-400 mx-auto mb-3" />
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-1">
                    {currentPrize.name}
                </h2>
                <p className="text-lg text-brand-100/50">Kazananlar</p>
            </div>

            {/* Kazanan listesi — taşarsa slide-up animasyonu */}
            <div
                ref={viewportRef}
                className="w-full flex-1 overflow-hidden relative"
                style={{ maxHeight: 'calc(100vh - 380px)' }}
            >
                {/* Üst ve alt fade mask — taşma varsa göster */}
                {overflowPx > 0 && (
                    <>
                        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-brand-black to-transparent z-10 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-brand-black to-transparent z-10 pointer-events-none" />
                    </>
                )}

                <div
                    ref={contentRef}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full px-1"
                    style={overflowPx > 0 ? {
                        animation: `slideUp ${slideDurationMs}ms ease-in-out infinite`,
                        '--slide-distance': `-${overflowPx}px`,
                    } : undefined}
                >
                    {currentWinners.map((winner, idx) => {
                        const name = winner['İsim'] || winner['Name'] || Object.values(winner)[0] || 'İsimsiz';
                        const dept = winner['Birim'] || winner['Kurum'] || winner['Şube'] || Object.values(winner)[1];

                        return (
                            <div
                                key={idx}
                                className="bg-brand-900 border border-brand-500 shadow-[0_0_30px_rgba(34,197,94,0.15)] rounded-2xl p-5 text-center"
                                style={{ animation: 'fadeIn 0.3s ease both', animationDelay: `${Math.min(idx * 0.08, 1)}s` }}
                            >
                                <h3 className="text-xl md:text-2xl font-bold text-white mb-1">{name}</h3>
                                {dept && <p className="text-brand-400 font-medium text-sm">{dept}</p>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Auto-mode progress bar + countdown */}
            {autoMode && !isLastPrize && (
                <div className="w-full max-w-md mt-6 mb-4 flex-shrink-0" style={{ animation: 'fadeIn 0.3s ease 0.5s both' }}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-brand-100/40 text-xs">
                            Sıradaki: <span className="text-brand-400 font-medium">{nextPrize?.name}</span>
                        </span>
                        <button
                            onClick={togglePause}
                            className="flex items-center gap-1.5 text-brand-100/40 hover:text-white text-xs transition-colors"
                        >
                            {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                            {paused ? 'Devam' : 'Duraklat'}
                        </button>
                    </div>
                    <div className="h-2 bg-brand-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-brand-100/30 text-[10px] text-center mt-1.5 tabular-nums">
                        {paused ? 'Duraklatıldı' : `${secondsLeft}s`}
                    </p>
                </div>
            )}

            {/* Manuel geçiş butonu */}
            <div className="flex gap-4 flex-shrink-0 mt-4">
                <button
                    onClick={handleNextPrize}
                    className="px-8 py-4 bg-brand-500 hover:bg-brand-400 text-brand-900 rounded-xl font-bold text-lg flex items-center gap-2 shadow-[0_4px_20px_rgba(34,197,94,0.3)] hover:scale-105 transition-all active:scale-95"
                >
                    <span>Sıradaki Çekiliş</span>
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

export default memo(GalaResultStep);

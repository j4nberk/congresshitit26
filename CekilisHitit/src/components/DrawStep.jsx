import React, { useEffect, useRef, useState, memo } from 'react';
import { Loader2, CheckCircle2, Trophy } from 'lucide-react';

function DrawStep({ data, setData, onNext }) {
    const [phase, setPhase] = useState('shuffling');
    const nameRef = useRef(null);
    const picRef = useRef(null);
    const shuffleIntervalRef = useRef(null);
    const isTransitioningRef = useRef(false);

    useEffect(() => {
        return () => {
            if (shuffleIntervalRef.current) cancelAnimationFrame(shuffleIntervalRef.current);
        };
    }, []);

    useEffect(() => {
        if (phase === 'shuffling' && data.comments && data.comments.length > 0) {
            // Use current round config if available, otherwise fall back to settings
            const currentRoundDef = data.rounds?.[data.currentRound];
            const winnerCount = currentRoundDef?.winnerCount || data.settings.winnerCount;
            const backupCount = currentRoundDef?.backupCount ?? data.settings.backupCount;
            const totalToPick = winnerCount + backupCount;

            let pool = [...data.comments];

            // Exclude previous round winners (all their comments)
            if (data.previousWinners && data.previousWinners.length > 0) {
                const excluded = new Set(data.previousWinners);
                pool = pool.filter(c => !excluded.has(c.username));
            }

            if (!data.settings.allowMultiple) {
                const seen = new Set();
                pool = pool.filter(c => {
                    if (seen.has(c.username)) return false;
                    seen.add(c.username);
                    return true;
                });
            }

            const minTags = data.settings.minTagCount || 0;
            if (minTags > 0) {
                pool = pool.filter(c => {
                    const mentions = (c.text || '').match(/@[\w.]+/g) || [];
                    return mentions.length >= minTags;
                });
            }

            // Fisher-Yates once
            for (let i = pool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [pool[i], pool[j]] = [pool[j], pool[i]];
            }

            let shuffleCount = 0;
            let lastDrawTime = performance.now();
            let animationFrameId;
            const poolLen = pool.length;

            const updateFrame = (currentTime) => {
                if (isTransitioningRef.current) return;

                if (currentTime - lastDrawTime >= 100) {
                    lastDrawTime = currentTime;

                    // Direct DOM update — zero React re-renders
                    const randomUser = pool[Math.floor(Math.random() * poolLen)];
                    if (randomUser && nameRef.current) {
                        nameRef.current.textContent = '@' + randomUser.username;
                    }
                    if (picRef.current) {
                        if (randomUser?.picUrl) {
                            picRef.current.src = randomUser.picUrl;
                            picRef.current.style.display = 'block';
                        } else {
                            picRef.current.style.display = 'none';
                        }
                    }
                    shuffleCount++;

                    if (shuffleCount > 30 && !isTransitioningRef.current) {
                        isTransitioningRef.current = true;
                        if (animationFrameId) cancelAnimationFrame(animationFrameId);

                        const picked = [];
                        for (let i = 0; i < totalToPick; i++) {
                            if (pool.length === 0) break;
                            picked.push(pool.pop());
                        }

                        setData((prev) => ({
                            ...prev,
                            winners: picked.slice(0, winnerCount),
                            backups: picked.slice(winnerCount)
                        }));

                        setPhase('done');
                        onNext();
                        return;
                    }
                }

                if (!isTransitioningRef.current) {
                    animationFrameId = requestAnimationFrame(updateFrame);
                    shuffleIntervalRef.current = animationFrameId;
                }
            };

            animationFrameId = requestAnimationFrame(updateFrame);
            shuffleIntervalRef.current = animationFrameId;
        }
    }, [phase]);

    return (
        <div
            className="w-full flex flex-col items-center justify-center min-h-[400px]"
            style={{ animation: 'fadeIn 0.3s ease both' }}
        >
            <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                {phase === 'shuffling' && (
                    <div className="absolute inset-0 rounded-full border-4 border-brand-500 border-dashed animate-[spin_2s_linear_infinite]" />
                )}
                {phase === 'done' && (
                    <div className="absolute inset-0 bg-brand-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.5)]" style={{ animation: 'scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) both' }}>
                        <CheckCircle2 className="w-16 h-16 text-brand-900" />
                    </div>
                )}
                {phase === 'shuffling' && <Loader2 className="w-10 h-10 text-brand-400 animate-spin" />}
            </div>

            <div className="text-center h-[12rem] flex flex-col items-center justify-center">
                {phase === 'shuffling' && (
                    <div className="flex flex-col items-center" style={{ animation: 'fadeIn 0.2s ease both' }}>
                        <h3 className="text-xl font-medium text-white mb-2">Kazanan Belirleniyor...</h3>
                        <div className="flex items-center gap-3">
                            <img ref={picRef} alt="" className="w-10 h-10 rounded-full border border-brand-500/50 object-cover" style={{ display: 'none' }} />
                            <p ref={nameRef} className="text-3xl font-bold bg-gradient-to-r from-brand-400 to-white bg-clip-text text-transparent">
                                @...
                            </p>
                        </div>
                    </div>
                )}
                {phase === 'done' && (
                    <div style={{ animation: 'fadeIn 0.3s ease both' }}>
                        <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2 justify-center">
                            <Trophy className="w-6 h-6 text-brand-400" />
                            Çekiliş Tamamlandı!
                        </h3>
                    </div>
                )}
            </div>
        </div>
    );
}

export default memo(DrawStep);


import React, { useEffect, useState, useRef, useMemo, memo } from 'react';

function getParticipantKey(p) {
    return p['İsim'] || p['Name'] || p['isim'] || p['name'] || Object.values(p)[0] || '';
}

function GalaDrawStep({ data, setData, onNext }) {
    const { participants, prizes, currentPrizeIndex, drawResults, autoMode, skipCountdown } = data.gala;
    const shouldSkipCountdown = autoMode && skipCountdown;
    const [countdown, setCountdown] = useState(shouldSkipCountdown ? 0 : 5);
    const [isDrawing, setIsDrawing] = useState(false);
    const shuffleNameRef = useRef(null);
    const shuffleIntervalRef = useRef(null);
    const isTransitioningRef = useRef(false);

    const currentPrize = prizes[currentPrizeIndex];
    const isFinished = currentPrizeIndex >= prizes.length;

    // Kazanan Set'ini useMemo ile cache'le — her render'da flat + map yapma
    const winnerKeySet = useMemo(() => {
        const set = new Set();
        for (const winners of Object.values(drawResults)) {
            for (const w of winners) {
                set.add(getParticipantKey(w));
            }
        }
        return set;
    }, [drawResults]);

    // Kalan katılımcıları useMemo ile cache'le
    const remainingParticipants = useMemo(() => {
        return participants.filter(p => !winnerKeySet.has(getParticipantKey(p)));
    }, [participants, winnerKeySet]);

    if (isFinished || !currentPrize) {
        return null;
    }

    useEffect(() => {
        if (countdown > 0 && !isDrawing) {
            const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0 && !isDrawing) {
            setIsDrawing(true);
            triggerDraw();
        }
    }, [countdown, isDrawing]);

    useEffect(() => {
        return () => {
            if (shuffleIntervalRef.current) cancelAnimationFrame(shuffleIntervalRef.current);
        };
    }, []);

    const triggerDraw = () => {
        const winnerCount = Math.min(currentPrize.count, remainingParticipants.length);
        const newWinners = [];
        let pool = [...remainingParticipants];

        let shuffleCount = 0;
        let lastDrawTime = performance.now();
        let animationFrameId;
        const poolLen = remainingParticipants.length;

        const getName = (p) => getParticipantKey(p) || '...';

        const updateFrame = (currentTime) => {
            if (isTransitioningRef.current) return;

            if (currentTime - lastDrawTime >= 150) {
                lastDrawTime = currentTime;

                const randomP = remainingParticipants[Math.floor(Math.random() * poolLen)];
                if (shuffleNameRef.current && randomP) {
                    shuffleNameRef.current.textContent = getName(randomP);
                }
                shuffleCount++;

                if (shuffleCount >= 20 && !isTransitioningRef.current) {
                    isTransitioningRef.current = true;
                    if (animationFrameId) cancelAnimationFrame(animationFrameId);

                    for (let i = 0; i < winnerCount; i++) {
                        const randomIndex = Math.floor(Math.random() * pool.length);
                        newWinners.push(pool[randomIndex]);
                        pool.splice(randomIndex, 1);
                    }

                    setData(prev => ({
                        ...prev,
                        gala: {
                            ...prev.gala,
                            drawResults: {
                                ...prev.gala.drawResults,
                                [currentPrize.id]: newWinners
                            }
                        }
                    }));

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
    };

    return (
        <div
            className="w-full flex flex-col items-center justify-center min-h-[50vh]"
            style={{ animation: 'fadeIn 0.3s ease both' }}
        >
            {!isDrawing ? (
                <div className="text-center" style={{ animation: 'fadeIn 0.2s ease both' }}>
                    <h2 className="text-3xl text-brand-400 font-medium mb-8">
                        <span className="text-white font-bold">{currentPrize.name}</span> çekilişi başlıyor...
                    </h2>
                    <div
                        key={countdown}
                        className="text-[12rem] font-bold text-brand-500 leading-none"
                        style={{ animation: 'scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) both' }}
                    >
                        {countdown}
                    </div>
                </div>
            ) : (
                <div className="w-full max-w-2xl" style={{ animation: 'fadeIn 0.2s ease both' }}>
                    <h2 className="text-2xl text-center text-brand-100/60 mb-12">
                        <span className="text-white font-bold">{currentPrize.name}</span> aranıyor...
                    </h2>
                    <div className="bg-brand-900 border border-brand-500 p-6 rounded-2xl text-center shadow-lg">
                        <h3 ref={shuffleNameRef} className="text-4xl font-mono tracking-wider font-bold text-brand-400 opacity-90">...</h3>
                    </div>
                </div>
            )}
        </div>
    );
}

export default memo(GalaDrawStep);


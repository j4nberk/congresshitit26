import React, { useState, useEffect, memo } from 'react';
import { Instagram, ArrowRight, Link, LogOut, CloudFog, ShieldAlert, Key, Database, Gauge } from 'lucide-react';

function InputStep({ data, setData, onNext }) {
    const [url, setUrl] = useState(data.url || '');
    const [engine, setEngine] = useState(data.scrapeEngine || 'graphapi');
    const [apifyToken, setApifyToken] = useState(data.apifyToken || '');
    const [sessionId, setSessionId] = useState(data.sessionId || '');
    const [rps, setRps] = useState(data.rps || 250);
    const [error, setError] = useState('');

    useEffect(() => {
        const savedApifyToken = localStorage.getItem('cekilis_apify_token');
        const savedSessionId = localStorage.getItem('cekilis_session_id');
        if (savedApifyToken && !apifyToken) setApifyToken(savedApifyToken);
        if (savedSessionId && !sessionId) setSessionId(savedSessionId);
    }, []);

    const handleNext = () => {
        if (!url.includes('instagram.com')) {
            setError('Lütfen geçerli bir Instagram gönderi bağlantısı (URL) girin.');
            return;
        }

        if (engine === 'apify' && !apifyToken) {
            setError('Apify motorunu kullanmak için geçerli bir API Token girmeniz gerekmektedir.');
            return;
        }

        if (engine === 'graphapi' && !sessionId) {
            setError('InstaTouch motorunu kullanmak için Instagram Session ID gereklidir. Inspector → Network → Cookie → sessionid=...');
            return;
        }

        if (engine === 'apify') localStorage.setItem('cekilis_apify_token', apifyToken);
        if (engine === 'graphapi' && sessionId) localStorage.setItem('cekilis_session_id', sessionId);

        setData({
            ...data,
            url,
            scrapeEngine: engine,
            apifyToken: engine === 'apify' ? apifyToken : null,
            sessionId: engine === 'graphapi' ? sessionId : null,
            rps: engine === 'graphapi' ? rps : null
        });

        onNext();
    };

    const handleResetCookies = async () => {
        try {
            if (window.electronAPI && window.electronAPI.resetCookies) {
                await window.electronAPI.resetCookies();
                setError('✅ Yerel tarayıcı çerezleri başarıyla temizlendi! Tekrar giriş yapabilirsiniz.');
            } else {
                setError('Hata: Çerez temizleme fonksiyonu bulunamadı.');
            }
        } catch (err) {
            setError('Çerez temizleme hatası: ' + err.message);
        }
    };

    return (
        <div
            className="w-full flex flex-col items-center gap-6"
            style={{ animation: 'fadeIn 0.3s ease both' }}
        >
            <div className="w-16 h-16 rounded-2xl bg-brand-900 border border-brand-500/30 flex items-center justify-center mb-2 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                <Instagram className="w-8 h-8 text-brand-400" />
            </div>

            <div className="text-center mb-0">
                <h2 className="text-3xl font-semibold mb-2 text-white">Instagram Çekiliş Motoru</h2>
                <p className="text-brand-100/60 max-w-md mx-auto text-sm">
                    Instagram'ın bot algılama sistemlerine takılmadan binlerce yorumu tek tıklamayla indirin.
                </p>
            </div>

            {/* Engine Selector Toggle - 3 options */}
            <div className="flex bg-black/40 border border-brand-500/20 rounded-xl p-1 w-full max-w-md">
                <button
                    onClick={() => setEngine('graphapi')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-lg text-xs font-medium transition-all ${engine === 'graphapi' ? 'bg-brand-500/20 text-brand-300' : 'text-brand-100/40 hover:text-brand-100/70'}`}
                >
                    <Database className="w-3.5 h-3.5" />
                    InstaTouch
                </button>
                <button
                    onClick={() => setEngine('apify')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-lg text-xs font-medium transition-all ${engine === 'apify' ? 'bg-brand-500/20 text-brand-300' : 'text-brand-100/40 hover:text-brand-100/70'}`}
                >
                    <CloudFog className="w-3.5 h-3.5" />
                    Apify Bulut
                </button>
                <button
                    onClick={() => setEngine('native')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-lg text-xs font-medium transition-all ${engine === 'native' ? 'bg-brand-500/20 text-brand-300' : 'text-brand-100/40 hover:text-brand-100/70'}`}
                >
                    <Instagram className="w-3.5 h-3.5" />
                    Yerel (V6)
                </button>
            </div>

            {/* Dynamic Engine Instructions */}
            <div className="w-full max-w-md">
                {engine === 'graphapi' ? (
                    <div className="bg-brand-900/40 border border-brand-500/30 rounded-xl p-4 text-xs text-brand-100/70">
                        <strong className="text-brand-300 flex items-center gap-1 mb-1"><Database className="w-4 h-4" /> InstaTouch Scraper</strong>
                        Instagram web'den alınan <b>session cookie</b> ile yorumları güvenli şekilde çeker. Session ID opsiyoneldir — bazı gönderilerde session olmadan da çalışır. Nasıl alınır: Instagram Web → Sağ tık → Inspector → Network → Cookie → <code className="text-brand-400">sessionid=...</code>
                    </div>
                ) : engine === 'apify' ? (
                    <div className="bg-brand-900/40 border border-brand-500/30 rounded-xl p-4 text-xs text-brand-100/70">
                        <strong className="text-brand-300 flex items-center gap-1 mb-1"><ShieldAlert className="w-4 h-4" /> %100 Güvenli ve Risksiz</strong>
                        Kendi Instagram hesabınızla giriş yapmazsınız. İşlemler resmi Apify Cloud sunucularında yapılır, hesabınızın banlanma veya kilitlenme riski yoktur. Saniyeler içinde tüm yorumlar çekilir.
                    </div>
                ) : (
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 text-xs text-orange-200/70">
                        <strong className="text-orange-400 flex items-center gap-1 mb-1"><ShieldAlert className="w-4 h-4" /> Dikkat: Engellenme Riski</strong>
                        Bu yöntem cihazınızın arka planındaki Chrome'u kullanarak Instagram'a giriş yapar. Son güncellemelerle Instagram bu tarz hızlı bot hareketlerini fark edip <b>hesabınızı kilitleyebilir.</b> Sorumluluk kabul edilmez.
                        <div className="mt-3 flex gap-2 justify-center">
                            <button
                                onClick={handleResetCookies}
                                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md text-xs font-medium border border-red-500/20 flex items-center gap-1 transition-colors"
                            >
                                <LogOut className="w-3 h-3" /> Yerel Çerezleri Temizle
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Fields */}
            <div className="w-full flex flex-col gap-4 max-w-md">
                <div className="relative group mt-2">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Link className="w-5 h-5 text-brand-500/50 group-focus-within:text-brand-400 transition-colors" />
                    </div>
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => {
                            setUrl(e.target.value);
                            setError('');
                        }}
                        placeholder="Çekiliş Gönderi Linki (https://instagram.com/p/...)"
                        className="w-full bg-brand-gray border border-brand-500/20 rounded-xl py-4 pl-12 pr-4 text-white placeholder-brand-100/30 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition-all duration-300 shadow-[0_0_15px_rgba(34,197,94,0.0)] focus:shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                    />
                </div>

                {engine === 'apify' && (
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Key className="w-5 h-5 text-brand-500/50 group-focus-within:text-brand-400 transition-colors" />
                        </div>
                        <input
                            type="password"
                            value={apifyToken}
                            onChange={(e) => { setApifyToken(e.target.value); setError(''); }}
                            placeholder="Apify API Token (apify_api_...)"
                            className="w-full bg-brand-gray border border-brand-500/20 rounded-xl py-4 pl-12 pr-4 text-white placeholder-brand-100/30 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition-all duration-300 shadow-[0_0_15px_rgba(34,197,94,0.0)] focus:shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                        />
                    </div>
                )}

                {engine === 'graphapi' && (
                    <>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Key className="w-5 h-5 text-brand-500/50 group-focus-within:text-brand-400 transition-colors" />
                            </div>
                            <input
                                type="password"
                                value={sessionId}
                                onChange={(e) => { setSessionId(e.target.value); setError(''); }}
                                placeholder="Session ID (sessionid=... veya sadece değer)"
                                className="w-full bg-brand-gray border border-brand-500/20 rounded-xl py-4 pl-12 pr-4 text-white placeholder-brand-100/30 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition-all duration-300"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Gauge className="w-5 h-5 text-brand-500/50 flex-shrink-0" />
                            <label className="text-xs text-brand-100/60 flex-shrink-0">Hız ayarı:</label>
                            <input
                                type="range"
                                min="50" max="2000" step="50"
                                value={rps}
                                onChange={(e) => setRps(Number(e.target.value))}
                                className="flex-1 accent-brand-500"
                            />
                            <span className="text-xs text-brand-100/40 w-16 text-right">{rps}ms</span>
                        </div>
                    </>
                )}
            </div>

            {error && (
                <p
                    className="text-sm max-w-md text-center py-2 px-3 rounded-lg bg-black/40 border border-brand-500/20 text-brand-300"
                    style={{ animation: 'fadeIn 0.2s ease both' }}
                >
                    {error}
                </p>
            )}

            <button
                onClick={handleNext}
                className="mt-2 w-full max-w-md px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_4px_20px_rgba(22,163,74,0.3)] hover:shadow-[0_4px_25px_rgba(34,197,94,0.5)]"
            >
                <span>Bağlan ve Yorumları Çek</span>
                <ArrowRight className="w-5 h-5" />
            </button>
        </div>
    );
}

export default memo(InputStep);

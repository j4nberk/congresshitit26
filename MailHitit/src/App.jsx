import React, { useState, useCallback, useEffect, memo } from 'react';
import ConfigStep from './components/ConfigStep';
import ComposeStep from './components/ComposeStep';
import RecipientsStep from './components/RecipientsStep';
import SendStep from './components/SendStep';
import { Mail } from 'lucide-react';

const STEPS = ['Ayarlar', 'Mail Editör', 'Alıcılar', 'Gönderim'];

// Memo-wrapped step components — sadece kendi prop'ları değiştiğinde re-render
const MemoConfigStep = memo(ConfigStep);
const MemoComposeStep = memo(ComposeStep);
const MemoRecipientsStep = memo(RecipientsStep);
const MemoSendStep = memo(SendStep);

function App() {
    const [step, setStep] = useState(0);
    const [loaded, setLoaded] = useState(false);
    const [data, setData] = useState({
        config: {
            smtpHost: '',
            smtpPort: '465',
            senderEmail: '',
            senderPassword: '',
            senderName: '',
        },
        subject: '',
        htmlContent: '',
        attachments: [],      // [{ path, filename, size }]
        excelMeta: null,       // { columns, rowCount, fileName, previewRows } — satır verisi YOK
        emailColumn: '',       // which column has email addresses
        rowRange: { from: 1, to: null },  // 1-indexed
        rateLimit: 150,
        placeholderMapping: {},
    });

    // Başlangıçta kaydedilmiş ayarları yükle
    useEffect(() => {
        if (!window.electronAPI) { setLoaded(true); return; }
        window.electronAPI.loadSettings().then(saved => {
            if (saved) {
                setData(prev => ({
                    ...prev,
                    config: saved.config?.smtpHost ? saved.config : prev.config,
                    subject: saved.subject || prev.subject,
                    htmlContent: saved.htmlContent || prev.htmlContent,
                    rateLimit: saved.rateLimit || prev.rateLimit,
                }));
            }
            setLoaded(true);
        }).catch(() => setLoaded(true));
    }, []);

    // Ayarlar değiştiğinde otomatik kaydet (debounced)
    useEffect(() => {
        if (!loaded || !window.electronAPI) return;
        const timer = setTimeout(() => {
            window.electronAPI.saveSettings({
                config: data.config,
                subject: data.subject,
                htmlContent: data.htmlContent,
                rateLimit: data.rateLimit,
            });
        }, 500);
        return () => clearTimeout(timer);
    }, [data.config, data.subject, data.htmlContent, data.rateLimit, loaded]);

    const nextStep = useCallback(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), []);
    const prevStep = useCallback(() => setStep(s => Math.max(s - 1, 0)), []);
    const goToStep = useCallback((s) => setStep(s), []);
    const handleReset = useCallback(() => setStep(0), []);

    if (!loaded) {
        return (
            <div className="min-h-screen bg-brand-black flex items-center justify-center">
                <div className="text-brand-400 text-sm animate-pulse">Yükleniyor...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-black text-white font-sans flex flex-col" style={{ WebkitAppRegion: 'drag' }}>
            {/* Header */}
            <header
                className="flex justify-between items-center px-6 pt-6 pb-2 flex-shrink-0"
                style={{ WebkitAppRegion: 'no-drag' }}
            >
                <h1
                    className="text-2xl font-bold tracking-tighter bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent cursor-pointer hover:scale-[1.05] transition-transform duration-200"
                    onClick={() => setStep(0)}
                >
                    Mail<span className="text-white">Hitit</span>
                </h1>

                {/* Step indicator */}
                <div className="flex items-center gap-2">
                    {STEPS.map((name, idx) => (
                        <button
                            key={name}
                            onClick={() => idx < step && goToStep(idx)}
                            disabled={idx > step}
                            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200 ${idx === step
                                ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40'
                                : idx < step
                                    ? 'text-brand-100/50 hover:text-brand-400 cursor-pointer'
                                    : 'text-brand-100/20 cursor-not-allowed'
                                }`}
                        >
                            <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${idx === step
                                ? 'bg-brand-500 text-black'
                                : idx < step
                                    ? 'bg-brand-500/30 text-brand-400'
                                    : 'bg-brand-gray text-brand-100/30 border border-brand-100/10'
                                }`}>
                                {idx < step ? '✓' : idx + 1}
                            </span>
                            <span className="hidden sm:inline">{name}</span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-brand-500/60" />
                </div>
            </header>

            {/* Main content */}
            <main
                className="flex-1 flex flex-col items-center px-6 pb-6 overflow-y-auto"
                style={{ WebkitAppRegion: 'no-drag' }}
            >
                <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col" style={{ animation: 'fadeIn 0.3s ease both' }}>
                    {step === 0 && (
                        <MemoConfigStep data={data} setData={setData} onNext={nextStep} />
                    )}
                    {step === 1 && (
                        <MemoComposeStep data={data} setData={setData} onNext={nextStep} onPrev={prevStep} />
                    )}
                    {step === 2 && (
                        <MemoRecipientsStep data={data} setData={setData} onNext={nextStep} onPrev={prevStep} />
                    )}
                    {step === 3 && (
                        <MemoSendStep data={data} setData={setData} onPrev={prevStep} onReset={handleReset} />
                    )}
                </div>
            </main>
        </div>
    );
}

export default App;

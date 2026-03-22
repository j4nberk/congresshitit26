import React, { useState } from 'react';
import { Server, KeyRound, User, AtSign, ArrowRight, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function ConfigStep({ data, setData, onNext }) {
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null); // null | 'success' | 'error'
    const [testError, setTestError] = useState('');

    const c = data.config;

    const update = (field, value) => {
        setData(prev => ({
            ...prev,
            config: { ...prev.config, [field]: value }
        }));
        setTestResult(null);
    };

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const result = await window.electronAPI.testSmtp(c);
            if (result.success) {
                setTestResult('success');
            } else {
                setTestResult('error');
                setTestError(result.error || 'Bağlantı başarısız');
            }
        } catch (err) {
            setTestResult('error');
            setTestError(err.message);
        }
        setTesting(false);
    };

    const fields = [
        { key: 'smtpHost', label: 'SMTP Sunucu', icon: Server, placeholder: 'mail.example.com' },
        { key: 'smtpPort', label: 'Port', icon: Server, placeholder: '465', type: 'number' },
        { key: 'senderEmail', label: 'Gönderici E-Posta', icon: AtSign, placeholder: 'info@example.com' },
        { key: 'senderPassword', label: 'Şifre', icon: KeyRound, placeholder: '••••••••', type: 'password' },
        { key: 'senderName', label: 'Gönderici Adı', icon: User, placeholder: 'Kongre Komitesi' },
    ];

    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 py-8" style={{ animation: 'fadeIn 0.3s ease both' }}>
            <div className="text-center mb-2">
                <h2 className="text-3xl font-semibold mb-2 text-white">SMTP Ayarları</h2>
                <p className="text-brand-100/60 text-sm max-w-md mx-auto">
                    Mail gönderimi için SMTP sunucu bilgilerini girin. Varsayılan olarak kongre sunucusu ayarlanmıştır.
                </p>
            </div>

            <div className="w-full max-w-lg flex flex-col gap-3">
                {fields.map(({ key, label, icon: Icon, placeholder, type }) => (
                    <div key={key} className="group">
                        <label className="text-xs text-brand-100/50 font-medium mb-1 block ml-1">{label}</label>
                        <div className="flex items-center gap-3 bg-brand-gray border border-brand-500/15 rounded-xl px-4 py-3 focus-within:border-brand-500/50 transition-all">
                            <Icon className="w-4 h-4 text-brand-500/60 flex-shrink-0" />
                            <input
                                type={type || 'text'}
                                value={c[key]}
                                onChange={(e) => update(key, e.target.value)}
                                placeholder={placeholder}
                                className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-brand-100/25"
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Test + Result */}
            <div className="w-full max-w-lg flex flex-col items-center gap-3 mt-2">
                <button
                    onClick={handleTest}
                    disabled={testing || !c.smtpHost || !c.senderEmail || !c.senderPassword}
                    className="w-full px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all border border-brand-500/20 bg-brand-gray hover:bg-brand-900/50 hover:border-brand-500/40 text-brand-400 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    {testing ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Bağlantı Test Ediliyor...</>
                    ) : (
                        <>Bağlantıyı Test Et</>
                    )}
                </button>

                {testResult === 'success' && (
                    <div className="flex items-center gap-2 text-brand-500 text-sm bg-brand-500/10 px-4 py-2 rounded-lg" style={{ animation: 'fadeIn 0.2s ease both' }}>
                        <CheckCircle className="w-4 h-4" /> SMTP bağlantısı başarılı!
                    </div>
                )}
                {testResult === 'error' && (
                    <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 px-4 py-2 rounded-lg" style={{ animation: 'fadeIn 0.2s ease both' }}>
                        <XCircle className="w-4 h-4" /> {testError}
                    </div>
                )}
            </div>

            {/* Next */}
            <button
                onClick={onNext}
                disabled={!c.smtpHost || !c.senderEmail || !c.senderPassword}
                className={`mt-4 w-full max-w-lg px-8 py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-[0_4px_20px_rgba(22,163,74,0.2)] ${c.smtpHost && c.senderEmail && c.senderPassword
                    ? 'bg-brand-600 hover:bg-brand-500 text-white hover:shadow-[0_4px_25px_rgba(34,197,94,0.4)] active:scale-95'
                    : 'bg-brand-gray text-brand-100/30 cursor-not-allowed border border-brand-500/10'
                    }`}
            >
                <span>Mail Düzenlemeye Geç</span>
                <ArrowRight className="w-5 h-5" />
            </button>
        </div>
    );
}

import React, { useState, useEffect, memo } from 'react';
import { Settings as SettingsIcon, Server, KeyRound, User, AtSign, Loader2, CheckCircle, XCircle, FileText, Sparkles } from 'lucide-react';
import { APP_THEMES } from '../theme';

const TEMPLATE_META = {
    accept: {
        title: 'Kabul Edilen Bildiriler İçin Şablon',
        color: 'text-green-400',
        variables: ['ad_soyad', 'donem', 'e-posta', 'tel', 'bildiri_basligi', 'bildiri_ozeti', 'bildiri_no', 'puan', 'atanan_hoca'],
        subjectPlaceholder: 'Örn: Kongre Başvuru Sonucu: {bildiri_basligi}',
        contentPlaceholder: '<html><body><h1>Sayın {ad_soyad},</h1><p>Bildiriniz {puan} puan alarak...</p></body></html>'
    },
    reject: {
        title: 'Reddedilen Bildiriler İçin Şablon',
        color: 'text-red-400',
        variables: ['ad_soyad', 'donem', 'e-posta', 'tel', 'bildiri_basligi', 'bildiri_ozeti', 'bildiri_no', 'puan', 'atanan_hoca'],
        subjectPlaceholder: 'Örn: Kongre Başvuru Sonucu: {bildiri_basligi}',
        contentPlaceholder: '<html><body><h1>Sayın {ad_soyad},</h1><p>Bildiriniz maalesef...</p></body></html>'
    },
    teacherEval: {
        title: 'Hoca Değerlendirme Maili Şablonu',
        color: 'text-blue-400',
        variables: ['hoca_adi', 'bildiri_tablosu', 'bildiri_sayisi'],
        subjectPlaceholder: 'Örn: Bildiri Değerlendirme Görevi - {bildiri_sayisi} Bildiri',
        contentPlaceholder: '<div>\nSayın {hoca_adi},\nAşağıdaki bildiriler size atanmıştır:\n{bildiri_tablosu}\n</div>'
    }
};

const TemplateEditor = memo(({ type, data, updateTemplate }) => {
    const meta = TEMPLATE_META[type];
    const template = data.templates[type] || { subject: '', htmlContent: '' };
    
    // Local state to prevent re-render focus issues
    const [localSubject, setLocalSubject] = useState(template.subject);
    const [localContent, setLocalContent] = useState(template.htmlContent);

    // Sync from props if template changes (e.g. switching tabs)
    useEffect(() => {
        setLocalSubject(template.subject);
        setLocalContent(template.htmlContent);
    }, [type, template.subject, template.htmlContent]);

    // Debounced update to global state
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSubject !== template.subject) updateTemplate(type, 'subject', localSubject);
            if (localContent !== template.htmlContent) updateTemplate(type, 'htmlContent', localContent);
        }, 800);
        return () => clearTimeout(timer);
    }, [localSubject, localContent, type, updateTemplate, template.subject, template.htmlContent]);
    
    return (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 mb-2">
                <FileText className={`w-5 h-5 ${meta.color}`} />
                <h3 className="text-lg font-medium text-white">{meta.title}</h3>
            </div>
            
            <div className="text-brand-100/60 text-sm bg-black/30 p-4 rounded-xl border border-brand-800/50">
                <p className="mb-2 font-medium">Kullanılabilecek Değişkenler:</p>
                <div className="flex flex-wrap gap-2">
                    {meta.variables.map(v => (
                        <span key={v} className="bg-brand-900/50 border border-brand-800 text-brand-300 px-2 py-1 rounded text-xs font-mono">
                            {`{${v}}`}
                        </span>
                    ))}
                </div>
                {type === 'teacherEval' && (
                    <p className="mt-3 text-xs text-brand-100/40">
                        <strong>{'{bildiri_tablosu}'}</strong> değişkeni otomatik olarak atanmış bildirilerin HTML tablosuna dönüştürülür.
                    </p>
                )}
            </div>

            <div>
                <label className="block text-sm text-brand-100/70 mb-1.5">Mail Konusu (Subject)</label>
                <input 
                    type="text" 
                    value={localSubject}
                    onChange={(e) => setLocalSubject(e.target.value)}
                    onBlur={() => updateTemplate(type, 'subject', localSubject)}
                    placeholder={meta.subjectPlaceholder}
                    className="w-full bg-black/40 border border-brand-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-500 transition-colors"
                />
            </div>

            <div className="min-h-[300px] flex flex-col">
                <label className="block text-sm text-brand-100/70 mb-1.5 flex items-center justify-between">
                    <span>Mail İçeriği (HTML)</span>
                </label>
                <div className="flex-1">
                    <textarea 
                        value={localContent}
                        onChange={(e) => setLocalContent(e.target.value)}
                        onBlur={() => updateTemplate(type, 'htmlContent', localContent)}
                        placeholder={meta.contentPlaceholder}
                        className="w-full h-48 sm:min-h-[300px] font-mono text-sm bg-brand-dark border border-brand-800 rounded-xl px-5 py-4 text-brand-100 outline-none focus:border-brand-500/50 transition-all resize-y"
                        spellCheck={false}
                    />
                </div>
            </div>
        </div>
    );
});

export default function Settings({ currentTheme, onThemeChange }) {
    const [activeTab, setActiveTab] = useState('smtp'); // 'smtp', 'appearance', 'storage', 'accept', 'reject', 'teacherEval'
    const [loading, setLoading] = useState(true);
    
    // Default Empty Data Structure
    const [data, setData] = useState({
        config: {
            smtpHost: '',
            smtpPort: '465',
            senderEmail: '',
            senderPassword: '',
            senderName: '',
            docxSavePath: '',
        },
        templates: {
            accept: { subject: '', htmlContent: '' },
            reject: { subject: '', htmlContent: '' },
            teacherEval: { subject: 'Bildiri Değerlendirme Görevi - {bildiri_sayisi} Bildiri', htmlContent: '<div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;">\n<h2 style="color:#10b981;">Bildiri Değerlendirme Görevi</h2>\n<p>Sayın <strong>{hoca_adi}</strong>,</p>\n<p>Aşağıdaki bildiriler değerlendirmeniz için tarafınıza atanmıştır. Bildiri dosyaları ek olarak gönderilmiştir.</p>\n{bildiri_tablosu}\n<p style="color:#6b7280;font-size:13px;margin-top:24px;">Bu mail BildiriHitit sistemi tarafından otomatik gönderilmiştir.</p>\n</div>' }
        },
        rateLimit: 150
    });

    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [testError, setTestError] = useState('');

    useEffect(() => {
        const controller = new AbortController();
        let isMounted = true;

        if (window.electronAPI) {
            window.electronAPI.loadSettings().then(saved => {
                if (isMounted) {
                    if (saved) {
                        setData(prev => ({
                            ...prev,
                            config: saved.config?.smtpHost ? saved.config : prev.config,
                            templates: saved.templates || prev.templates,
                            rateLimit: saved.rateLimit || prev.rateLimit
                        }));
                    }
                    setLoading(false);
                }
            }).catch(() => {
                if (isMounted) {
                    setLoading(false);
                }
            });
        } else {
            setLoading(false);
        }

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, []);

    // Auto-save logic
    useEffect(() => {
        if (!loading && window.electronAPI) {
            const timer = setTimeout(() => {
                window.electronAPI.saveSettings({
                    config: data.config,
                    templates: data.templates,
                    rateLimit: data.rateLimit
                });
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [data, loading]);

    const c = data.config;

    const updateConfig = (field, value) => {
        setData(prev => ({ ...prev, config: { ...prev.config, [field]: value } }));
        setTestResult(null);
    };

    const updateTemplate = (type, field, value) => {
        setData(prev => ({
            ...prev,
            templates: {
                ...prev.templates,
                [type]: {
                    ...prev.templates[type],
                    [field]: value
                }
            }
        }));
    };

    const handleTest = async () => {
        if (!window.electronAPI) return;
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

    const handleSelectDir = async () => {
        if (!window.electronAPI) return;
        const res = await window.electronAPI.selectDirectory();
        if (res.success && res.path) {
            updateConfig('docxSavePath', res.path);
        }
    };

    if (loading) return <div>Yükleniyor...</div>;

    return (
        <div className="space-y-6 h-full flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-xl font-semibold flex items-center gap-2 flex-shrink-0">
                <SettingsIcon className="text-brand-400" />
                Ayarlar & Şablonlar
            </h2>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-brand-800 pb-2 flex-shrink-0">
                <button
                    onClick={() => setActiveTab('smtp')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'smtp' ? 'bg-brand-500/20 text-brand-400' : 'text-brand-100/60 hover:bg-brand-800/50'}`}
                >
                    SMTP Sunucu Ayarları
                </button>
                <button
                    onClick={() => setActiveTab('appearance')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'appearance' ? 'bg-brand-500/15 text-brand-300' : 'text-brand-100/60 hover:bg-brand-800/50'}`}
                >
                    Tema
                </button>
                <button
                    onClick={() => setActiveTab('storage')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'storage' ? 'bg-brand-500/10 text-brand-300' : 'text-brand-100/60 hover:bg-brand-800/50'}`}
                >
                    Bildiri Arşivi
                </button>
                <button
                    onClick={() => setActiveTab('accept')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'accept' ? 'bg-green-500/20 text-green-400' : 'text-brand-100/60 hover:bg-brand-800/50'}`}
                >
                    Kabul Edilen Şablonu
                </button>
                <button
                    onClick={() => setActiveTab('reject')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'reject' ? 'bg-red-500/20 text-red-400' : 'text-brand-100/60 hover:bg-brand-800/50'}`}
                >
                    Reddedilen Şablonu
                </button>
                <button
                    onClick={() => setActiveTab('teacherEval')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'teacherEval' ? 'bg-blue-500/20 text-blue-400' : 'text-brand-100/60 hover:bg-brand-800/50'}`}
                >
                    Hoca Değerlendirme
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto pr-2 pb-6">
                {activeTab === 'smtp' && (
                    <div className="max-w-lg space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-brand-900/10 border border-brand-800 p-6 rounded-xl space-y-4">
                            {[
                                { key: 'smtpHost', label: 'SMTP Sunucu', icon: Server, placeholder: 'mail.example.com' },
                                { key: 'smtpPort', label: 'Port', icon: Server, placeholder: '465', type: 'number' },
                                { key: 'senderEmail', label: 'Gönderici E-Posta', icon: AtSign, placeholder: 'info@example.com' },
                                { key: 'senderPassword', label: 'Şifre', icon: KeyRound, placeholder: '••••••••', type: 'password' },
                                { key: 'senderName', label: 'Gönderici Adı', icon: User, placeholder: 'Kongre Komitesi' },
                            ].map(({ key, label, icon: Icon, placeholder, type }) => (
                                <div key={key}>
                                    <label className="text-sm text-brand-100/50 font-medium mb-1.5 block">{label}</label>
                                    <div className="flex items-center gap-3 bg-black/40 border border-brand-800 rounded-lg px-4 py-2.5 focus-within:border-brand-500/50 transition-all">
                                        <Icon className="w-4 h-4 text-brand-500/60 flex-shrink-0" />
                                        <input
                                            type={type || 'text'}
                                            value={c[key] || ''}
                                            onChange={(e) => updateConfig(key, e.target.value)}
                                            placeholder={placeholder}
                                            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-brand-100/25"
                                        />
                                    </div>
                                </div>
                            ))}
                            <div className="pt-4 flex flex-col items-center gap-3">
                                <button
                                    onClick={handleTest}
                                    disabled={testing || !c.smtpHost || !c.senderEmail || !c.senderPassword}
                                    className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-lg"
                                >
                                    {testing ? <><Loader2 className="w-4 h-4 animate-spin" /> Test Ediliyor...</> : 'Bağlantıyı Test Et'}
                                </button>
                                
                                {testResult === 'success' && <div className="text-brand-500 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Bağlantı başarılı!</div>}
                                {testResult === 'error' && <div className="text-red-400 text-sm flex items-center gap-2"><XCircle className="w-4 h-4"/> {testError}</div>}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'appearance' && (
                    <div className="max-w-3xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-brand-900/10 border border-brand-800 p-6 rounded-xl space-y-5">
                            <div>
                                <h3 className="text-lg font-medium text-white flex items-center gap-2 mb-2">
                                    <Sparkles className="w-5 h-5 text-brand-400" />
                                    Uygulama Teması
                                </h3>
                                <p className="text-sm text-brand-100/60">
                                    Arayüzün renklerini ve atmosferini seçin. Tema seçimi otomatik kaydedilir.
                                </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                {APP_THEMES.map(theme => {
                                    const isActive = currentTheme === theme.id

                                    return (
                                        <button
                                            key={theme.id}
                                            type="button"
                                            onClick={() => onThemeChange?.(theme.id)}
                                            className={`group overflow-hidden rounded-2xl border text-left transition-all ${
                                                isActive
                                                    ? 'border-brand-400 bg-brand-500/10 shadow-[0_0_0_1px_rgba(74,222,128,0.18),0_20px_50px_rgba(0,0,0,0.25)]'
                                                    : 'border-brand-800/80 bg-black/30 hover:border-brand-500/50 hover:bg-brand-900/20'
                                            }`}
                                        >
                                            <div className={`h-28 bg-gradient-to-br ${theme.previewClassName} relative overflow-hidden`}>
                                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(74,222,128,0.28),transparent_40%)]" />
                                                <div className="absolute left-4 right-4 top-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3 backdrop-blur-xl">
                                                    <div className="flex items-center justify-between">
                                                        <div className="h-2 w-16 rounded-full bg-white/20" />
                                                        <div className="h-2 w-2 rounded-full bg-[#39ff88]/70" />
                                                    </div>
                                                    <div className="mt-3 h-2 w-24 rounded-full bg-white/15" />
                                                    <div className="mt-2 h-2 w-32 rounded-full bg-white/10" />
                                                </div>
                                            </div>
                                            <div className="space-y-2 px-5 py-4">
                                                <div className="flex items-center justify-between gap-4">
                                                    <span className="text-base font-semibold text-white">{theme.name}</span>
                                                    {isActive && (
                                                        <span className="rounded-full bg-brand-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-300">
                                                            Aktif
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm leading-relaxed text-brand-100/55">
                                                    {theme.description}
                                                </p>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'storage' && (
                    <div className="max-w-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-brand-900/10 border border-brand-800 p-6 rounded-xl space-y-4">
                            <div>
                                <h3 className="text-lg font-medium text-white flex items-center gap-2 mb-2">
                                    <FileText className="w-5 h-5 text-brand-400" />
                                    Bildiri Arşiv Klasörü
                                </h3>
                                <p className="text-sm text-brand-100/60">
                                    Sisteme eklenen .docx bildiri özetleri, silinmeye karşı ek bir kopya olarak bu klasöre taşınır / kopyalanır.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 flex items-center gap-3 bg-black/40 border border-brand-800 rounded-lg px-4 py-2.5">
                                        <FileText className="w-4 h-4 text-brand-500/60 flex-shrink-0" />
                                        <div className="text-sm text-brand-100/60 truncate flex-1">
                                            {c.docxSavePath || 'Henüz bir klasör seçilmedi'}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleSelectDir}
                                        className="bg-brand-800 hover:bg-brand-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-brand-700"
                                    >
                                        Klasör Seç
                                    </button>
                                </div>
                                <p className="text-[11px] text-brand-100/40 mt-1.5 flex items-start gap-1">
                                    <span className="text-yellow-500/80 mt-[1px]">ⓘ</span>
                                    <span>
                                        Öğrenci eklerken seçilen orijinal .docx dosyası bu klasöre, öğrenci adı ve bildiri numarasına göre yeniden adlandırılarak kopyalanır.
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'accept' && <TemplateEditor type="accept" data={data} updateTemplate={updateTemplate} />}
                {activeTab === 'reject' && <TemplateEditor type="reject" data={data} updateTemplate={updateTemplate} />}
                {activeTab === 'teacherEval' && <TemplateEditor type="teacherEval" data={data} updateTemplate={updateTemplate} />}
            </div>
        </div>
    );
}

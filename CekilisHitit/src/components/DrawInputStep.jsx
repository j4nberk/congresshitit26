import React, { useState, useMemo, memo } from 'react';
import { FileJson, Upload, ArrowRight, Users, Calendar, Link2, Settings2 } from 'lucide-react';

// Common field name aliases for auto-detection
const USERNAME_ALIASES = ['username', 'ownerUsername', 'user', 'owner', 'name', 'kullanici', 'userName', 'user_name', 'screen_name', 'handle'];
const TEXT_ALIASES = ['text', 'comment', 'body', 'message', 'content', 'yorum', 'commentText'];
const PIC_ALIASES = ['picUrl', 'ownerProfilePicUrl', 'profile_pic_url', 'profilePicUrl', 'avatar', 'avatarUrl', 'pic', 'photo'];

function autoDetectField(keys, aliases) {
    // Exact match first
    for (const alias of aliases) {
        if (keys.includes(alias)) return alias;
    }
    // Case-insensitive match
    const lower = keys.map(k => ({ orig: k, lower: k.toLowerCase() }));
    for (const alias of aliases) {
        const found = lower.find(k => k.lower === alias.toLowerCase());
        if (found) return found.orig;
    }
    // Partial match
    for (const alias of aliases) {
        const found = lower.find(k => k.lower.includes(alias.toLowerCase()));
        if (found) return found.orig;
    }
    return '';
}

function DrawInputStep({ data, setData, onNext }) {
    const [rawComments, setRawComments] = useState([]);
    const [allKeys, setAllKeys] = useState([]);
    const [fieldMap, setFieldMap] = useState({ username: '', text: '', picUrl: '' });
    const [fileInfo, setFileInfo] = useState(null);
    const [error, setError] = useState('');

    // Mapped comments based on field selection
    const mappedComments = useMemo(() => {
        if (!rawComments.length || !fieldMap.username) return [];
        return rawComments.map((c, i) => ({
            id: i + 1,
            username: String(c[fieldMap.username] || '').trim(),
            text: fieldMap.text ? String(c[fieldMap.text] || '') : '',
            picUrl: fieldMap.picUrl ? (c[fieldMap.picUrl] || null) : null,
        })).filter(c => c.username);
    }, [rawComments, fieldMap]);

    const uniqueUsers = useMemo(() => {
        return new Set(mappedComments.map(c => c.username)).size;
    }, [mappedComments]);

    const handleOpenFile = async () => {
        try {
            const result = await window.electronAPI.openJsonFile();
            if (!result.success) {
                if (result.reason !== 'cancelled') setError('Dosya açılamadı: ' + result.reason);
                return;
            }

            const json = result.data;
            let comments = [];
            let meta = null;

            if (Array.isArray(json)) {
                comments = json;
            } else if (json && Array.isArray(json.comments)) {
                comments = json.comments;
                meta = json.meta || null;
            } else if (json && typeof json === 'object') {
                // Try to find the first array property
                const arrayKey = Object.keys(json).find(k => Array.isArray(json[k]));
                if (arrayKey) {
                    comments = json[arrayKey];
                }
            }

            if (!Array.isArray(comments) || comments.length === 0) {
                setError('Dosyada yorum listesi bulunamadı.');
                return;
            }

            // Collect all unique keys from first 10 entries
            const keySet = new Set();
            comments.slice(0, 10).forEach(c => {
                if (c && typeof c === 'object') {
                    Object.keys(c).forEach(k => keySet.add(k));
                }
            });
            const keys = [...keySet];
            setAllKeys(keys);
            setRawComments(comments);

            // Auto-detect fields
            const detectedUsername = autoDetectField(keys, USERNAME_ALIASES);
            const detectedText = autoDetectField(keys, TEXT_ALIASES);
            const detectedPic = autoDetectField(keys, PIC_ALIASES);
            setFieldMap({
                username: detectedUsername,
                text: detectedText,
                picUrl: detectedPic
            });

            setFileInfo({
                filePath: result.filePath,
                fileName: result.filePath.split('/').pop().split('\\').pop(),
                totalComments: comments.length,
                url: meta?.url || null,
                date: meta?.date || null,
            });
            setError('');
        } catch (err) {
            setError('Dosya okuma hatası: ' + err.message);
        }
    };

    const handleNext = () => {
        setData({
            ...data,
            comments: mappedComments,
            jsonSource: fileInfo
        });
        onNext();
    };

    // Preview: show first 3 mapped entries
    const preview = mappedComments.slice(0, 3);

    return (
        <div
            className="w-full flex flex-col items-center gap-6"
            style={{ animation: 'fadeIn 0.3s ease both' }}
        >
            <div className="w-16 h-16 rounded-2xl bg-brand-900 border border-brand-500/30 flex items-center justify-center mb-2 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                <FileJson className="w-8 h-8 text-brand-400" />
            </div>

            <div className="text-center mb-0">
                <h2 className="text-3xl font-semibold mb-2 text-white">Çekiliş Dosyası Yükle</h2>
                <p className="text-brand-100/60 max-w-md mx-auto text-sm">
                    Daha önce kaydettiğiniz yorum listesini (.json) yükleyerek çekilişe başlayın.
                </p>
            </div>

            {/* Upload Area */}
            {!fileInfo ? (
                <button
                    onClick={handleOpenFile}
                    className="w-full max-w-md border-2 border-dashed border-brand-500/30 hover:border-brand-400 rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all bg-brand-gray/50 hover:bg-brand-gray group cursor-pointer"
                >
                    <div className="w-16 h-16 rounded-full bg-brand-900/50 flex items-center justify-center mb-4 text-brand-400 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">JSON Dosyası Seç</h3>
                    <p className="text-brand-100/60 text-xs">Tıklayarak yorum dosyanızı seçin</p>
                </button>
            ) : (
                <div className="w-full max-w-md space-y-4" style={{ animation: 'fadeIn 0.2s ease both' }}>
                    {/* File Info Card */}
                    <div className="bg-brand-gray border border-brand-500/30 rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-400 flex-shrink-0">
                                <FileJson className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-white font-bold truncate">{fileInfo.fileName}</h4>
                                <p className="text-brand-100/50 text-xs truncate">{fileInfo.filePath}</p>
                            </div>
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between items-center bg-brand-black/50 rounded-lg p-3">
                                <span className="text-brand-100/60 text-sm flex items-center gap-2"><Users className="w-4 h-4" /> Toplam Kayıt</span>
                                <span className="text-white font-bold">{fileInfo.totalComments}</span>
                            </div>
                            <div className="flex justify-between items-center bg-brand-black/50 rounded-lg p-3">
                                <span className="text-brand-100/60 text-sm flex items-center gap-2"><Users className="w-4 h-4" /> Benzersiz Kullanıcı</span>
                                <span className="text-white font-bold">{uniqueUsers}</span>
                            </div>
                            {fileInfo.url && (
                                <div className="flex justify-between items-center bg-brand-black/50 rounded-lg p-3">
                                    <span className="text-brand-100/60 text-sm flex items-center gap-2"><Link2 className="w-4 h-4" /> Kaynak</span>
                                    <span className="text-brand-400 text-xs font-mono truncate max-w-[200px]">{fileInfo.url}</span>
                                </div>
                            )}
                            {fileInfo.date && (
                                <div className="flex justify-between items-center bg-brand-black/50 rounded-lg p-3">
                                    <span className="text-brand-100/60 text-sm flex items-center gap-2"><Calendar className="w-4 h-4" /> Tarih</span>
                                    <span className="text-brand-100/80 text-sm">{new Date(fileInfo.date).toLocaleDateString('tr-TR')}</span>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleOpenFile}
                            className="text-brand-400 hover:text-white text-xs font-medium transition-colors"
                        >
                            Farklı dosya seç
                        </button>
                    </div>

                    {/* Field Mapping */}
                    <div className="bg-brand-gray border border-brand-500/20 rounded-2xl p-5">
                        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                            <Settings2 className="w-4 h-4 text-brand-400" />
                            Alan Eşleme
                        </h4>
                        <p className="text-brand-100/40 text-xs mb-4">
                            JSON'daki hangi alanın kullanıcı adına karşılık geldiğini seçin.
                        </p>

                        <div className="space-y-3">
                            {/* Username field - required */}
                            <div>
                                <label className="block text-xs font-medium text-brand-100/70 mb-1">
                                    Kullanıcı Adı <span className="text-red-400">*</span>
                                </label>
                                <select
                                    value={fieldMap.username}
                                    onChange={e => setFieldMap(prev => ({ ...prev, username: e.target.value }))}
                                    className="w-full bg-brand-black border border-brand-500/20 rounded-lg p-2.5 text-white text-sm focus:border-brand-400 focus:outline-none"
                                >
                                    <option value="">-- Seçiniz --</option>
                                    {allKeys.map(k => (
                                        <option key={k} value={k}>{k}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Text field - optional */}
                            <div>
                                <label className="block text-xs font-medium text-brand-100/70 mb-1">
                                    Yorum Metni <span className="text-brand-100/30">(opsiyonel)</span>
                                </label>
                                <select
                                    value={fieldMap.text}
                                    onChange={e => setFieldMap(prev => ({ ...prev, text: e.target.value }))}
                                    className="w-full bg-brand-black border border-brand-500/20 rounded-lg p-2.5 text-white text-sm focus:border-brand-400 focus:outline-none"
                                >
                                    <option value="">-- Yok --</option>
                                    {allKeys.map(k => (
                                        <option key={k} value={k}>{k}</option>
                                    ))}
                                </select>
                            </div>

                            {/* PicUrl field - optional */}
                            <div>
                                <label className="block text-xs font-medium text-brand-100/70 mb-1">
                                    Profil Fotoğrafı <span className="text-brand-100/30">(opsiyonel)</span>
                                </label>
                                <select
                                    value={fieldMap.picUrl}
                                    onChange={e => setFieldMap(prev => ({ ...prev, picUrl: e.target.value }))}
                                    className="w-full bg-brand-black border border-brand-500/20 rounded-lg p-2.5 text-white text-sm focus:border-brand-400 focus:outline-none"
                                >
                                    <option value="">-- Yok --</option>
                                    {allKeys.map(k => (
                                        <option key={k} value={k}>{k}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Preview */}
                        {preview.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-white/5">
                                <p className="text-brand-100/40 text-xs mb-2">Önizleme (ilk 3):</p>
                                <div className="space-y-1.5">
                                    {preview.map((p, i) => (
                                        <div key={i} className="flex items-center gap-2 bg-brand-black/30 rounded-lg px-3 py-1.5 text-xs">
                                            {p.picUrl && (
                                                <img src={p.picUrl} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                                            )}
                                            <span className="text-brand-400 font-medium">@{p.username}</span>
                                            {p.text && (
                                                <span className="text-brand-100/30 truncate">{p.text.substring(0, 40)}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {error && (
                <p
                    className="text-sm max-w-md text-center py-2 px-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400"
                    style={{ animation: 'fadeIn 0.2s ease both' }}
                >
                    {error}
                </p>
            )}

            <button
                onClick={handleNext}
                disabled={mappedComments.length === 0 || !fieldMap.username}
                className={`mt-2 w-full max-w-md px-8 py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-[0_4px_20px_rgba(22,163,74,0.2)] ${mappedComments.length > 0 && fieldMap.username
                    ? 'bg-brand-600 hover:bg-brand-500 text-white hover:shadow-[0_4px_25px_rgba(34,197,94,0.4)] active:scale-95'
                    : 'bg-brand-gray text-brand-100/30 cursor-not-allowed border border-brand-500/10'
                    }`}
            >
                <span>Çekiliş Ayarlarına Geç</span>
                <ArrowRight className="w-5 h-5" />
            </button>
        </div>
    );
}

export default memo(DrawInputStep);


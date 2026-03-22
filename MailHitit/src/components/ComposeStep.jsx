import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Code, Eye, Paperclip, X, FileText, Plus } from 'lucide-react';

export default function ComposeStep({ data, setData, onNext, onPrev }) {
    const [mode, setMode] = useState('html'); // 'html' | 'preview'
    const [subject, setSubject] = useState(data.subject || '');
    const [html, setHtml] = useState(data.htmlContent || '');
    const [attachments, setAttachments] = useState(data.attachments || []);
    const iframeRef = useRef(null);
    const textareaRef = useRef(null);
    const subjectRef = useRef(null);
    const [lastFocused, setLastFocused] = useState('html'); // 'html' | 'subject'
    const previewTimerRef = useRef(null);

    // Debounced preview update — 400ms bekle, her tuşta DOM rebuild yapma
    useEffect(() => {
        if (mode !== 'preview' || !iframeRef.current) return;

        if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
        previewTimerRef.current = setTimeout(() => {
            const doc = iframeRef.current?.contentDocument;
            if (doc) {
                doc.open();
                doc.write(html);
                doc.close();
            }
        }, 400);

        return () => {
            if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
        };
    }, [mode, html]);

    const handleAddAttachment = async () => {
        try {
            const result = await window.electronAPI.openAttachment();
            if (result.success) {
                setAttachments(prev => [...prev, ...result.attachments]);
            }
        } catch (err) {
            console.error('Attachment error:', err);
        }
    };

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    };

    const insertPlaceholder = (name) => {
        const text = `{${name}}`;
        if (lastFocused === 'subject') {
            const input = subjectRef.current;
            if (!input) return;
            const start = input.selectionStart || subject.length;
            const end = input.selectionEnd || subject.length;
            const newSub = subject.substring(0, start) + text + subject.substring(end);
            setSubject(newSub);
            setTimeout(() => {
                input.selectionStart = input.selectionEnd = start + text.length;
                input.focus();
            }, 0);
        } else {
            const ta = textareaRef.current;
            if (!ta) return;
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            const newHtml = html.substring(0, start) + text + html.substring(end);
            setHtml(newHtml);
            // Restore cursor
            setTimeout(() => {
                ta.selectionStart = ta.selectionEnd = start + text.length;
                ta.focus();
            }, 0);
        }
    };

    const handleNext = () => {
        setData(prev => ({
            ...prev,
            subject,
            htmlContent: html,
            attachments,
        }));
        onNext();
    };

    // If we already have excel columns, show placeholder insert buttons
    const placeholderCols = data.excelMeta?.columns || [];

    return (
        <div className="flex-1 flex flex-col gap-4 py-6" style={{ animation: 'fadeIn 0.3s ease both' }}>
            {/* Subject */}
            <div>
                <label className="text-xs text-brand-100/50 font-medium mb-1 block ml-1">Mail Konusu</label>
                <input
                    ref={subjectRef}
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    onFocus={() => setLastFocused('subject')}
                    placeholder="Kongre Başvuru Sonucu ve Atölye Yerleştirmeleri {name}"
                    className="w-full bg-brand-gray border border-brand-500/15 rounded-xl px-4 py-3 text-white text-sm outline-none placeholder:text-brand-100/25 focus:border-brand-500/50 transition-all"
                />
            </div>

            {/* Toggle HTML / Preview */}
            <div className="flex items-center justify-between">
                <div className="flex items-center bg-brand-gray rounded-xl border border-brand-500/15 p-1">
                    <button
                        onClick={() => setMode('html')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${mode === 'html'
                            ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40'
                            : 'text-brand-100/50 hover:text-white'
                            }`}
                    >
                        <Code className="w-3.5 h-3.5" /> HTML
                    </button>
                    <button
                        onClick={() => setMode('preview')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${mode === 'preview'
                            ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40'
                            : 'text-brand-100/50 hover:text-white'
                            }`}
                    >
                        <Eye className="w-3.5 h-3.5" /> Önizleme
                    </button>
                </div>

                {/* Placeholder insert (if columns loaded) */}
                {placeholderCols.length > 0 && mode === 'html' && (
                    <div className="flex items-center gap-1 flex-wrap justify-end max-w-[50%]">
                        <span className="text-[10px] text-brand-100/40 mr-1">Ekle:</span>
                        {placeholderCols.slice(0, 8).map(col => (
                            <button
                                key={col}
                                onClick={() => insertPlaceholder(col)}
                                className="text-[10px] px-2 py-1 rounded-md bg-brand-900/50 border border-brand-500/20 text-brand-400 hover:bg-brand-500/20 hover:border-brand-500/40 transition-all"
                            >
                                {`{${col}}`}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Editor area */}
            <div className="flex-1 min-h-0 relative">
                {mode === 'html' ? (
                    <textarea
                        ref={textareaRef}
                        value={html}
                        onChange={(e) => setHtml(e.target.value)}
                        onFocus={() => setLastFocused('html')}
                        placeholder="<html>&#10;  <body>&#10;    <h1>Merhaba {name}</h1>&#10;    <p>Mailinizin içeriği buraya...</p>&#10;  </body>&#10;</html>"
                        className="html-editor w-full h-full min-h-[400px] bg-brand-dark border border-brand-500/15 rounded-2xl px-5 py-4 text-brand-100 outline-none focus:border-brand-500/40 transition-all"
                        spellCheck={false}
                    />
                ) : (
                    <div className="preview-frame w-full h-full min-h-[400px] border border-brand-500/15 rounded-2xl overflow-hidden">
                        <iframe
                            ref={iframeRef}
                            title="Email Preview"
                            className="w-full h-full min-h-[400px] bg-white"
                            sandbox="allow-same-origin"
                        />
                    </div>
                )}
            </div>

            {/* Attachments */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-brand-100/50 font-medium ml-1">Ekler</label>
                    <button
                        onClick={handleAddAttachment}
                        className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-500 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" /> Ek Ekle
                    </button>
                </div>

                {attachments.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {attachments.map((att, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2 bg-brand-gray border border-brand-500/15 rounded-lg px-3 py-2 text-xs group"
                                style={{ animation: 'slide-up 0.2s ease both' }}
                            >
                                <FileText className="w-3.5 h-3.5 text-brand-500/60" />
                                <span className="text-white">{att.filename}</span>
                                <span className="text-brand-100/40">{formatSize(att.size)}</span>
                                <button
                                    onClick={() => removeAttachment(i)}
                                    className="ml-1 text-brand-100/30 hover:text-red-400 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-brand-100/30 text-xs bg-brand-gray/50 rounded-xl px-4 py-3 border border-dashed border-brand-500/10 text-center">
                        <Paperclip className="w-4 h-4 mx-auto mb-1 opacity-40" />
                        Henüz ek dosya eklenmedi
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="flex gap-3 mt-2">
                <button
                    onClick={onPrev}
                    className="px-6 py-3 rounded-xl text-sm font-medium bg-brand-gray border border-brand-500/15 text-brand-100/60 hover:text-white hover:border-brand-500/30 transition-all flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" /> Geri
                </button>
                <button
                    onClick={handleNext}
                    disabled={!subject.trim() || !html.trim()}
                    className={`flex-1 px-8 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-[0_4px_20px_rgba(22,163,74,0.2)] ${subject.trim() && html.trim()
                        ? 'bg-brand-600 hover:bg-brand-500 text-white hover:shadow-[0_4px_25px_rgba(34,197,94,0.4)] active:scale-95'
                        : 'bg-brand-gray text-brand-100/30 cursor-not-allowed border border-brand-500/10'
                        }`}
                >
                    <span>Alıcıları Ayarla</span>
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

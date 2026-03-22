import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ArrowRight, ArrowLeft, UploadCloud, CheckCircle, Table, Gauge } from 'lucide-react';
import { cleanEmail } from '../utils';

export default function RecipientsStep({ data, setData, onNext, onPrev }) {
    const [columns, setColumns] = useState(data.excelMeta?.columns || []);
    const [rowCount, setRowCount] = useState(data.excelMeta?.rowCount || 0);
    const [previewRows, setPreviewRows] = useState(data.excelMeta?.previewRows || []);
    const [fileName, setFileName] = useState(data.excelMeta?.fileName || '');
    const [emailCol, setEmailCol] = useState(data.emailColumn || '');
    const [rangeFrom, setRangeFrom] = useState(data.rowRange?.from || 1);
    const [rangeTo, setRangeTo] = useState(data.rowRange?.to || null);
    const [rateLimit, setRateLimit] = useState(data.rateLimit || 150);
    const [mapping, setMapping] = useState(data.placeholderMapping || {});
    const [error, setError] = useState('');
    const [validEmailCount, setValidEmailCount] = useState(0);

    const handleFileUpload = async () => {
        try {
            const result = await window.electronAPI.openExcel();
            if (!result.success) {
                if (result.reason && result.reason !== 'cancelled') {
                    setError(result.reason);
                }
                return;
            }

            setColumns(result.columns);
            setRowCount(result.rowCount);
            setPreviewRows(result.previewRows);
            setFileName(result.fileName);
            setRangeFrom(1);
            setRangeTo(result.rowCount);
            setError('');

            // Auto-detect email column
            const emailCandidate = result.columns.find(c =>
                c.toLowerCase().includes('mail') ||
                c.toLowerCase().includes('e-posta') ||
                c.toLowerCase().includes('email') ||
                c.toLowerCase().includes('eposta')
            );
            if (emailCandidate) setEmailCol(emailCandidate);
        } catch (err) {
            setError('Excel okunamadı: ' + err.message);
        }
    };

    // Satır aralığı değişince preview'i main'den güncelle (debounced)
    useEffect(() => {
        if (!rowCount || !window.electronAPI) return;
        const timer = setTimeout(() => {
            window.electronAPI.getExcelPreview({ from: rangeFrom, to: rangeTo || rowCount });
        }, 300);
        return () => clearTimeout(timer);
    }, [rangeFrom, rangeTo, rowCount]);

    // Email sayısını main process'te hesapla (debounced)
    useEffect(() => {
        if (!emailCol || !rowCount || !window.electronAPI) {
            setValidEmailCount(0);
            return;
        }
        const timer = setTimeout(() => {
            window.electronAPI.countValidEmails({
                emailColumn: emailCol,
                from: rangeFrom,
                to: rangeTo || rowCount,
            }).then(res => setValidEmailCount(res.count));
        }, 200);
        return () => clearTimeout(timer);
    }, [emailCol, rangeFrom, rangeTo, rowCount]);

    // Detected placeholders in the HTML template and subject
    const usedPlaceholders = useMemo(() => {
        const text = (data.subject || '') + ' ' + (data.htmlContent || '');
        const matches = text.match(/\{([a-zA-Z0-9_\sğüşöçİĞÜŞÖÇ-]+)\}/g) || [];
        return [...new Set(matches.map(m => m.slice(1, -1)))];
    }, [data.htmlContent, data.subject]);

    useEffect(() => {
        setMapping(prev => {
            const next = { ...prev };
            usedPlaceholders.forEach(ph => {
                if (next[ph] === undefined) {
                    if (columns.includes(ph)) next[ph] = ph;
                    else next[ph] = '';
                }
            });
            return next;
        });
    }, [usedPlaceholders, columns]);

    const selectedCount = Math.max(0, (rangeTo || rowCount) - Math.max(1, rangeFrom) + 1);

    const handleNext = () => {
        if (!emailCol) {
            setError('Lütfen e-posta sütununu seçin.');
            return;
        }
        if (validEmailCount === 0) {
            setError('Seçilen aralıkta geçerli e-posta bulunamadı.');
            return;
        }

        setData(prev => ({
            ...prev,
            excelMeta: { columns, rowCount, fileName, previewRows },
            emailColumn: emailCol,
            rowRange: { from: rangeFrom, to: rangeTo || rowCount },
            rateLimit,
            placeholderMapping: mapping,
        }));
        onNext();
    };

    return (
        <div className="flex-1 flex flex-col gap-5 py-6" style={{ animation: 'fadeIn 0.3s ease both' }}>
            {/* Header */}
            <div className="text-center mb-1">
                <h2 className="text-3xl font-semibold mb-2 text-white">Alıcılar</h2>
                <p className="text-brand-100/60 text-sm max-w-md mx-auto">
                    Excel dosyasından alıcıları yükleyin. <code className="text-brand-400">mailto:</code> önekleri otomatik temizlenir.
                </p>
            </div>

            {/* Upload area */}
            <div
                onClick={handleFileUpload}
                className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${rowCount > 0
                    ? 'border-brand-500 bg-brand-900/20'
                    : 'border-brand-500/30 hover:border-brand-400 bg-brand-gray/50 hover:bg-brand-gray'
                    }`}
            >
                {rowCount > 0 ? (
                    <>
                        <CheckCircle className="w-10 h-10 text-brand-500 mb-2" />
                        <h3 className="text-lg font-bold text-white mb-1">{fileName}</h3>
                        <p className="text-brand-100/70 text-sm">{rowCount} satır, {columns.length} sütun</p>
                        <p className="text-brand-100/40 text-xs mt-1">Değiştirmek için tıklayın</p>
                    </>
                ) : (
                    <>
                        <UploadCloud className="w-10 h-10 text-brand-400 mb-2" />
                        <h3 className="text-lg font-bold text-white mb-1">Excel Dosyası Yükle</h3>
                        <p className="text-brand-100/60 text-xs">.xlsx, .xls, .csv</p>
                    </>
                )}
            </div>

            {/* Settings when file loaded */}
            {rowCount > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ animation: 'fadeIn 0.25s ease both' }}>
                    {/* Email column selector */}
                    <div className="bg-brand-gray border border-brand-500/15 rounded-2xl p-4">
                        <label className="text-xs text-brand-100/50 font-medium mb-2 block">
                            <Table className="w-3.5 h-3.5 inline mr-1 opacity-60" />E-Posta Sütunu
                        </label>
                        <select
                            value={emailCol}
                            onChange={(e) => setEmailCol(e.target.value)}
                            className="w-full bg-brand-dark border border-brand-500/20 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-brand-500/50 transition-all"
                        >
                            <option value="">Sütun seçin...</option>
                            {columns.map(col => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                        {emailCol && (
                            <p className="text-brand-400 text-xs mt-2">
                                ✓ {validEmailCount} geçerli e-posta adresi bulundu
                            </p>
                        )}
                    </div>

                    {/* Row range */}
                    <div className="bg-brand-gray border border-brand-500/15 rounded-2xl p-4">
                        <label className="text-xs text-brand-100/50 font-medium mb-2 block">Gönderilecek Satır Aralığı</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min={1}
                                max={rowCount}
                                value={rangeFrom}
                                onChange={(e) => setRangeFrom(Number(e.target.value) || 1)}
                                className="w-full bg-brand-dark border border-brand-500/20 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-brand-500/50"
                            />
                            <span className="text-brand-100/40 text-sm">—</span>
                            <input
                                type="number"
                                min={rangeFrom}
                                max={rowCount}
                                value={rangeTo || rowCount}
                                onChange={(e) => setRangeTo(Number(e.target.value) || rowCount)}
                                className="w-full bg-brand-dark border border-brand-500/20 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-brand-500/50"
                            />
                        </div>
                        <p className="text-brand-100/40 text-xs mt-2">
                            {selectedCount} satır seçildi (toplam {rowCount})
                        </p>
                    </div>

                    {/* Rate limit */}
                    <div className="bg-brand-gray border border-brand-500/15 rounded-2xl p-4">
                        <label className="text-xs text-brand-100/50 font-medium mb-2 block">
                            <Gauge className="w-3.5 h-3.5 inline mr-1 opacity-60" />Saatlik Limit
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={1000}
                            value={rateLimit}
                            onChange={(e) => setRateLimit(Number(e.target.value) || 150)}
                            className="w-full bg-brand-dark border border-brand-500/20 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-brand-500/50"
                        />
                        <p className="text-brand-100/40 text-xs mt-2">
                            ~{Math.ceil(3600 / rateLimit)} saniye aralıkla gönderilecek
                        </p>
                    </div>

                    {/* Placeholder mapping */}
                    <div className="bg-brand-gray border border-brand-500/15 rounded-2xl p-4">
                        <label className="text-xs text-brand-100/50 font-medium mb-2 block">Placeholder Eşleşmeleri</label>
                        {usedPlaceholders.length > 0 ? (
                            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-2">
                                {usedPlaceholders.map(ph => (
                                    <div key={ph} className="flex items-center gap-2 text-xs">
                                        <span className="flex-1 text-brand-400 font-mono truncate">
                                            {`{${ph}}`}
                                        </span>
                                        <ArrowRight className="w-3 h-3 text-brand-100/20 flex-shrink-0" />
                                        <select
                                            value={mapping[ph] || ''}
                                            onChange={(e) => setMapping({ ...mapping, [ph]: e.target.value })}
                                            className={`flex-1 min-w-0 bg-brand-dark border rounded-md px-2 py-1.5 text-white outline-none focus:border-brand-500/50 transition-all ${mapping[ph] ? 'border-brand-500/30' : 'border-red-500/50'
                                                }`}
                                        >
                                            <option value="">Sütun seçin...</option>
                                            {columns.map(col => (
                                                <option key={col} value={col}>{col}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-brand-100/30 text-xs">HTML şablonunda placeholder bulunamadı</p>
                        )}
                    </div>
                </div>
            )}

            {/* Preview table (first 5 rows from main process) */}
            {previewRows.length > 0 && emailCol && (
                <div className="bg-brand-gray border border-brand-500/15 rounded-2xl overflow-hidden" style={{ animation: 'fadeIn 0.25s ease both' }}>
                    <div className="px-4 py-2 border-b border-brand-500/10 text-xs text-brand-100/50 font-medium">
                        Önizleme (ilk 5 satır)
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-brand-500/10">
                                    <th className="text-left px-3 py-2 text-brand-100/40 font-medium">#</th>
                                    {columns.slice(0, 6).map(col => (
                                        <th key={col} className={`text-left px-3 py-2 font-medium ${col === emailCol ? 'text-brand-400' : 'text-brand-100/40'}`}>
                                            {col}
                                        </th>
                                    ))}
                                    {columns.length > 6 && (
                                        <th className="text-left px-3 py-2 text-brand-100/30 font-medium">+{columns.length - 6}</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {previewRows.slice(0, 5).map((row, i) => (
                                    <tr key={i} className="border-b border-brand-500/5 hover:bg-brand-500/5">
                                        <td className="px-3 py-2 text-brand-100/30">{rangeFrom + i}</td>
                                        {columns.slice(0, 6).map(col => {
                                            let val = String(row[col] ?? '');
                                            if (col === emailCol) val = cleanEmail(val);
                                            return (
                                                <td key={col} className={`px-3 py-2 ${col === emailCol ? 'text-brand-400' : 'text-brand-100/70'} max-w-[200px] truncate`}>
                                                    {val}
                                                </td>
                                            );
                                        })}
                                        {columns.length > 6 && <td className="px-3 py-2 text-brand-100/20">...</td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {error && (
                <p className="text-red-400 text-sm bg-red-500/10 py-2 px-4 rounded-lg text-center" style={{ animation: 'fadeIn 0.2s ease both' }}>
                    {error}
                </p>
            )}

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
                    disabled={rowCount === 0 || !emailCol || validEmailCount === 0}
                    className={`flex-1 px-8 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-[0_4px_20px_rgba(22,163,74,0.2)] ${rowCount > 0 && emailCol && validEmailCount > 0
                        ? 'bg-brand-600 hover:bg-brand-500 text-white hover:shadow-[0_4px_25px_rgba(34,197,94,0.4)] active:scale-95'
                        : 'bg-brand-gray text-brand-100/30 cursor-not-allowed border border-brand-500/10'
                        }`}
                >
                    <span>Gönderime Geç ({validEmailCount} mail)</span>
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

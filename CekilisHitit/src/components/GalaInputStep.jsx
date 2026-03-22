import React, { useState, memo } from 'react';
import { ArrowRight, UploadCloud, Users, Gift, CheckCircle } from 'lucide-react';

function GalaInputStep({ data, setData, onNext }) {
    const [participants, setParticipants] = useState(data.gala.participants || []);
    const [prizes, setPrizes] = useState(data.gala.prizes || []);
    const [error, setError] = useState('');

    const handleFileUpload = async (type) => {
        try {
            if (!window.electronAPI?.readExcel) {
                setError('Excel okuma API\'si bulunamadı.');
                return;
            }
            const result = await window.electronAPI.readExcel();
            if (!result.success) {
                if (result.reason && result.reason !== 'cancelled') {
                    setError(result.reason);
                }
                return;
            }

            const json = result.data;

            if (type === 'participants') {
                if (json.length === 0) { setError('Katılımcı listesi boş!'); return; }
                setParticipants(json);
            } else {
                if (json.length === 0) { setError('Ödül listesi boş!'); return; }
                const formattedPrizes = json.map((p, idx) => ({
                    id: idx,
                    name: p['Ödül'] || p['Odul'] || p['Prize'] || Object.values(p)[0] || `Ödül ${idx + 1}`,
                    count: parseInt(p['Adet'] || p['Count'] || p['Kişi Sayısı'] || Object.values(p)[1]) || 1,
                }));
                setPrizes(formattedPrizes);
            }
            setError('');
        } catch (err) {
            console.error(err);
            setError(`${type === 'participants' ? 'Katılımcı' : 'Ödül'} dosyası okunurken hata oluştu.`);
        }
    };

    const handleNext = () => {
        if (participants.length === 0) {
            setError('Lütfen önce Katılımcılar listesini yükleyin.');
            return;
        }
        if (prizes.length === 0) {
            setError('Lütfen önce Ödüller listesini yükleyin.');
            return;
        }

        setData({
            ...data,
            gala: {
                ...data.gala,
                participants,
                prizes,
                currentPrizeIndex: 0,
                drawResults: {}
            }
        });
        onNext();
    };

    return (
        <div
            className="w-full flex flex-col items-center gap-6"
            style={{ animation: 'fadeIn 0.3s ease both' }}
        >
            <div className="text-center mb-6">
                <h2 className="text-3xl font-semibold mb-2 text-white">Listeleri Yükleyin</h2>
                <p className="text-brand-100/60 max-w-md mx-auto text-sm">Gala çekilişi için katılımcı listesini ve ödül listesini Excel (.xlsx) formatında yükleyin.</p>
            </div>

            <div className="w-full flex flex-col md:flex-row gap-6 max-w-2xl">
                {/* Participants Upload */}
                <div
                    onClick={() => handleFileUpload('participants')}
                    className={`flex-1 relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${participants.length > 0 ? 'border-brand-500 bg-brand-900/20' : 'border-brand-500/30 hover:border-brand-400 bg-brand-gray/50 hover:bg-brand-gray'}`}
                >
                    {participants.length > 0 ? (
                        <>
                            <CheckCircle className="w-12 h-12 text-brand-500 mb-3" />
                            <h3 className="text-xl font-bold text-white mb-1">Katılımcılar Hazır</h3>
                            <p className="text-brand-100/70 text-sm">{participants.length} kişi yüklendi</p>
                        </>
                    ) : (
                        <>
                            <div className="w-16 h-16 rounded-full bg-brand-900/50 flex items-center justify-center mb-3 text-brand-400">
                                <Users className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">Katılımcı Listesi</h3>
                            <p className="text-brand-100/60 text-xs mb-3">Sütunlar: İsim, Soyisim, Kurum vs.</p>
                            <span className="text-brand-400 text-sm font-medium flex items-center gap-1"><UploadCloud className="w-4 h-4" /> Yüklemek için tıklayın</span>
                        </>
                    )}
                </div>

                {/* Prizes Upload */}
                <div
                    onClick={() => handleFileUpload('prizes')}
                    className={`flex-1 relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${prizes.length > 0 ? 'border-brand-500 bg-brand-900/20' : 'border-brand-500/30 hover:border-brand-400 bg-brand-gray/50 hover:bg-brand-gray'}`}
                >
                    {prizes.length > 0 ? (
                        <>
                            <CheckCircle className="w-12 h-12 text-brand-500 mb-3" />
                            <h3 className="text-xl font-bold text-white mb-1">Ödüller Hazır</h3>
                            <p className="text-brand-100/70 text-sm">{prizes.length} farklı ödül kalemi</p>
                        </>
                    ) : (
                        <>
                            <div className="w-16 h-16 rounded-full bg-brand-900/50 flex items-center justify-center mb-3 text-brand-400">
                                <Gift className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">Ödül Listesi</h3>
                            <p className="text-brand-100/60 text-xs mb-3">Zorunlu Sütunlar: Ödül, Adet</p>
                            <span className="text-brand-400 text-sm font-medium flex items-center gap-1"><UploadCloud className="w-4 h-4" /> Yüklemek için tıklayın</span>
                        </>
                    )}
                </div>
            </div>

            {error && (
                <p style={{ animation: 'fadeIn 0.2s ease both' }} className="text-red-400 text-sm max-w-md text-center bg-red-500/10 py-2 px-4 rounded-lg">
                    {error}
                </p>
            )}

            <button
                onClick={handleNext}
                disabled={participants.length === 0 || prizes.length === 0}
                className={`mt-4 w-full max-w-md px-8 py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-[0_4px_20px_rgba(22,163,74,0.2)] ${participants.length > 0 && prizes.length > 0
                    ? 'bg-brand-600 hover:bg-brand-500 text-white hover:shadow-[0_4px_25px_rgba(34,197,94,0.4)] active:scale-95'
                    : 'bg-brand-gray text-brand-100/30 cursor-not-allowed border border-brand-500/10'
                    }`}
            >
                <span>Sıralamayı Gör ve Başlat</span>
                <ArrowRight className="w-5 h-5" />
            </button>
        </div>
    );
}

export default memo(GalaInputStep);

import React, { memo } from 'react';
import { Download, Home, Trophy } from 'lucide-react';

function GalaFinalStep({ data, onReset }) {
    const { prizes, drawResults } = data.gala;

    const handleExport = async () => {
        const exportData = [];

        prizes.forEach(prize => {
            const winners = drawResults[prize.id] || [];
            winners.forEach(winner => {
                exportData.push({
                    'Kazanılan Ödül': prize.name,
                    ...winner
                });
            });
        });

        if (exportData.length === 0) {
            alert('Dışa aktarılacak kazanan bulunamadı.');
            return;
        }

        // XLSX artık main process'te — renderer bundle'ından kaldırıldı
        if (window.electronAPI?.exportExcel) {
            await window.electronAPI.exportExcel({
                data: exportData,
                fileName: 'gala_kazananlar_listesi.xlsx'
            });
        }
    };

    return (
        <div
            className="w-full flex flex-col items-center justify-center min-h-[50vh]"
            style={{ animation: 'fadeIn 0.3s ease both' }}
        >
            <div className="text-center mb-12">
                <div
                    className="w-24 h-24 rounded-full bg-brand-500/10 flex items-center justify-center mx-auto mb-6"
                    style={{ animation: 'scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both' }}
                >
                    <Trophy className="w-12 h-12 text-brand-500" />
                </div>
                <h2 className="text-4xl font-bold text-white mb-4">Mükemmel Bir Gece!</h2>
                <p className="text-brand-100/60 max-w-lg mx-auto">
                    Planlanan tüm çekilişleri başarıyla tamamladınız. Aşağıdaki butonu kullanarak tüm kazananların listesini detaylı bir şekilde Excel olarak indirebilirsiniz.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={handleExport}
                    className="px-8 py-4 bg-brand-500 hover:bg-brand-400 text-brand-900 rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-[0_4px_25px_rgba(34,197,94,0.4)] hover:scale-105 transition-all active:scale-95"
                >
                    <Download className="w-6 h-6" />
                    <span>Excel Listesini İndir</span>
                </button>

                <button
                    onClick={onReset}
                    className="px-8 py-4 bg-brand-gray hover:bg-brand-900 border border-brand-500/20 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors hover:scale-105 active:scale-95"
                >
                    <Home className="w-5 h-5" />
                    <span>Ana Menüye Dön</span>
                </button>
            </div>
        </div>
    );
}

export default memo(GalaFinalStep);

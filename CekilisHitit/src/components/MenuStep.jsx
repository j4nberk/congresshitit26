import React from 'react';
import { Download, Dices, Ticket } from 'lucide-react';

export default function MenuStep({ onSelectMode }) {
    return (
        <div
            className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl mx-auto min-h-screen"
            style={{ WebkitAppRegion: 'no-drag', animation: 'fadeIn 0.3s ease both' }}
        >
            <h1
                className="text-6xl md:text-8xl font-bold tracking-tighter bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent mb-16"
            >
                Cekilis<span className="text-white">Hitit</span>
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl px-4">
                {/* Yorumları Çek */}
                <button
                    onClick={() => onSelectMode('ig-scrape')}
                    className="flex flex-col items-center justify-center gap-4 bg-brand-gray border border-brand-500/20 p-8 rounded-3xl hover:border-brand-500/50 hover:bg-brand-900/50 transition-all duration-200 group shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_30px_rgba(34,197,94,0.2)] hover:scale-105 active:scale-95"
                >
                    <div className="w-16 h-16 rounded-2xl bg-brand-900 border border-brand-500/30 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                        <Download className="w-8 h-8 text-brand-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Yorumları Çek</h2>
                    <p className="text-brand-100/60 text-center text-xs">Instagram gönderisindeki yorumları çekip JSON olarak kaydedin.</p>
                </button>

                {/* Çekiliş Yap */}
                <button
                    onClick={() => onSelectMode('ig-draw')}
                    className="flex flex-col items-center justify-center gap-4 bg-brand-gray border border-brand-500/20 p-8 rounded-3xl hover:border-brand-500/50 hover:bg-brand-900/50 transition-all duration-200 group shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_30px_rgba(34,197,94,0.2)] hover:scale-105 active:scale-95"
                >
                    <div className="w-16 h-16 rounded-2xl bg-brand-900 border border-brand-500/30 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                        <Dices className="w-8 h-8 text-brand-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Çekiliş Yap</h2>
                    <p className="text-brand-100/60 text-center text-xs">Kayıtlı yorum dosyasından çekiliş yapın.</p>
                </button>

                {/* Gala Günü */}
                <button
                    onClick={() => onSelectMode('gala')}
                    className="flex flex-col items-center justify-center gap-4 bg-brand-gray border border-brand-500/20 p-8 rounded-3xl hover:border-brand-500/50 hover:bg-brand-900/50 transition-all duration-200 group shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_30px_rgba(34,197,94,0.2)] hover:scale-105 active:scale-95"
                >
                    <div className="w-16 h-16 rounded-2xl bg-brand-900 border border-brand-500/30 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                        <Ticket className="w-8 h-8 text-brand-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Gala Günü</h2>
                    <p className="text-brand-100/60 text-center text-xs">Excel listesi üzerinden çoklu hediye ve sahnede canlı heyecan.</p>
                </button>
            </div>

            <img
                src="./congress-logo.png"
                alt="Congress HITU 2026"
                className="w-24 h-24 rounded-full mt-12 opacity-60"
                style={{ animation: 'fadeIn 0.3s ease both', animationDelay: '0.3s' }}
            />
        </div>
    );
}

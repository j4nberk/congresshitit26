import React, { useState, memo } from 'react';
import { ArrowLeft, ArrowRight, Users, Plus, X, Trophy, Trash2 } from 'lucide-react';

function SettingsStep({ data, setData, onNext, onPrev }) {
    const [s, setS] = useState(data.settings);
    const [rounds, setRounds] = useState(data.rounds || [
        { name: '1. Ödül', winnerCount: 1, backupCount: 1 }
    ]);
    const [newFollow, setNewFollow] = useState('');

    const update = (key, val) => setS({ ...s, [key]: val });

    const addFollow = () => {
        if (newFollow.trim() && s.mustFollow.length < 3) {
            update('mustFollow', [...s.mustFollow, newFollow.trim().replace('@', '')]);
            setNewFollow('');
        }
    };

    const removeFollow = (username) => {
        update('mustFollow', s.mustFollow.filter((f) => f !== username));
    };

    const addRound = () => {
        setRounds([...rounds, { name: `${rounds.length + 1}. Ödül`, winnerCount: 1, backupCount: 1 }]);
    };

    const removeRound = (idx) => {
        if (rounds.length <= 1) return;
        setRounds(rounds.filter((_, i) => i !== idx));
    };

    const updateRound = (idx, key, val) => {
        const updated = [...rounds];
        updated[idx] = { ...updated[idx], [key]: val };
        setRounds(updated);
    };

    const handleNext = () => {
        setData({
            ...data,
            settings: s,
            rounds: rounds,
            currentRound: 0,
            allRoundResults: [],
            previousWinners: [],
            drawRound: 1,
        });
        onNext();
    };

    const totalWinners = rounds.reduce((sum, r) => sum + r.winnerCount, 0);
    const totalBackups = rounds.reduce((sum, r) => sum + r.backupCount, 0);

    return (
        <div
            className="w-full max-w-lg"
            style={{ animation: 'fadeIn 0.3s ease both' }}
        >
            <div className="text-center mb-8">
                <h2 className="text-3xl font-semibold mb-2 text-white">Çekiliş Kuralları</h2>
                <p className="text-brand-100/60">Turları ve kuralları belirleyin.</p>
            </div>

            <div className="space-y-4">
                {/* Rounds Definition */}
                <div className="bg-brand-gray p-5 rounded-2xl border border-brand-500/20 shadow-lg">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-brand-400" />
                        Ödül Turları
                    </h3>
                    <p className="text-brand-100/40 text-xs mb-4">
                        Her tur için ödül adı, kazanan ve yedek sayısını belirleyin.
                    </p>

                    <div className="space-y-3">
                        {rounds.map((round, idx) => (
                            <div key={idx} className="bg-brand-black/50 rounded-xl p-3 border border-white/5">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-brand-400 text-xs font-bold w-6">#{idx + 1}</span>
                                    <input
                                        type="text"
                                        value={round.name}
                                        onChange={(e) => updateRound(idx, 'name', e.target.value)}
                                        placeholder="Ödül adı"
                                        className="flex-1 bg-transparent border-b border-brand-500/20 text-white text-sm py-1 px-1 focus:border-brand-400 focus:outline-none"
                                    />
                                    {rounds.length > 1 && (
                                        <button
                                            onClick={() => removeRound(idx)}
                                            className="text-brand-100/30 hover:text-red-400 transition-colors p-1"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[10px] text-brand-100/40 mb-1">Kazanan</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={round.winnerCount}
                                            onChange={(e) => updateRound(idx, 'winnerCount', Math.max(1, parseInt(e.target.value) || 1))}
                                            className="w-full bg-brand-black border border-brand-500/20 rounded-lg p-2 text-white text-sm focus:border-brand-400 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-brand-100/40 mb-1">Yedek</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={round.backupCount}
                                            onChange={(e) => updateRound(idx, 'backupCount', Math.max(0, parseInt(e.target.value) || 0))}
                                            className="w-full bg-brand-black border border-brand-500/20 rounded-lg p-2 text-white text-sm focus:border-brand-400 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={addRound}
                        className="mt-3 w-full py-2 border border-dashed border-brand-500/30 rounded-xl text-brand-400 text-sm font-medium hover:bg-brand-500/5 hover:border-brand-500/50 transition-all flex items-center justify-center gap-1"
                    >
                        <Plus className="w-4 h-4" /> Tur Ekle
                    </button>

                    <div className="mt-3 text-xs text-brand-100/40 text-center">
                        Toplam: {rounds.length} tur, {totalWinners} kazanan, {totalBackups} yedek
                    </div>
                </div>

                {/* General Settings */}
                <div className="bg-brand-gray p-5 rounded-2xl border border-brand-500/20 shadow-lg space-y-5">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-brand-400" />
                        Genel Kurallar
                    </h3>

                    {/* Çoklu Yorum */}
                    <div className="flex items-center justify-between p-3 bg-brand-black rounded-xl border border-white/5">
                        <div>
                            <div className="font-medium text-white text-sm">Birden Fazla Yorum</div>
                            <div className="text-xs text-brand-100/50">Aynı kişinin yorumları şansını artırsın mı?</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={s.allowMultiple} onChange={(e) => update('allowMultiple', e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                        </label>
                    </div>

                    {/* Takip Şartı */}
                    <div>
                        <label className="block text-xs font-medium text-brand-100/80 mb-2">
                            Takip Etmesi Gereken Hesaplar (Maks: 3)
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-2.5 text-brand-100/30 text-sm">@</span>
                                <input
                                    type="text"
                                    value={newFollow}
                                    onChange={(e) => setNewFollow(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addFollow()}
                                    disabled={s.mustFollow.length >= 3}
                                    placeholder="kullanici_adi"
                                    className="w-full bg-brand-black border border-brand-500/20 rounded-lg py-2.5 pl-8 pr-3 text-white text-sm focus:border-brand-400 focus:outline-none disabled:opacity-50"
                                />
                            </div>
                            <button onClick={addFollow} disabled={s.mustFollow.length >= 3} className="px-3 bg-brand-600/20 text-brand-400 border border-brand-500/30 rounded-lg hover:bg-brand-500/20 transition-colors disabled:opacity-50">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                        {s.mustFollow.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {s.mustFollow.map((username) => (
                                    <div key={username} className="flex items-center gap-1 bg-brand-900 text-brand-100 px-2 py-1 rounded-md text-xs border border-brand-500/30">
                                        <span>@{username}</span>
                                        <button onClick={() => removeFollow(username)} className="text-brand-400 hover:text-white"><X className="w-3 h-3" /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Minimum Etiket Sayısı */}
                    <div>
                        <label className="block text-xs font-medium text-brand-100/80 mb-2">
                            Yorumda Minimum Etiket Sayısı
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                min="0"
                                max="10"
                                value={s.minTagCount || 0}
                                onChange={(e) => update('minTagCount', Math.max(0, Math.min(10, parseInt(e.target.value) || 0)))}
                                className="w-20 bg-brand-black border border-brand-500/20 rounded-lg p-2.5 text-white text-sm focus:border-brand-400 focus:outline-none"
                            />
                            <span className="text-xs text-brand-100/50">
                                {(s.minTagCount || 0) > 0
                                    ? `En az ${s.minTagCount} etiket (@)`
                                    : 'Etiket kontrolü yok'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 mt-6">
                <button onClick={onPrev} className="px-6 py-4 bg-transparent border border-brand-500/30 text-brand-100 hover:bg-white/5 rounded-xl font-medium transition-colors flex-1 flex justify-center items-center gap-2">
                    <ArrowLeft className="w-5 h-5" /> Geri
                </button>
                <button onClick={handleNext} className="px-6 py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-medium transition-transform active:scale-95 shadow-[0_4px_20px_rgba(22,163,74,0.3)] flex-[2] flex justify-center items-center gap-2">
                    Çekilişi Başlat <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

export default memo(SettingsStep);


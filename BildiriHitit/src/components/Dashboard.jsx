import React, { useState, useEffect, useMemo } from 'react';
import { Users, GraduationCap, FileCheck2, Send, Activity, BarChart3, Clock, ArrowRight } from 'lucide-react';

export default function Dashboard({ setCurrentStep }) {
    const [teachers, setTeachers] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();
        let isMounted = true;

        if (window.electronAPI) {
            Promise.all([
                window.electronAPI.loadData('teachers'),
                window.electronAPI.loadData('students')
            ]).then(([teachersData, studentsData]) => {
                if (isMounted) {
                    setTeachers(teachersData || []);
                    setStudents(studentsData || []);
                    setLoading(false);
                }
            }).catch(err => {
                if (isMounted && err.name !== 'AbortError') {
                    console.error('Data load error:', err);
                    setLoading(false);
                }
            });
        }
        
        return () => {
            isMounted = false;
            controller.abort();
        };
    }, []);

    const stats = useMemo(() => {
        const totalCapacity = teachers.reduce((acc, t) => acc + t.maxPapers, 0);
        // Ortak yazarlar bildiri sayısına dahil edilmiyor
        const mainStudents = students.filter(s => !s.isCoAuthor);
        const scored = mainStudents.filter(s => s.score !== null && s.score !== '');
        const totalScore = scored.reduce((acc, s) => acc + parseFloat(s.score), 0);
        const avg = scored.length > 0 ? (totalScore / scored.length).toFixed(1) : 0;

        return {
            totalTeachers: teachers.length,
            totalCapacity,
            totalStudents: mainStudents.length,
            scoredStudents: scored.length,
            averageScore: avg,
        };
    }, [teachers, students]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-brand-400">
                <Activity className="w-8 h-8 animate-pulse mb-4" />
                <div className="text-sm font-medium animate-pulse">İstatistikler Yükleniyor...</div>
            </div>
        );
    }

    const cards = [
        {
            title: 'Toplam Hoca',
            value: stats.totalTeachers,
            subtitle: `Toplam ${stats.totalCapacity} Bildiri Kapasitesi`,
            icon: Users,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20'
        },
        {
            title: 'Kayıtlı Bildiri',
            value: stats.totalStudents,
            subtitle: 'Sisteme eklenen toplam öğrenci',
            icon: GraduationCap,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
            border: 'border-purple-500/20'
        },
        {
            title: 'Puanlanan',
            value: stats.scoredStudents,
            subtitle: `%${stats.totalStudents > 0 ? Math.round((stats.scoredStudents / stats.totalStudents) * 100) : 0} Tamamlanma Oranı`,
            icon: FileCheck2,
            color: 'text-green-400',
            bg: 'bg-green-500/10',
            border: 'border-green-500/20'
        },
        {
            title: 'Ortalama Puan',
            value: stats.averageScore,
            subtitle: 'Puanlanan bildirilerin ortalaması',
            icon: BarChart3,
            color: 'text-yellow-400',
            bg: 'bg-yellow-500/10',
            border: 'border-yellow-500/20'
        }
    ];

    const quickActions = [
        { id: 'teachers', label: 'Hoca Ekle', desc: 'Sisteme yeni jüri/hoca tanımlayın ve kota belirleyin.', icon: Users },
        { id: 'students', label: 'Bildiri Ekle', desc: 'Yeni öğrenci kaydedin ve sistem hocayı otomatik atasın.', icon: GraduationCap },
        { id: 'scoring', label: 'Puan Gir', desc: 'Bildirilerin puanlarını girin ve ortak yazarlara otomatik yansıtın.', icon: FileCheck2 },
        { id: 'sending', label: 'Mailleri Gönder', desc: 'Kabul/Ret barajını belirleyip sonuçları mail ile iletin.', icon: Send },
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-2 pb-8">
            {/* Header / Hero */}
            <div className="bg-gradient-to-br from-brand-900/40 to-black/20 border border-brand-800/50 rounded-2xl p-5 sm:p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none transform group-hover:scale-110">
                    <Activity className="w-48 h-48 sm:w-64 sm:h-64 text-brand-400" />
                </div>
                <div className="relative z-10">
                    <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
                        BildiriHitit'e Hoş Geldiniz
                    </h1>
                    <p className="text-brand-100/60 max-w-2xl text-sm sm:text-base leading-relaxed">
                        Kongre bildiri yönetim, hoca atama ve sonuç gönderim sistemi. İşlemlerinize başlamak için aşağıdaki hızlı erişim menülerini kullanabilir veya sol menüdeki sekmelerle ilerleyebilirsiniz.
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <div 
                            key={i} 
                            className={`${card.bg} border ${card.border} p-6 rounded-2xl flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300 shadow-sm`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl bg-black/20 ${card.color}`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-white tracking-tight mb-1">{card.value}</h3>
                                <div className="text-sm font-medium text-white/90 mb-1">{card.title}</div>
                                <div className="text-xs text-white/50">{card.subtitle}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-xl font-semibold mb-5 text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-brand-400" />
                    Hızlı İşlemler
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickActions.map((action, i) => {
                        const Icon = action.icon;
                        return (
                            <button
                                key={i}
                                onClick={() => setCurrentStep(action.id)}
                                className="group bg-brand-900/10 border border-brand-800/60 p-5 rounded-2xl flex flex-col items-start hover:bg-brand-900/40 hover:border-brand-500/40 hover:shadow-lg hover:shadow-brand-500/5 transition-all outline-none text-left"
                            >
                                <div className="p-3 rounded-xl bg-black/40 text-brand-400 group-hover:bg-brand-500/20 group-hover:text-brand-300 transition-colors mb-4 border border-brand-800/50 group-hover:border-brand-500/30">
                                    <Icon className="w-5 h-5" />
                                </div>
                                <h3 className="text-white font-medium mb-1.5 group-hover:text-brand-300 transition-colors flex items-center gap-2 w-full justify-between">
                                    {action.label}
                                    <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-brand-400" />
                                </h3>
                                <p className="text-sm text-brand-100/50 leading-relaxed font-normal">
                                    {action.desc}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

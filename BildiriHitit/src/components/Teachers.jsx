import React, { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { Plus, Trash2, Users, Pencil, Check, X, Mail } from 'lucide-react'

const TeacherRow = memo(({ teacher, onDelete, onEdit }) => {
    const [isEditing, setIsEditing] = useState(false)
    const [editName, setEditName] = useState(teacher.name)
    const [editEmail, setEditEmail] = useState(teacher.email || '')
    const [editMax, setEditMax] = useState(teacher.maxPapers)
    const [editCanReview, setEditCanReview] = useState(teacher.canReview !== false)
    const isFull = teacher.assignedPapersCount >= teacher.maxPapers

    const handleSave = () => {
        if (!editName.trim()) return
        onEdit(teacher.id, {
            name: editName.trim(),
            email: editEmail.trim(),
            maxPapers: editCanReview ? (parseInt(editMax, 10) || 0) : 0,
            canReview: editCanReview
        })
        setIsEditing(false)
    }

    const handleCancel = () => {
        setEditName(teacher.name)
        setEditEmail(teacher.email || '')
        setEditMax(teacher.maxPapers)
        setEditCanReview(teacher.canReview !== false)
        setIsEditing(false)
    }

    if (isEditing) {
        return (
            <tr className="bg-brand-900/30">
                <td className="px-6 py-2">
                    <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="w-full bg-black/40 border border-brand-800 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
                    />
                </td>
                <td className="px-6 py-2">
                    <input
                        type="email"
                        value={editEmail}
                        onChange={e => setEditEmail(e.target.value)}
                        placeholder="ornek@mail.com"
                        className="w-full bg-black/40 border border-brand-800 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
                    />
                </td>
                <td className="px-6 py-2 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${isFull ? 'bg-red-500/20 text-red-400' : 'bg-brand-500/20 text-brand-300'}`}>
                        {teacher.assignedPapersCount}
                    </span>
                </td>
                <td className="px-6 py-2">
                    <input
                        type="number"
                        min="1"
                        value={editCanReview ? editMax : 0}
                        onChange={e => setEditMax(e.target.value)}
                        disabled={!editCanReview}
                        className="w-20 bg-black/40 border border-brand-800 rounded-lg px-3 py-1.5 text-white text-sm text-center focus:outline-none focus:border-brand-500 transition-colors mx-auto block disabled:opacity-30 disabled:cursor-not-allowed"
                    />
                </td>
                <td className="px-6 py-2 text-center">
                    <input
                        type="checkbox"
                        checked={editCanReview}
                        onChange={e => setEditCanReview(e.target.checked)}
                        disabled={teacher.canReview === true}
                        className={`w-4 h-4 rounded appearance-none border border-brand-700 bg-brand-800 checked:bg-brand-500 checked:border-transparent transition-all mx-auto block ${teacher.canReview === true ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    />
                    {teacher.canReview === true && <div className="text-[9px] text-brand-100/30 mt-1">Hakemlik iptal edilemez</div>}
                </td>
                <td className="px-6 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                        <button
                            onClick={handleSave}
                            className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-md transition-colors"
                            title="Kaydet"
                        >
                            <Check className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleCancel}
                            className="p-1.5 text-brand-100/60 hover:text-white hover:bg-brand-800/50 rounded-md transition-colors"
                            title="İptal"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </td>
            </tr>
        )
    }

    return (
        <tr className="hover:bg-brand-800/20 transition-colors">
            <td className="px-6 py-3 font-medium text-white">{teacher.name}</td>
            <td className="px-6 py-3 text-brand-100/60">
                {teacher.email ? (
                    <span className="flex items-center gap-1.5 text-sm">
                        <Mail className="w-3.5 h-3.5 text-brand-400" />
                        {teacher.email}
                    </span>
                ) : (
                    <span className="text-brand-100/30 text-xs italic">Eklenmemiş</span>
                )}
            </td>
            <td className="px-6 py-3 text-center">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${isFull ? 'bg-red-500/20 text-red-400' : 'bg-brand-500/20 text-brand-300'}`}>
                    {teacher.assignedPapersCount}
                </span>
            </td>
            <td className="px-6 py-3 text-center text-brand-100/60">{teacher.maxPapers}</td>
            <td className="px-6 py-3 text-center">
                {teacher.canReview !== false ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 uppercase tracking-widest">Hakem</span>
                ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-800/50 text-brand-100/30 uppercase tracking-widest">Danışman</span>
                )}
            </td>
            <td className="px-6 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                    <button
                        onClick={() => setIsEditing(true)}
                        className="p-1.5 text-brand-400/60 hover:text-brand-400 hover:bg-brand-400/10 rounded-md transition-colors"
                        title="Düzenle"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(teacher.id)}
                        className="p-1.5 text-red-400/60 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                        title="Sil"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    )
})

export default function Teachers() {
    const [teachers, setTeachers] = useState([])
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [maxCount, setMaxCount] = useState('')
    const [canReview, setCanReview] = useState(true)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const controller = new AbortController()
        let isMounted = true

        if (window.electronAPI) {
            window.electronAPI.loadData('teachers').then(data => {
                if (isMounted) {
                    setTeachers(data || [])
                    setLoading(false)
                }
            }).catch(err => {
                if (isMounted && err.name !== 'AbortError') {
                    console.error('Data load error:', err)
                    setLoading(false)
                }
            })
        }
        
        return () => {
            isMounted = false
            controller.abort()
        }
    }, [])

    const saveTeachers = useCallback((newTeachers) => {
        setTeachers(newTeachers)
        if (window.electronAPI) {
            window.electronAPI.saveData('teachers', newTeachers)
        }
    }, [])

    const handleAdd = useCallback((e) => {
        e.preventDefault()

        const trimmedName = name.trim()
        const parsedMaxCount = parseInt(maxCount, 10)

        if (!trimmedName) {
            alert('Lütfen hoca adını girin.')
            return
        }

        if (canReview && (!Number.isFinite(parsedMaxCount) || parsedMaxCount <= 0)) {
            alert('Hakemlik yapabilecek hocalar için geçerli bir bildiri kotası girin.')
            return
        }

        const newTeacher = {
            id: Date.now().toString(),
            name: trimmedName,
            email: email.trim(),
            maxPapers: canReview ? parsedMaxCount : 0,
            canReview: canReview,
            assignedPapersCount: 0,
            currentAssignments: []
        }

        saveTeachers([...teachers, newTeacher])
        setName('')
        setEmail('')
        setMaxCount('')
        setCanReview(true)
    }, [name, email, maxCount, canReview, teachers, saveTeachers])

    const handleEdit = useCallback((id, updates) => {
        const updated = teachers.map(t =>
            t.id === id ? { ...t, ...updates } : t
        )
        saveTeachers(updated)
    }, [teachers, saveTeachers])

    const handleDelete = useCallback((id) => {
        if (confirm('Hocayı silmek istediğinize emin misiniz?')) {
            saveTeachers(teachers.filter(t => t.id !== id))
        }
    }, [teachers, saveTeachers])

    const totalAssigned = useMemo(() => teachers.reduce((acc, t) => acc + t.assignedPapersCount, 0), [teachers])
    const totalCapacity = useMemo(() => teachers.reduce((acc, t) => acc + t.maxPapers, 0), [teachers])

    const teachersTable = useMemo(() => (
        <div className="bg-brand-900/10 border border-brand-800 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[700px]">
                <thead>
                    <tr className="border-b border-brand-800/50 bg-black/20 text-brand-100/50">
                        <th className="px-6 py-3 font-medium">Hoca Adı Soyadı</th>
                        <th className="px-6 py-3 font-medium">E-Posta</th>
                        <th className="px-6 py-3 font-medium text-center">Atanan Bildiri</th>
                        <th className="px-6 py-3 font-medium text-center">Maks. Kota</th>
                        <th className="px-6 py-3 font-medium text-center">Rol</th>
                        <th className="px-6 py-3 font-medium text-right">İşlem</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-brand-800/50">
                    {teachers.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="px-6 py-8 text-center text-brand-100/40">
                                Henüz hoca eklenmemiş.
                            </td>
                        </tr>
                    ) : (
                        teachers.map(teacher => (
                            <TeacherRow
                                key={teacher.id}
                                teacher={teacher}
                                onDelete={handleDelete}
                                onEdit={handleEdit}
                            />
                        ))
                    )}
                </tbody>
            </table>
        </div>
    ), [teachers, handleDelete, handleEdit])

    if (loading) return <div>Yükleniyor...</div>

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-xl font-semibold flex items-center gap-2">
                <Users className="text-brand-400" />
                Hocalar ve Kotalar
            </h2>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-brand-900/30 border border-brand-800 p-4 rounded-xl">
                    <div className="text-sm text-brand-100/60 mb-1">Toplam Hoca</div>
                    <div className="text-3xl font-bold text-white">{teachers.length}</div>
                </div>
                <div className="bg-brand-900/30 border border-brand-800 p-4 rounded-xl">
                    <div className="text-sm text-brand-100/60 mb-1">Toplam Kota</div>
                    <div className="text-3xl font-bold text-green-400">{totalCapacity}</div>
                </div>
                <div className="bg-brand-900/30 border border-brand-800 p-4 rounded-xl">
                    <div className="text-sm text-brand-100/60 mb-1">Atanan Bildiriler</div>
                    <div className="text-3xl font-bold text-brand-400">{totalAssigned}</div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleAdd} className="bg-brand-900/20 border border-brand-800 p-5 rounded-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm text-brand-100/70 mb-1.5">Hoca Adı Soyadı</label>
                        <input
                            required
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Prof. Dr. Ahmet Yılmaz"
                            className="w-full bg-black/40 border border-brand-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-500 placeholder-white/20 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-brand-100/70 mb-1.5">E-Posta</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ornek@hitit.edu.tr"
                            className="w-full bg-black/40 border border-brand-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-500 placeholder-white/20 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-brand-100/70 mb-1.5">Maks. Bildiri Kotası</label>
                        <input
                            required={canReview}
                            type="number"
                            min="1"
                            value={canReview ? maxCount : '0'}
                            onChange={(e) => setMaxCount(e.target.value)}
                            disabled={!canReview}
                            placeholder={canReview ? 'Örn: 50' : 'Hakemlik Yok'}
                            className="w-full bg-black/40 border border-brand-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-500 placeholder-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5 h-[46px] justify-center ml-2 border-l border-brand-800/30 pl-4 pr-2">
                        <label className="flex items-center gap-2 cursor-pointer group select-none">
                            <div className="relative flex items-center justify-center w-5 h-5 rounded overflow-hidden border border-brand-700 bg-brand-black group-hover:border-brand-500 transition-colors">
                                <input 
                                    type="checkbox" 
                                    checked={canReview} 
                                    onChange={e => setCanReview(e.target.checked)} 
                                    className="peer sr-only" 
                                />
                                <div className="w-full h-full peer-checked:bg-brand-500 transition-colors flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                            <span className="text-sm font-medium text-brand-100/80 group-hover:text-white transition-colors">Hakemlik Yapabilir</span>
                        </label>
                    </div>
                    <button
                        type="submit"
                        className="h-[46px] bg-brand-600 hover:bg-brand-500 text-white px-6 rounded-lg font-medium transition-colors flex items-center gap-2 justify-center"
                    >
                        <Plus className="w-4 h-4" />
                        Ekle
                    </button>
                </div>
            </form>

            {/* List */}
            {teachersTable}
        </div>
    )
}

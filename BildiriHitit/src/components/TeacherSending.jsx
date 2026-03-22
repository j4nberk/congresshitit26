import React, { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { Send, AlertTriangle, CheckCircle, XCircle, Loader2, FileText, Upload, Users, User, AtSign, AtSign as MailIcon, ChevronDown, ChevronUp } from 'lucide-react'

const TeacherSendingRow = memo(({ 
    teacher, 
    isSelected, 
    isExpanded, 
    unsentCount, 
    assignedToThisTeacher, 
    isEligible, 
    sending, 
    onToggle, 
    onExpand, 
    onSendSpecific,
    onToggleSent
}) => {
    return (
        <React.Fragment>
            <tr className={`transition-colors duration-150 ${isSelected ? 'bg-brand-500/10' : 'hover:bg-brand-800/10'} ${!isEligible ? 'opacity-40' : ''}`}>
                <td className="px-4 py-3">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={onToggle}
                        disabled={!isEligible}
                        className="w-4 h-4 rounded appearance-none border border-brand-700 bg-brand-800 checked:bg-brand-500 checked:border-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
                    />
                </td>
                <td className="px-4 py-3 font-medium text-white">{teacher.name}</td>
                <td className="px-4 py-3 text-brand-100/60 text-sm">
                    {teacher.email ? teacher.email : <span className="text-red-400/70 italic text-xs">E-posta yok</span>}
                </td>
                <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${unsentCount > 0 ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
                            {unsentCount} Yeni
                        </span>
                        <span className="text-brand-100/30 text-[10px]">/ {assignedToThisTeacher.length}</span>
                    </div>
                </td>
                <td className="px-4 py-3 text-center">
                    <button
                        onClick={onSendSpecific}
                        disabled={!isEligible || sending || unsentCount === 0}
                        className="inline-flex items-center gap-1.5 text-[10px] bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 rounded-md transition-all font-bold disabled:opacity-20 disabled:cursor-not-allowed uppercase tracking-wider"
                    >
                        <Send className="w-3 h-3" /> Grubu Gönder
                    </button>
                </td>
                <td className="px-4 py-3 text-center">
                    <button
                        onClick={onExpand}
                        className={`p-1.5 rounded-lg transition-all ${isExpanded ? 'bg-brand-500 text-white' : 'bg-brand-800 text-brand-100/40 hover:text-white'}`}
                    >
                        <FileText className={`w-4 h-4 transition-transform ${isExpanded ? 'scale-110' : ''}`} />
                    </button>
                </td>
            </tr>
            {isExpanded && (
                <tr className="bg-black/40">
                    <td colSpan="6" className="px-8 py-4 border-l-2 border-brand-500">
                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-xs font-bold text-brand-400 uppercase tracking-widest">Atanan Bildiriler Detayı</h4>
                                <span className="text-[10px] text-brand-100/30 font-mono">Toplam {assignedToThisTeacher.length} bildiri</span>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {assignedToThisTeacher.map(paper => (
                                    <div key={paper.id} className="flex items-center justify-between p-3 bg-brand-900/20 border border-brand-800/50 rounded-lg group hover:border-brand-500/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="font-mono text-xs text-brand-400 font-bold bg-brand-400/10 px-2 py-1 rounded">
                                                {paper.paperNumber}
                                            </div>
                                            <div>
                                                <div className="text-sm text-white font-medium flex items-center gap-2">
                                                    {paper.name}
                                                    {paper.isSent && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                                                </div>
                                                <div className="text-[11px] text-brand-100/40 truncate max-w-md">{paper.paperTitle}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => onToggleSent(paper.id, !paper.isSent)}
                                                title={paper.isSent ? 'Gönderilmedi olarak işaretle' : 'Gönderildi olarak işaretle'}
                                                className={`inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[10px] font-bold transition-all border ${
                                                    paper.isSent
                                                        ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400'
                                                        : 'bg-brand-800/40 border-brand-700/30 text-brand-400/60 hover:bg-green-500/10 hover:border-green-500/20 hover:text-green-400'
                                                }`}
                                            >
                                                <CheckCircle className="w-3 h-3" />
                                                {paper.isSent ? 'Gönderildi' : 'İşaretle'}
                                            </button>
                                            <button
                                                onClick={() => onSendSpecific([paper.id])}
                                                disabled={sending}
                                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${paper.isSent ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                                            >
                                                <MailIcon className="w-3 h-3" />
                                                {paper.isSent ? 'Tekrar Gönder' : 'Şimdi Gönder'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </React.Fragment>
    )
})

export default function TeacherSending() {
    const [teachers, setTeachers] = useState([])
    const [students, setStudents] = useState([])
    const [settings, setSettings] = useState(null)
    const [loading, setLoading] = useState(true)

    const [scoringFormPath, setScoringFormPath] = useState('')
    const [scoringFormName, setScoringFormName] = useState('')

    const [sending, setSending] = useState(false)
    const [progress, setProgress] = useState(null)
    const [logs, setLogs] = useState([])

    const [selectedTeacherIds, setSelectedTeacherIds] = useState([])
    const [expandedTeacherIds, setExpandedTeacherIds] = useState([])

    const eligibleTeachers = useMemo(() => 
        teachers.filter(t => t.email && t.assignedPapersCount > 0 && t.canReview !== false)
    , [teachers])

    useEffect(() => {
        let isMounted = true
        const loadAllData = async () => {
            if (!window.electronAPI) return
            setLoading(true)
            try {
                const [tData, sData, stData] = await Promise.all([
                    window.electronAPI.loadData('teachers'),
                    window.electronAPI.loadData('students'),
                    window.electronAPI.loadSettings()
                ])
                if (isMounted) {
                    setTeachers(tData || [])
                    setStudents(sData || [])
                    setSettings(stData || null)
                    setScoringFormPath(stData?.teacherScoringForm?.path || '')
                    setScoringFormName(stData?.teacherScoringForm?.name || '')
                    setLoading(false)
                }
            } catch (err) {
                if (isMounted) {
                    console.error('Data load error:', err)
                    setLoading(false)
                }
            }
        }
        loadAllData()
        return () => { isMounted = false }
    }, [])

    const persistTeacherScoringForm = useCallback(async (nextPath, nextName) => {
        if (!window.electronAPI) return

        const teacherScoringForm = {
            path: nextPath || '',
            name: nextName || ''
        }

        setSettings(prev => ({
            ...(prev || {}),
            teacherScoringForm
        }))

        await window.electronAPI.saveSettings({ teacherScoringForm })
    }, [])

    // İki ayrı fonksiyon: students state'ini güncellemek ve kaydetmek
    const markStudentsAsSent = useCallback((paperIds) => {
        setStudents(prev => {
            const updated = prev.map(s =>
                paperIds.includes(s.id) ? { ...s, isSent: true } : s
            )
            window.electronAPI?.saveData('students', updated)
            return updated
        })
    }, [])

    const toggleStudentSent = useCallback((paperId, isSent) => {
        setStudents(prev => {
            const updated = prev.map(s =>
                s.id === paperId ? { ...s, isSent } : s
            )
            window.electronAPI?.saveData('students', updated)
            return updated
        })
    }, [])

    useEffect(() => {
        if (!window.electronAPI) return
        window.electronAPI.onMailProgress((data) => {
            setProgress(prev => ({ ...prev, ...data }))
            
            if (data.log) {
                setLogs(prev => [data.log, ...prev])
            }

            // Mail başarıyla gönderildiğinde isSent=true yap
            // paperIds hem data.paperIds hem data.log.paperIds olarak gelebilir
            const eventStatus = data.type === 'sent' ? 'sent' : data.log?.status
            if (eventStatus === 'sent') {
                const idsToMark =
                    (data.paperIds?.length ? data.paperIds : null) ??
                    (data.log?.paperIds?.length ? data.log.paperIds : null) ??
                    (data.studentId ? [data.studentId] : null) ??
                    (data.log?.studentId ? [data.log.studentId] : [])
                if (idsToMark.length > 0) markStudentsAsSent(idsToMark)
            }

            if (data.type === 'complete' || data.type === 'aborted') {
                setSending(false)
            }
        })
        return () => window.electronAPI.removeMailProgressListeners()
    }, [markStudentsAsSent])

    const handleSelectScoringForm = useCallback(async () => {
        if (!window.electronAPI) return
        const result = await window.electronAPI.openAttachment()
        if (result && result.success && result.attachments?.length > 0) {
            const first = result.attachments[0]
            setScoringFormPath(first.path)
            setScoringFormName(first.filename)
            await persistTeacherScoringForm(first.path, first.filename)
        }
    }, [persistTeacherScoringForm])

    const handleDismissScoringForm = useCallback(async () => {
        setScoringFormPath('')
        setScoringFormName('')
        await persistTeacherScoringForm('', '')
    }, [persistTeacherScoringForm])

    const handleToggleTeacher = useCallback((teacherId) => {
        setSelectedTeacherIds(prev =>
            prev.includes(teacherId)
                ? prev.filter(id => id !== teacherId)
                : [...prev, teacherId]
        )
    }, [])

    const handleSelectAll = useCallback(() => {
        const eligibleTeachers = teachers.filter(t => t.email && t.assignedPapersCount > 0)
        if (selectedTeacherIds.length === eligibleTeachers.length) {
            setSelectedTeacherIds([])
        } else {
            setSelectedTeacherIds(eligibleTeachers.map(t => t.id))
        }
    }, [teachers, selectedTeacherIds])

    const toggleExpandTeacher = useCallback((tid) => {
        setExpandedTeacherIds(prev => 
            prev.includes(tid) ? prev.filter(id => id !== tid) : [...prev, tid]
        )
    }, [])

    const getAssignedStudents = useCallback((teacherId) => {
        const teacher = teachers.find(t => t.id === teacherId)
        if (!teacher || !teacher.currentAssignments) return []
        // Return unique papers by number, but keep the full objects
        const rawList = students.filter(s =>
            teacher.currentAssignments.includes(s.id) ||
            s.assignedTeacherId === teacherId ||
            s.assignedTeacherName === teacher.name
        )
        
        const unique = []
        const seen = new Set()
        rawList.forEach(s => {
            if (!s.paperNumber || !seen.has(s.paperNumber)) {
                if (s.paperNumber) seen.add(s.paperNumber)
                unique.push(s)
            }
        })
        return unique
    }, [teachers, students])

    const buildJobForTeacher = useCallback((tid, specificPaperIds = null) => {
        const teacher = teachers.find(t => t.id === tid)
        if (!teacher || !teacher.email) return null

        let targetPapers = getAssignedStudents(tid)
        if (specificPaperIds) {
            targetPapers = targetPapers.filter(p => specificPaperIds.includes(p.id))
        }

        if (targetPapers.length === 0) return null

        const paperRows = targetPapers.map((s, i) =>
            `<tr style="border-bottom:1px solid #eee;">
                <td style="padding:8px;">${i + 1}</td>
                <td style="padding:8px;">${s.paperNumber || '-'}</td>
                <td style="padding:8px;">${s.name}</td>
                <td style="padding:8px;">${s.paperTitle || '-'}</td>
            </tr>`
        ).join('')

        const bildiriTablosu = `<table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e5e7eb;">
            <thead>
                <tr style="background:#10b981;color:white;">
                    <th style="padding:8px;text-align:left;">#</th>
                    <th style="padding:8px;text-align:left;">Bildiri No</th>
                    <th style="padding:8px;text-align:left;">Öğrenci</th>
                    <th style="padding:8px;text-align:left;">Başlık</th>
                </tr>
            </thead>
            <tbody>${paperRows}</tbody>
        </table>`

        const attachments = []
        if (scoringFormPath) {
            attachments.push({ filename: scoringFormName, path: scoringFormPath })
        }
        targetPapers.forEach(s => {
            if (s.paperFilePath) {
                const fname = s.paperFilePath.split(/[\\/]/).pop()
                attachments.push({ filename: fname, path: s.paperFilePath })
            }
        })

        const tmpl = settings?.templates?.teacherEval
        const defaultSubject = `Bildiri Değerlendirme Görevi - ${targetPapers.length} Bildiri`
        const defaultHtml = `<div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;">
            <h2 style="color:#10b981;">Bildiri Değerlendirme Görevi</h2>
            <p>Sayın <strong>${teacher.name}</strong>,</p>
            <p>Aşağıdaki bildiriler değerlendirmeniz için tarafınıza atanmıştır. Bildiri dosyaları ek olarak gönderilmiştir.</p>
            ${bildiriTablosu}
            ${scoringFormPath ? '<p>Ekte ayrıca bildiri puanlama formu da bulunmaktadır.</p>' : ''}
            <p style="color:#6b7280;font-size:13px;margin-top:24px;">Bu mail BildiriHitit sistemi tarafından otomatik gönderilmiştir.</p>
        </div>`

        const replaceVars = (str) => str
            .replace(/\{hoca_adi\}/g, teacher.name)
            .replace(/\{bildiri_tablosu\}/g, bildiriTablosu)
            .replace(/\{bildiri_sayisi\}/g, String(targetPapers.length))

        const subject = tmpl?.subject ? replaceVars(tmpl.subject) : defaultSubject
        const html = tmpl?.htmlContent ? replaceVars(tmpl.htmlContent) : defaultHtml

        return {
            studentId: tid, // Using tid as primary job identifier
            to: teacher.email,
            subject,
            html,
            attachments,
            isAccepted: true,
            paperIds: targetPapers.map(p => p.id) 
        }
    }, [teachers, getAssignedStudents, settings, scoringFormPath, scoringFormName])

    const handleSendTeacherSpecific = useCallback(async (teacherId, paperIds = null) => {
        if (!window.electronAPI || sending) return
        if (!settings?.config?.smtpHost) {
            alert('SMTP ayarları eksik. Lütfen Ayarlar sekmesinden yapılandırın.')
            return
        }

        const teacher = teachers.find(t => t.id === teacherId)
        const finalPaperIds = paperIds || getAssignedStudents(teacherId).filter(p => !p.isSent).map(p => p.id)

        if (finalPaperIds.length === 0) {
            alert('Gönderilecek yeni bildiri bulunamadı.')
            return
        }

        const job = buildJobForTeacher(teacherId, finalPaperIds)
        if (!job) {
            alert('Bu hoca için gönderilebilecek mail oluşturulamadı.')
            return
        }

        if (!confirm(`${teacher.name} adlı hocaya ${finalPaperIds.length} bildiri için mail gönderilsin mi?`)) return

        setSending(true)
        setLogs([])
        setProgress({ type: 'start', total: 1, index: 0 })

        await window.electronAPI.sendBulkEmails({
            config: settings.config,
            rateLimit: settings.rateLimit,
            jobs: [job]
        })
    }, [teachers, settings, sending, buildJobForTeacher, getAssignedStudents])

    const handleSendBulk = useCallback(async () => {
        if (!window.electronAPI || sending || selectedTeacherIds.length === 0) return

        if (!settings?.config?.smtpHost) {
            alert('SMTP ayarları eksik. Lütfen Ayarlar sekmesinden yapılandırın.')
            return
        }

        const jobs = selectedTeacherIds.map(tid => {
            const unsentPaperIds = getAssignedStudents(tid).filter(p => !p.isSent).map(p => p.id)
            if (unsentPaperIds.length === 0) return null
            return buildJobForTeacher(tid, unsentPaperIds)
        }).filter(Boolean)

        if (jobs.length === 0) {
            alert('Seçilen hocalar için gönderilmemiş yeni bildiri bulunamadı.')
            return
        }

        if (!confirm(`${jobs.length} hocaya toplamda yeni bildiriler için mail gönderilecek. Onaylıyor musunuz?`)) return

        setSending(true)
        setLogs([])
        setProgress({ type: 'start', total: jobs.length, index: 0 })

        await window.electronAPI.sendBulkEmails({
            config: settings.config,
            rateLimit: settings.rateLimit,
            jobs
        })
    }, [selectedTeacherIds, settings, sending, buildJobForTeacher, getAssignedStudents])

    const handleStopSending = useCallback(async () => {
        if (!window.electronAPI) return
        await window.electronAPI.stopSending()
    }, [])

    if (loading) return (
		<div className="flex flex-col items-center justify-center py-20 text-brand-100/50">
			<Loader2 className="w-8 h-8 animate-spin mb-3 text-brand-500" />
			<p>Hoca verileri yükleniyor...</p>
		</div>
	)

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300 overflow-hidden">
            <h2 className="text-xl font-semibold flex items-center gap-2 flex-shrink-0">
                <AtSign className="text-brand-400" />
                Hoca Bilgilendirme Gönderimi
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-brand-900/10 border border-brand-800 p-6 rounded-xl flex-shrink-0">
                <div>
                    <h3 className="font-medium text-lg mb-2 flex items-center gap-2 text-white">
                        <Upload className="w-5 h-5 text-brand-400" />
                        Puanlama Formu (Opsiyonel)
                    </h3>
                    <p className="text-sm text-brand-100/50 mb-4">
                        Maillere eklemek istediğiniz boş bir "Puanlama Formu" (Word/PDF) varsa buradan seçebilirsiniz.
                    </p>
                    
                    <div className="flex items-center gap-3">
                        <div className="flex-1 bg-black/40 border border-brand-800 px-4 py-2.5 rounded-lg flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-brand-500/60" />
                            <span className="text-sm text-brand-100/60 truncate">
                                {scoringFormName || 'Form seçilmedi'}
                            </span>
                        </div>
                        <button
                            onClick={handleSelectScoringForm}
                            className="bg-brand-800 hover:bg-brand-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-brand-700 whitespace-nowrap"
                        >
                            Dosya Seç
                        </button>
                        <button
                            onClick={handleDismissScoringForm}
                            disabled={!scoringFormPath}
                            className="bg-transparent hover:bg-red-500/10 text-red-400 disabled:text-brand-100/20 disabled:hover:bg-transparent px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-red-500/20 disabled:border-brand-800 whitespace-nowrap"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>

                <div className="bg-black/20 border border-brand-800/50 p-4 rounded-lg flex flex-col justify-center gap-3">
                    <div className="flex justify-between text-sm items-center">
                        <span className="text-brand-100/60">Gönderime Uygun Hoca:</span>
                        <div className="flex items-center gap-2">
                             <Users className="w-4 h-4 text-brand-400" />
                             <span className="font-bold text-white text-lg">{eligibleTeachers.length}</span>
                        </div>
                    </div>
                    <div className="flex justify-between text-sm border-t border-brand-800/30 pt-2 items-center">
                        <span className="text-brand-100/60">Seçili Hoca:</span>
                        <span className="font-bold text-brand-400 text-lg">{selectedTeacherIds.length}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-black/40 border border-brand-800 rounded-xl overflow-hidden flex flex-col min-h-[280px] relative">
                <div className="flex-1 overflow-y-auto min-h-0">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-brand-900/50 text-brand-100/60 sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                            <tr>
                                <th className="px-4 py-3 font-medium w-10">
                                    <input
                                        type="checkbox"
                                        checked={eligibleTeachers.length > 0 && selectedTeacherIds.length === eligibleTeachers.length}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 rounded appearance-none border border-brand-700 bg-brand-800 checked:bg-brand-500 checked:border-transparent transition-all cursor-pointer"
                                    />
                                </th>
                                <th className="px-4 py-3 font-medium">Hoca</th>
                                <th className="px-4 py-3 font-medium">E-Posta</th>
                                <th className="px-4 py-3 font-medium text-center">Atanan Bildiri</th>
                                <th className="px-4 py-3 font-medium text-center">Bildiri Grubu Gönder</th>
                                <th className="px-4 py-3 font-medium text-center">Detay</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-800/50">
                            {teachers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-4 py-8 text-center text-brand-100/40">
                                        Henüz hoca eklenmemiş.
                                    </td>
                                </tr>
                            ) : (
                                teachers.filter(t => t.canReview !== false).map(teacher => {
                                    const assignedToThisTeacher = getAssignedStudents(teacher.id)
                                    const isEligible = Boolean(teacher.email) && assignedToThisTeacher.length > 0
                                    const unsentCount = assignedToThisTeacher.filter(p => !p.isSent).length

                                    return (
                                        <TeacherSendingRow 
                                            key={teacher.id}
                                            teacher={teacher}
                                            isSelected={selectedTeacherIds.includes(teacher.id)}
                                            isExpanded={expandedTeacherIds.includes(teacher.id)}
                                            unsentCount={unsentCount}
                                            assignedToThisTeacher={assignedToThisTeacher}
                                            isEligible={isEligible}
                                            sending={sending}
                                            onToggle={() => handleToggleTeacher(teacher.id)}
                                            onExpand={() => toggleExpandTeacher(teacher.id)}
                                            onSendSpecific={(paperIds) => handleSendTeacherSpecific(teacher.id, Array.isArray(paperIds) ? paperIds : null)}
                                            onToggleSent={(paperId, isSent) => toggleStudentSent(paperId, isSent)}
                                        />
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 bg-black/20 p-4 rounded-xl border border-brand-800/50 shrink-0">
                <div className="flex items-center gap-4">
                    {!sending ? (
                        <button
                            onClick={handleSendBulk}
                            disabled={selectedTeacherIds.length === 0}
                            className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 shadow-lg shadow-brand-900/20"
                        >
                            <Send className="w-4 h-4" />
                            {selectedTeacherIds.length > 0
                                ? `Seçili ${selectedTeacherIds.length} Hocaya Toplu Gönder`
                                : 'Toplu Gönderim İçin Hoca Seçin'
                            }
                        </button>
                    ) : (
                        <button
                            onClick={handleStopSending}
                            className="bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2"
                        >
                            <XCircle className="w-4 h-4" />
                            Gönderimi Durdur
                        </button>
                    )}

                    {progress && (
                        <div className="flex items-center gap-3 text-sm bg-black/40 px-4 py-2 rounded-lg border border-brand-800/50">
                            {sending && <Loader2 className="w-4 h-4 animate-spin text-brand-400" />}
                            <span className="text-brand-100 font-medium">
                                {progress.type === 'complete' ? 'İşlem Tamamlandı' :
                                 progress.type === 'aborted' ? 'İşlem Durduruldu' :
                                 `Gönderiliyor: ${progress.index || 0} / ${progress.total || 0}`
                                }
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {logs.length > 0 && (
                <div className="bg-black/40 border border-brand-800 rounded-xl p-5 shrink-0 flex-none">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-brand-100/40 uppercase tracking-widest flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5" />
                            Gönderim Günlüğü
                        </h4>
                        <span className="text-[10px] text-brand-100/30 font-mono">{logs.length} kayıt</span>
                    </div>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                        {logs.map((log, i) => (
                            <div key={i} className="flex items-center justify-between text-[11px] font-mono py-1 border-b border-brand-800/30 last:border-0">
                                <div className="flex items-center gap-3">
                                    <span className="text-brand-100/30 w-16 shrink-0">[{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}]</span>
                                    {log.status === 'sent' && <span className="text-green-400 font-medium whitespace-nowrap">✅ TAMAMLANDI:</span>}
                                    {log.status === 'failed' && <span className="text-red-400 font-medium whitespace-nowrap">❌ HATA:</span>}
                                    {log.status === 'skipped' && <span className="text-yellow-400 font-medium whitespace-nowrap">⚠️ ATLANDI:</span>}
                                    <span className="text-brand-100/70 truncate max-w-[300px]">{log.email}</span>
                                </div>
                                {log.error && <span className="text-red-400/80 italic truncate ml-4 max-w-[200px]">{log.error}</span>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

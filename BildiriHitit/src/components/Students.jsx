import React, { useState, useEffect, useCallback, memo, useMemo } from 'react'
import { UserPlus, Phone, Mail, FileText, Search, GraduationCap, Trash2, Download, FileSpreadsheet, Pencil, X, Save, AlertTriangle, ChevronDown, ChevronUp, Users } from 'lucide-react'
import * as XLSX from 'xlsx'

const StudentRow = memo(({ student, coAuthors, onOpenPath, onDelete, onEdit }) => {
	const [coAuthorsExpanded, setCoAuthorsExpanded] = useState(false)
	const hasCoAuthors = coAuthors && coAuthors.length > 0

	return (
		<>
			<tr className="hover:bg-brand-800/20 transition-colors">
				<td className="px-6 py-3 font-mono text-brand-400">
					{student.paperNumber}
				</td>
				<td className="px-6 py-3">
					<div className="font-medium text-white flex items-center gap-2">
						{student.name}
						{hasCoAuthors && (
							<button
								type="button"
								onClick={() => setCoAuthorsExpanded(v => !v)}
								className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-brand-700/50 hover:bg-brand-600/50 text-[10px] text-brand-300 uppercase tracking-wider transition-colors cursor-pointer border border-brand-700/40"
								title={coAuthorsExpanded ? 'Ortak yazarları gizle' : 'Ortak yazarları göster'}
							>
								<Users className="w-2.5 h-2.5" />
								{coAuthors.length} Ortak
								{coAuthorsExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
							</button>
						)}
					</div>
					<div className="text-xs text-brand-100/50">{student.term}</div>
				</td>
				<td className="px-6 py-3 max-w-xs truncate text-brand-100/80" title={student.paperTitle}>
					{student.paperTitle}
				</td>
				<td className="px-6 py-3 text-brand-100/70">
					{student.supervisorName || '-'}
				</td>
				<td className="px-6 py-3 text-center">
					{student.paperFilePath ? (
						<button 
							onClick={() => onOpenPath(student.paperFilePath)}
							className="text-xs bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap font-medium flex items-center gap-1 mx-auto"
							title={student.paperFilePath}
						>
							<FileText className="w-3 h-3"/> Word
						</button>
					) : (
						<span className="text-brand-100/30 text-xs">-</span>
					)}
				</td>
				<td className="px-6 py-3 text-brand-300">
					{student.assignedTeacherName}
				</td>
				<td className="px-6 py-3 text-center">
					{student.score !== null ? (
						<span className="px-2 py-1 rounded bg-green-500/20 text-green-400 font-bold">{student.score}</span>
					) : (
						<span className="text-brand-100/30">-</span>
					)}
				</td>
				<td className="px-6 py-3 text-right">
					<div className="flex items-center justify-end gap-1">
						<button
							onClick={() => onEdit(student)}
							className="p-1.5 text-brand-400/60 hover:text-brand-400 hover:bg-brand-400/10 rounded-md transition-all"
							title="Düzenle"
						>
							<Pencil className="w-4 h-4" />
						</button>
						<button
							onClick={() => onDelete(student.id)}
							className="p-1.5 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all"
							title="Sil"
						>
							<Trash2 className="w-4 h-4" />
						</button>
					</div>
				</td>
			</tr>
			{hasCoAuthors && coAuthorsExpanded && (
				<tr>
					<td colSpan="8" className="px-0 py-0">
						<div className="mx-6 mb-2 mt-0 border border-brand-700/30 rounded-lg bg-brand-900/30 overflow-hidden animate-in slide-in-from-top-1 duration-150">
							<div className="px-3 py-1.5 bg-brand-800/20 border-b border-brand-700/20 flex items-center gap-1.5">
								<Users className="w-3 h-3 text-brand-400" />
								<span className="text-[10px] uppercase tracking-wider text-brand-400 font-bold">Ortak Yazarlar</span>
							</div>
							{coAuthors.map((ca, idx) => (
								<div
									key={ca.id}
									className={`flex items-center justify-between px-4 py-2 text-sm ${
										idx < coAuthors.length - 1 ? 'border-b border-brand-700/20' : ''
									}`}
								>
									<div className="flex items-center gap-3">
										<span className="text-brand-500/60 text-xs font-bold">↳</span>
										<div>
											<span className="text-brand-100/90 font-medium">{ca.name}</span>
											{ca.term && <span className="ml-2 text-[10px] text-brand-100/40">{ca.term}</span>}
										</div>
										{ca.email && <span className="text-[11px] text-brand-100/40">{ca.email}</span>}
									</div>
									<div className="flex items-center gap-2">
										<button
											onClick={() => onEdit(ca)}
											className="p-1 text-brand-400/50 hover:text-brand-400 hover:bg-brand-400/10 rounded transition-all"
											title="Düzenle"
										>
											<Pencil className="w-3.5 h-3.5" />
										</button>
										<button
											onClick={() => onDelete(ca.id)}
											className="p-1 text-red-400/50 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
											title="Sil"
										>
											<Trash2 className="w-3.5 h-3.5" />
										</button>
									</div>
								</div>
							))}
						</div>
				</td>
				</tr>
			)}
		</>
	)
})

export default function Students() {
	const [students, setStudents] = useState([])
	const [teachers, setTeachers] = useState([])
	const [loading, setLoading] = useState(true)
	const [searchTerm, setSearchTerm] = useState('')

	// Form data state (Performance optimization: Grouped state)
	const [formData, setFormData] = useState({
		name: '',
		term: '',
		phone: '',
		email: '',
		paperTitle: '',
		paperAbstract: '',
		paperFilePath: '',
		supervisorId: ''
	})

	// Edit states
	const [isEditing, setIsEditing] = useState(false)
	const [editingId, setEditingId] = useState(null)

	const [isCoAuthorEntry, setIsCoAuthorEntry] = useState(false)
	const [selectedParentPaperId, setSelectedParentPaperId] = useState('')

	useEffect(() => {
		if (isCoAuthorEntry && !selectedParentPaperId && !isEditing) {
			const potentialParents = students.filter(s => !s.isCoAuthor)
			if (potentialParents.length > 0) {
				setSelectedParentPaperId(potentialParents[0].id)
			}
		}
	}, [isCoAuthorEntry, students, selectedParentPaperId, isEditing])

	useEffect(() => {
		let isMounted = true
		if (window.electronAPI) {
			Promise.all([
				window.electronAPI.loadData('students'),
				window.electronAPI.loadData('teachers')
			]).then(([sData, tData]) => {
				if (isMounted) {
					setStudents(sData || [])
					setTeachers(tData || [])
					setLoading(false)
				}
			}).catch(err => {
				if (isMounted) {
					console.error('Data load error:', err)
					setLoading(false)
				}
			})
		}
		return () => { isMounted = false }
	}, [])

	const saveState = useCallback((newStudents, newTeachers) => {
		setStudents(newStudents)
		setTeachers(newTeachers)
		if (window.electronAPI) {
			window.electronAPI.saveData('students', newStudents)
			window.electronAPI.saveData('teachers', newTeachers)
		}
	}, [])

	const resetForm = () => {
		setFormData({
			name: '',
			term: '',
			phone: '',
			email: '',
			paperTitle: '',
			paperAbstract: '',
			paperFilePath: '',
			supervisorId: ''
		})
		setIsCoAuthorEntry(false)
		setSelectedParentPaperId('')
		setIsEditing(false)
		setEditingId(null)
	}

	const handleInputChange = (e) => {
		const { name, value } = e.target
		setFormData(prev => ({ ...prev, [name]: value }))
	}

	const handleEditInitiate = useCallback((student) => {
		setIsEditing(true)
		setEditingId(student.id)
		setFormData({
			name: student.name,
			term: student.term,
			phone: student.phone,
			email: student.email,
			paperTitle: student.paperTitle,
			paperAbstract: student.paperAbstract || '',
			paperFilePath: student.paperFilePath || '',
			supervisorId: student.supervisorId || ''
		})
		setIsCoAuthorEntry(student.isCoAuthor || false)
		setSelectedParentPaperId(student.parentPaperId || '')
	}, [])

	const handleAdd = useCallback(async (e) => {
		e.preventDefault()
		const { name, term, phone, email, paperTitle, paperAbstract, paperFilePath, supervisorId } = formData
		
		if (!isEditing && !isCoAuthorEntry && !term) {
			alert('Lütfen bir dönem seçiniz!')
			return
		}
		
		if (isEditing) {
			const updatedStudents = students.map(s => {
				if (s.id === editingId) {
					const sv = teachers.find(t => t.id === supervisorId)
					return {
						...s,
						name: name.trim(),
						term,
						phone,
						email,
						paperTitle: paperTitle.trim(),
						paperAbstract,
						paperFilePath,
						supervisorId,
						supervisorName: sv ? sv.name : ''
					}
				}
				return s
			})
			saveState(updatedStudents, teachers)
			resetForm()
			alert('Kayıt başarıyla güncellendi.')
			return
		}

		if (isCoAuthorEntry) {
			const parentStudent = students.find(s => s.id === selectedParentPaperId)
			if (!parentStudent) {
				alert("Lütfen bir ana bildiri seçin!")
				return
			}
			
			const sv = teachers.find(t => t.id === parentStudent.supervisorId)
			const newStudent = {
				id: Date.now().toString(),
				name: name.trim(),
				term,
				phone,
				email,
				paperTitle: parentStudent.paperTitle,
				paperAbstract: parentStudent.paperAbstract,
				paperFilePath: parentStudent.paperFilePath,
				paperNumber: parentStudent.paperNumber,
				assignedTeacherId: parentStudent.assignedTeacherId,
				assignedTeacherName: parentStudent.assignedTeacherName,
				supervisorId: parentStudent.supervisorId || '',
				supervisorName: parentStudent.supervisorName || '',
				score: parentStudent.score,
				isSent: false,
				isCoAuthor: true,
				parentPaperId: parentStudent.id
			}
			
			const oldTitleBase = parentStudent.paperTitle.replace(/ \(Ortak Yazar:.*\)$/, '')
			const newStudents = [...students]
			let insertIndex = -1
			const coAuthors = []
			
			for (let i = 0; i < newStudents.length; i++) {
				if (newStudents[i].id === selectedParentPaperId) {
					insertIndex = i
				} else if (newStudents[i].parentPaperId === selectedParentPaperId) {
					insertIndex = i
					coAuthors.push(newStudents[i].name)
				}
			}
			
			coAuthors.push(newStudent.name)
			const updatedTitle = `${oldTitleBase} (Ortak Yazar: ${coAuthors.join(', ')})`
			
			newStudents.forEach(s => {
				if (s.id === selectedParentPaperId || s.parentPaperId === selectedParentPaperId) {
					s.paperTitle = updatedTitle
				}
			})
			newStudent.paperTitle = updatedTitle
			
			newStudents.splice(insertIndex + 1, 0, newStudent)
			saveState(newStudents, teachers)
			resetForm()
			alert(`Ortak yazar eklendi.`)
			return
		}
		
		// BOŞTA KALAN ID'Yİ BULMA MANTIĞI: Aradaki boşlukları doldurur
		const currentYear = new Date().getFullYear()
		const usedNums = new Set(
			students
				.filter(s => !s.isCoAuthor)
				.map(s => {
					const idPart = String(s.paperNumber).replace(String(currentYear), '')
					return parseInt(idPart, 10) || 0
				})
		)
		let nextNum = 1
		while (usedNums.has(nextNum)) {
			nextNum++
		}
		const paperNumber = `${currentYear}${String(nextNum).padStart(4, '0')}`

		// Hoca atama: supervisorId != assignedTeacherId olmalı VE hoca hakemlik yapabiliyor olmalı
		const availableTeachers = teachers.filter(t => 
			t.assignedPapersCount < t.maxPapers && 
			t.id !== supervisorId &&
			t.canReview !== false
		)
		
		if (availableTeachers.length === 0) {
			alert('Uyarı: Bildiri atanabilecek uygun hoca bulunamadı (Tüm hocalar dolu veya seçilen danışman hoca hariç hoca kalmadı)!')
			return
		}

		const minAssignedCount = Math.min(...availableTeachers.map(t => t.assignedPapersCount))
		const candidateTeachers = availableTeachers.filter(t => t.assignedPapersCount === minAssignedCount)
		const selectedTeacher = candidateTeachers[Math.floor(Math.random() * candidateTeachers.length)]

		let finalFilePath = paperFilePath
		if (paperFilePath && window.electronAPI?.copyDocx) {
			const res = await window.electronAPI.copyDocx({ 
				originalPath: paperFilePath, 
				studentName: name.trim(), 
				paperNumber 
			})
			if (res.success && res.filePath) {
				finalFilePath = res.filePath
			}
		}

		const svObj = teachers.find(t => t.id === supervisorId)
		const newStudent = {
			id: Date.now().toString(),
			name: name.trim(),
			term,
			phone,
			email,
			paperTitle,
			paperAbstract,
			paperFilePath: finalFilePath,
			paperNumber,
			assignedTeacherId: selectedTeacher.id,
			assignedTeacherName: selectedTeacher.name,
			supervisorId: supervisorId,
			supervisorName: svObj ? svObj.name : '',
			score: null, 
			isSent: false
		}

		const updatedTeachers = teachers.map(t => {
			if (t.id === selectedTeacher.id) {
				return {
					...t,
					assignedPapersCount: t.assignedPapersCount + 1,
					currentAssignments: [...t.currentAssignments, newStudent.id]
				}
			}
			return t
		})

		saveState([...students, newStudent], updatedTeachers)
		resetForm()
		alert(`Öğrenci başarıyla eklendi. Bildiri No: ${paperNumber}\nAtanan Hoca: ${selectedTeacher.name}`)
	}, [isEditing, editingId, isCoAuthorEntry, selectedParentPaperId, formData, teachers, students, saveState])

	const handleSelectDocx = useCallback(async () => {
		if (!window.electronAPI) return
		const res = await window.electronAPI.selectDocx()
		if (res.success) {
			setFormData(prev => ({ 
				...prev, 
				paperFilePath: res.filePath,
				paperAbstract: res.text 
			}))
		} else if (res.reason !== 'cancelled') {
			alert('Belge okunamadı: ' + res.reason)
		}
	}, [])

	const handleOpenPath = useCallback((pathStr) => {
		if (window.electronAPI?.openPath) {
			window.electronAPI.openPath(pathStr)
		}
	}, [])

	const handleDeleteStudent = useCallback(async (id) => {
		if (!window.confirm('Bu kaydı ve ilgili bildiriyi silmek istediğinize emin misiniz?')) return

		const studentToDelete = students.find(s => s.id === id)
		if (!studentToDelete) return

		let studentsToRemove = [id]
		let mainAuthorId = studentToDelete.isCoAuthor ? studentToDelete.parentPaperId : id
		
		if (!studentToDelete.isCoAuthor) {
			const coAuthors = students.filter(s => s.parentPaperId === id).map(s => s.id)
			studentsToRemove = [...studentsToRemove, ...coAuthors]
		}

		const updatedStudents = students.filter(s => !studentsToRemove.includes(s.id))

		const updatedTeachers = teachers.map(t => {
			if (t.id !== studentToDelete.assignedTeacherId) return t
			let newAssignedCount = t.assignedPapersCount
			let newAssignments = t.currentAssignments || []
			
			if (!studentToDelete.isCoAuthor) {
				newAssignedCount = Math.max(0, (t.assignedPapersCount || 0) - 1)
				newAssignments = newAssignments.filter(sid => sid !== id)
			}
			return { ...t, assignedPapersCount: newAssignedCount, currentAssignments: newAssignments }
		})

		if (studentToDelete.isCoAuthor && updatedStudents.length > 0) {
			const remainingCoAuthors = updatedStudents.filter(s => s.parentPaperId === mainAuthorId)
			const parentIndex = updatedStudents.findIndex(s => s.id === mainAuthorId)
			if (parentIndex !== -1) {
				const oldTitleBase = updatedStudents[parentIndex].paperTitle.replace(/ \(Ortak Yazar:.*\)$/, '')
				const updatedTitle = remainingCoAuthors.length > 0 
					? `${oldTitleBase} (Ortak Yazar: ${remainingCoAuthors.map(s => s.name).join(', ')})` 
					: oldTitleBase
				
				updatedStudents.forEach(s => {
					if (s.id === mainAuthorId || s.parentPaperId === mainAuthorId) {
						s.paperTitle = updatedTitle
					}
				})
			}
		}

		saveState(updatedStudents, updatedTeachers)

		if (!studentToDelete.isCoAuthor && studentToDelete.paperFilePath && window.electronAPI?.deleteFile) {
			const shouldDeleteFile = window.confirm('Bu ana bildiri; ilgili .docx dosyasını da diskten silmek ister misiniz?')
			if (shouldDeleteFile) {
				const res = await window.electronAPI.deleteFile(studentToDelete.paperFilePath)
				if (!res?.success && res?.reason) console.error('Dosya silinemedi:', res.reason)
			}
		}
	}, [students, teachers, saveState])

	// Sadece ana yazarları filtrele (ortak yazarlar dropdown içinde görünecek)
	const mainStudents = useMemo(() => students.filter(s => !s.isCoAuthor), [students])

	// Ortak yazarları ana yazarın id'sine göre grupla
	const coAuthorsByParent = useMemo(() => {
		const map = {}
		students.forEach(s => {
			if (s.isCoAuthor && s.parentPaperId) {
				if (!map[s.parentPaperId]) map[s.parentPaperId] = []
				map[s.parentPaperId].push(s)
			}
		})
		return map
	}, [students])

	const filteredStudents = useMemo(() => {
		if (!searchTerm.trim()) return mainStudents
		const s = searchTerm.toLowerCase()
		return mainStudents.filter(st => 
			st.name.toLowerCase().includes(s) || 
			st.paperNumber.toLowerCase().includes(s) || 
			st.paperTitle.toLowerCase().includes(s) ||
			(st.supervisorName && st.supervisorName.toLowerCase().includes(s)) ||
			st.assignedTeacherName.toLowerCase().includes(s) ||
			// Ortak yazar adlarında da ara
			(coAuthorsByParent[st.id] || []).some(ca => ca.name.toLowerCase().includes(s))
		)
	}, [mainStudents, coAuthorsByParent, searchTerm])

	// PDF ve Excel çıktısı için: ana yazar + ortak yazarları sırayla içeren liste (önceki davranışı korur)
	const filteredStudentsForExport = useMemo(() => {
		const result = []
		filteredStudents.forEach(st => {
			result.push(st)
			const coAuthors = coAuthorsByParent[st.id] || []
			coAuthors.forEach(ca => result.push(ca))
		})
		return result
	}, [filteredStudents, coAuthorsByParent])

	const studentsTable = useMemo(() => (
		<div className="bg-brand-900/10 border border-brand-800 rounded-xl overflow-hidden min-w-0">
			<div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
				<table className="w-full text-left text-sm whitespace-nowrap min-w-[1000px] border-collapse">
					<thead className="sticky top-0 z-20">
						<tr className="bg-brand-950 text-brand-100/50 border-b border-brand-800 backdrop-blur-md">
							<th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Bildiri No</th>
							<th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Öğrenci & Dönem</th>
							<th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Bildiri Başlığı</th>
							<th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Danışman</th>
							<th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-center">Belge</th>
							<th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Hakem (Hakem)</th>
							<th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-center">Puan</th>
							<th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">İşlem</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-brand-800/50">
						{filteredStudents.length === 0 ? (
							<tr>
								<td colSpan="8" className="px-6 py-12 text-center text-brand-100/40">
									<div className="flex flex-col items-center gap-3">
										<AlertTriangle className="w-8 h-8 opacity-20" />
										<span>{searchTerm ? 'Arama sonucu bulunamadı.' : 'Henüz kayıt bulunmuyor.'}</span>
									</div>
								</td>
							</tr>
						) : (
							filteredStudents.map(student => (
								<StudentRow 
									key={student.id} 
									student={student}
									coAuthors={coAuthorsByParent[student.id] || []}
									onOpenPath={handleOpenPath}
									onDelete={handleDeleteStudent}
									onEdit={handleEditInitiate}
								/>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	), [filteredStudents, coAuthorsByParent, searchTerm, handleOpenPath, handleDeleteStudent, handleEditInitiate])

	const handleExportExcel = useCallback(() => {
		if (filteredStudentsForExport.length === 0) return
		const data = filteredStudentsForExport.map(s => ({
			'Bildiri No': s.paperNumber,
			'Öğrenci Adı': s.name,
			'Tür': s.isCoAuthor ? 'Ortak Yazar' : 'Asıl Yazar',
			'Dönem': s.term,
			'E-Posta': s.email,
			'Telefon': s.phone,
			'Bildiri Başlığı': s.paperTitle,
			'Danışman': s.supervisorName || '-',
			'Atanan Hoca': s.assignedTeacherName,
			'Puan': s.score !== null ? s.score : '-'
		}))
		const ws = XLSX.utils.json_to_sheet(data)
		const wb = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(wb, ws, "Öğrenciler")
		XLSX.writeFile(wb, "bildiriler_listesi.xlsx")
	}, [filteredStudentsForExport])

	const handleExportPDF = useCallback(() => {
		if (filteredStudentsForExport.length === 0) return
		if (!window.electronAPI?.exportPdf) {
			alert('PDF dışa aktarma yalnızca masaüstü uygulamasında kullanılabilir.')
			return
		}

		window.electronAPI.exportPdf({
			title: 'Bildiriler ve Öğrenciler Listesi',
			subtitle: searchTerm ? `Filtreli çıktı: "${searchTerm}"` : 'Tüm kayıtlar için oluşturulan PDF çıktısı',
			meta: [
				{ label: 'Görünüm', value: 'Bildiri Listesi' },
				{ label: 'Filtre', value: searchTerm || 'Tümü' }
			],
			headers: ['Bildiri No', 'Öğrenci', 'Başlık', 'Danışman', 'Hakem', 'Puan'],
			rows: filteredStudentsForExport.map(student => ([
				student.isCoAuthor ? `↳ ${student.paperNumber}` : student.paperNumber,
				`${student.name}\n${student.term}`,
				student.paperTitle,
				student.supervisorName || '-',
				student.assignedTeacherName || '-',
				student.score !== null ? String(student.score) : '-'
			]))
		}).then(result => {
			if (!result?.success && !result?.cancelled) {
				alert(result?.error || 'PDF oluşturulamadı.')
			}
		}).catch(error => {
			alert(error?.message || 'PDF oluşturulamadı.')
		})
	}, [filteredStudentsForExport, searchTerm])

	if (loading) return (
		<div className="flex flex-col items-center justify-center py-20 text-brand-100/50">
			<GraduationCap className="w-12 h-12 mb-4 animate-pulse text-brand-500" />
			<p>Öğrenci ve bildiri kayıtları yükleniyor...</p>
		</div>
	)

	return (
		<div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 min-w-0 overflow-hidden">
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-semibold flex items-center gap-2">
					<GraduationCap className="text-brand-400" />
					Öğrenciler ve Bildiriler
				</h2>
				{isEditing && (
					<button 
						onClick={resetForm}
						className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all text-xs font-medium"
					>
						<X className="w-4 h-4" /> Düzenlemeyi İptal Et
					</button>
				)}
			</div>

			{/* Form Area */}
			<div className={`transition-all duration-300 ${isEditing ? 'ring-2 ring-brand-500 ring-offset-4 ring-offset-black' : ''}`}>
				<form onSubmit={handleAdd} className="bg-brand-900/20 border border-brand-800 p-6 rounded-xl space-y-5">
					<div className="flex items-center gap-3 mb-2 border-b border-brand-800/50 pb-4">
						<div className={`w-8 h-8 rounded-full flex items-center justify-center ${isEditing ? 'bg-brand-500 text-white' : 'bg-brand-800 text-brand-100/40'}`}>
							{isEditing ? <Pencil className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
						</div>
						<h3 className="text-white font-medium">
							{isEditing ? `Kaydı Düzenle: ${formData.name}` : 'Yeni Öğrenci ve Bildiri Kaydı'}
						</h3>
					</div>

					{isCoAuthorEntry && !isEditing && (
						<div className="mb-4 animate-in slide-in-from-top-2">
							<label className="block text-sm text-brand-100/70 mb-1.5">Hangi bildiriye eklenecek?</label>
							<select 
								value={selectedParentPaperId}
								onChange={e => setSelectedParentPaperId(e.target.value)}
								className="w-full bg-black/40 border border-brand-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-500 transition-colors"
							>
								<option value="" disabled>Lütfen ana bildiri seçiniz...</option>
								{students.filter(s => !s.isCoAuthor).map(s => (
									<option key={s.id} value={s.id}>{s.paperNumber} - {s.name} ({s.paperTitle.substring(0, 40)}...)</option>
								))}
							</select>
						</div>
					)}

					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<div className="sm:col-span-2">
							<label className="block text-sm text-brand-100/70 mb-1.5">Öğrenci Adı Soyadı</label>
							<input required type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Ahmet Yılmaz" className="w-full bg-black/40 border border-brand-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-500 transition-colors" />
						</div>
						<div>
							<label className="block text-sm text-brand-100/70 mb-1.5">Dönem</label>
							<select name="term" value={formData.term} onChange={handleInputChange} required className="w-full bg-black/40 border border-brand-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-500 transition-colors">
								<option value="" disabled>Seçiniz...</option>
								{["Dönem 1", "Dönem 2", "Dönem 3", "Dönem 4", "Dönem 5", "Dönem 6"].map(d => (
									<option key={d} value={d}>{d}</option>
								))}
							</select>
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						<div>
							<label className="block text-sm text-brand-100/70 mb-1.5">E-posta</label>
							<div className="relative">
								<Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-100/30" />
								<input required type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="ornek@posta.com" className="w-full bg-black/40 border border-brand-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-brand-500 transition-colors" />
							</div>
						</div>
						<div>
							<label className="block text-sm text-brand-100/70 mb-1.5">Telefon</label>
							<div className="relative">
								<Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-100/30" />
								<input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="0555 555 5555" className="w-full bg-black/40 border border-brand-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-brand-500 transition-colors" />
							</div>
						</div>
						<div>
							<label className="block text-sm text-brand-100/70 mb-1.5">Danışman Hoca</label>
							<select 
								required={!isCoAuthorEntry}
								name="supervisorId"
								value={formData.supervisorId}
								onChange={handleInputChange}
								disabled={isCoAuthorEntry && !isEditing}
								className="w-full bg-black/40 border border-brand-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-500 transition-colors disabled:opacity-50"
							>
								<option value="">{isCoAuthorEntry && !isEditing ? 'Ana bildiriye bağlı' : 'Seçiniz...'}</option>
								{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
							</select>
						</div>
					</div>

					{((!isCoAuthorEntry) || isEditing) && (
						<div className="space-y-4 animate-in fade-in duration-500">
							<div>
								<label className="block text-sm text-brand-100/70 mb-1.5">Bildiri Başlığı</label>
								<input required type="text" name="paperTitle" value={formData.paperTitle} onChange={handleInputChange} placeholder="Bildirinin başlığı..." className="w-full bg-black/40 border border-brand-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-500 transition-colors" />
							</div>

							<div>
								<div className="flex items-center justify-between mb-1.5">
									<label className="text-sm text-brand-100/70">Bildiri Özeti (Önizleme)</label>
									{isEditing && <span className="text-[10px] text-brand-400 bg-brand-400/10 px-2 py-0.5 rounded uppercase font-bold">Düzenleniyor</span>}
								</div>
								
								{formData.paperAbstract ? (
									<div className="w-full bg-black/40 border border-brand-800 rounded-lg px-4 py-3 text-brand-100/70 text-xs overflow-y-auto max-h-32 whitespace-pre-wrap font-mono">
										<div className="text-brand-400 mb-2 font-bold select-none text-[10px] uppercase tracking-wider">Metin İçeriği</div>
										{formData.paperAbstract.split('\n').filter(l => l.trim()).slice(0, 10).join('\n')}
										{formData.paperAbstract.split('\n').filter(l => l.trim()).length > 10 ? '\n\n... (Devamı belgede)' : ''}
									</div>
								) : (
									<div className="w-full text-center p-4 border border-dashed border-brand-800/30 rounded-lg text-sm text-brand-100/30">
										Belge seçilmedi.
									</div>
								)}
							</div>
						</div>
					)}
					
					<div className="flex flex-col sm:flex-row items-center sm:justify-between pt-4 border-t border-brand-800/50 gap-4">
						<div className="flex items-center gap-4 w-full sm:w-auto">
							{!isCoAuthorEntry && !isEditing && (
								<button type="button" onClick={handleSelectDocx} className="bg-brand-900/50 hover:bg-brand-900 text-white border border-brand-800 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2">
									<FileText className="w-4 h-4 text-brand-400"/> Belge Seç (.docx)
								</button>
							)}
							{formData.paperFilePath && <span className="text-xs font-mono text-brand-300 truncate max-w-[150px] px-2 py-1 bg-brand-900/30 rounded" title={formData.paperFilePath}>{formData.paperFilePath.split(/[\\/]/).pop()}</span>}
						</div>
						
						<div className="flex items-center gap-4 w-full sm:w-auto justify-end">
							{!isEditing && (
								<label className="flex items-center gap-2 cursor-pointer group select-none mr-4">
									<div className="relative flex items-center justify-center w-5 h-5 rounded overflow-hidden border border-brand-700 bg-brand-black group-hover:border-brand-500 transition-colors">
										<input type="checkbox" checked={isCoAuthorEntry} onChange={e => setIsCoAuthorEntry(e.target.checked)} className="peer sr-only" />
										<div className="w-full h-full peer-checked:bg-brand-500 transition-colors flex items-center justify-center">
											<svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
												<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
											</svg>
										</div>
									</div>
									<span className="text-sm font-medium text-brand-100/80 group-hover:text-white transition-colors">Ortak Yazar</span>
								</label>
							)}

							<button type="submit" disabled={!isEditing && !isCoAuthorEntry && !formData.paperAbstract} className={`px-8 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 justify-center shadow-lg ${isEditing ? 'bg-brand-500 hover:bg-brand-400 text-white' : 'bg-brand-600 hover:bg-brand-500 border border-brand-500/50 text-white disabled:opacity-30'}`}>
								{isEditing ? <Save className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
								{isEditing ? 'Değişiklikleri Kaydet' : 'Öğrenciyi Kaydet'}
							</button>
						</div>
					</div>
				</form>
			</div>

			{/* List Header & Search */}
			<div className="flex flex-col lg:flex-row lg:items-center justify-between mt-10 mb-4 gap-4">
				<div className="flex items-center gap-3">
					<h3 className="font-medium text-lg text-white">Bildiri Listesi</h3>
					<span className="px-2 py-0.5 rounded-full bg-brand-800/40 text-[10px] text-brand-100/50 font-mono italic">
						{searchTerm ? `${filteredStudents.length} / ${mainStudents.length}` : mainStudents.length} bildiri
					</span>
				</div>
				<div className="flex flex-col sm:flex-row gap-3">
					<div className="relative group">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-100/30 group-focus-within:text-brand-400 transition-colors" />
						<input 
							type="text" 
							placeholder="İsim, numara veya başlık ile ara..."
							value={searchTerm}
							onChange={e => setSearchTerm(e.target.value)}
							className="bg-brand-900/40 border border-brand-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-brand-500 transition-all w-full sm:w-64"
						/>
						{searchTerm && (
							<button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-brand-800 rounded-md transition-colors">
								<X className="w-3 h-3 text-brand-100/40" />
							</button>
						)}
					</div>
					<div className="flex gap-2">
						<button 
							onClick={handleExportExcel}
							disabled={filteredStudents.length === 0}
							className="bg-green-600/10 hover:bg-green-600/20 text-green-400 border border-green-500/20 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-30 flex-1 sm:flex-none justify-center"
						>
							<FileSpreadsheet className="w-4 h-4" /> Excel
						</button>
						<button 
							onClick={handleExportPDF}
							disabled={filteredStudents.length === 0}
							className="bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-30 flex-1 sm:flex-none justify-center"
						>
							<Download className="w-4 h-4" /> PDF
						</button>
					</div>
				</div>
			</div>

			{/* List Area */}
			{studentsTable}
		</div>
	)
}

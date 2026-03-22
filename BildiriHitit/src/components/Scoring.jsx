import React, { useState, useEffect, useCallback, memo, useMemo } from 'react'
import { FileCheck2, AlertCircle, Search, X, ChevronDown, ChevronRight } from 'lucide-react'

const normalizeSearchValue = (value) => String(value ?? '').toLowerCase()

const matchesStudentSearch = (student, query) => {
	if (!query) return true

	return [
		student.name,
		student.paperNumber,
		student.paperTitle,
		student.supervisorName,
		student.assignedTeacherName
	].some(value => normalizeSearchValue(value).includes(query))
}

const syncScoresAcrossLinkedPapers = (studentList) => {
	const parentScoreById = new Map(
		studentList
			.filter(student => !student.isCoAuthor)
			.map(student => [student.id, student.score ?? null])
	)

	let changed = false
	const nextList = studentList.map(student => {
		if (!student.isCoAuthor || !student.parentPaperId || !parentScoreById.has(student.parentPaperId)) {
			return student
		}

		const parentScore = parentScoreById.get(student.parentPaperId)
		if (Object.is(student.score ?? null, parentScore)) {
			return student
		}

		changed = true
		return { ...student, score: parentScore }
	})

	return { nextList, changed }
}

const applyScoreToPaperGroup = (studentList, sourceId, score) => {
	const selectedStudent = studentList.find(student => student.id === sourceId)
	if (!selectedStudent) return studentList

	const rootId = selectedStudent.isCoAuthor ? selectedStudent.parentPaperId : selectedStudent.id
	if (!rootId) return studentList

	return studentList.map(student => {
		if (student.id !== rootId && student.parentPaperId !== rootId) {
			return student
		}

		if (Object.is(student.score ?? null, score ?? null)) {
			return student
		}

		return { ...student, score }
	})
}

const formatScoreLabel = (score) => {
	if (score === undefined || score === null || score === '') {
		return 'Ana bildiriyle aynı'
	}

	return score
}

const ScoringMainRow = memo(({ student, coAuthorCount, expanded, autoExpanded, onToggle, onScoreChange }) => {
	const hasCoAuthors = coAuthorCount > 0

	return (
		<tr className="hover:bg-brand-800/20 transition-colors">
			<td className="px-6 py-3">
				<div className="flex items-center gap-3">
					{hasCoAuthors ? (
						<button
							type="button"
							onClick={() => onToggle(student.id)}
							className="flex h-7 w-7 items-center justify-center rounded-lg border border-brand-800 bg-black/30 text-brand-300 transition-colors hover:border-brand-500 hover:text-white"
							title={expanded ? 'Ortak yazarları gizle' : 'Ortak yazarları göster'}
						>
							{expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
						</button>
					) : (
						<div className="h-7 w-7" />
					)}
					<div className="flex flex-col">
						<span className="font-mono text-brand-400">{student.paperNumber}</span>
						<span className="text-[10px] uppercase tracking-widest text-brand-100/30">
							{hasCoAuthors
								? `${coAuthorCount} ortak yazar${autoExpanded ? ' • aramada açık' : ''}`
								: 'Ana bildiri'}
						</span>
					</div>
				</div>
			</td>
			<td className="px-6 py-3">
				<div className="flex flex-col">
					<span className="font-medium text-white">{student.name}</span>
					<span className="text-[10px] uppercase tracking-wider text-brand-400">Ana yazar</span>
				</div>
			</td>
			<td className="px-6 py-3 max-w-[200px] truncate text-brand-100/80" title={student.paperTitle}>
				<div className="truncate">{student.paperTitle}</div>
			</td>
			<td className="px-6 py-3 text-brand-100/60">
				<div className="flex flex-col">
					<span className="text-xs font-medium text-white">{student.supervisorName || '-'}</span>
					<span className="text-[10px] uppercase tracking-tighter text-brand-100/40">Danışman</span>
				</div>
			</td>
			<td className="px-6 py-3 text-center font-medium text-brand-100/60">
				{student.assignedTeacherName}
			</td>
			<td className="w-[168px] min-w-[168px] px-6 py-3">
				<input
					type="text"
					value={student.score ?? ''}
					onChange={(e) => onScoreChange(student.id, e.target.value)}
					placeholder="Girilmedi"
					className="block w-full rounded-lg border border-brand-800 bg-black/40 px-3 py-2 text-center font-bold text-white focus:border-brand-500 focus:outline-none"
				/>
			</td>
		</tr>
	)
})

const ScoringCoAuthorRow = memo(({ student }) => (
	<tr className="bg-brand-950/35 hover:bg-brand-900/30 transition-colors">
		<td className="px-6 py-3">
			<div className="flex items-center gap-3 pl-10">
				<div className="h-px w-4 bg-brand-700/60" />
				<div className="flex flex-col">
					<span className="font-mono text-brand-100/40">{student.paperNumber}</span>
					<span className="text-[10px] uppercase tracking-widest text-brand-100/20">Bağlı bildiri</span>
				</div>
			</div>
		</td>
		<td className="px-6 py-3">
			<div className="flex flex-col">
				<span className="font-medium text-brand-100/85">{student.name}</span>
				<span className="text-[10px] uppercase tracking-wider text-brand-100/35">Ortak yazar</span>
			</div>
		</td>
		<td className="px-6 py-3 max-w-[200px] text-brand-100/60" title={student.paperTitle}>
			<div className="truncate">{student.paperTitle}</div>
		</td>
		<td className="px-6 py-3 text-brand-100/50">
			<div className="flex flex-col">
				<span className="text-xs font-medium text-brand-100/80">{student.supervisorName || '-'}</span>
				<span className="text-[10px] uppercase tracking-tighter text-brand-100/30">Danışman</span>
			</div>
		</td>
		<td className="px-6 py-3 text-center font-medium text-brand-100/45">
			{student.assignedTeacherName}
		</td>
		<td className="w-[168px] min-w-[168px] px-6 py-3">
			<div className="rounded border border-brand-800/70 bg-black/25 px-3 py-1.5 text-center font-semibold text-brand-100/75">
				{formatScoreLabel(student.score)}
			</div>
		</td>
	</tr>
))

export default function Scoring() {
	const [students, setStudents] = useState([])
	const [loading, setLoading] = useState(true)
	const [searchTerm, setSearchTerm] = useState('')
	const [expandedParentIds, setExpandedParentIds] = useState({})

	useEffect(() => {
		const controller = new AbortController()
		let isMounted = true

		if (window.electronAPI) {
			window.electronAPI.loadData('students').then(data => {
				if (isMounted) {
					const { nextList, changed } = syncScoresAcrossLinkedPapers(data || [])
					setStudents(nextList)
					if (changed) {
						window.electronAPI.saveData('students', nextList)
					}
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

	const saveStudents = useCallback((newStudents) => {
		const { nextList } = syncScoresAcrossLinkedPapers(newStudents)
		setStudents(nextList)
		if (window.electronAPI) {
			window.electronAPI.saveData('students', nextList)
		}
	}, [])

	const handleManualScoreChange = useCallback((id, newScore) => {
		setStudents(prev => {
			const updated = applyScoreToPaperGroup(prev, id, newScore)
			if (window.electronAPI) {
				 window.electronAPI.saveData('students', updated)
			}
			return updated
		})
	}, [])

	const scoringGroups = useMemo(() => {
		const query = searchTerm.trim().toLowerCase()
		const coAuthorsByParentId = new Map()

		students.forEach(student => {
			if (!student.parentPaperId) return
			const currentGroup = coAuthorsByParentId.get(student.parentPaperId) || []
			currentGroup.push(student)
			coAuthorsByParentId.set(student.parentPaperId, currentGroup)
		})

		return students
			.filter(student => !student.isCoAuthor)
			.map(student => {
				const coAuthors = coAuthorsByParentId.get(student.id) || []
				const matchingCoAuthors = query
					? coAuthors.filter(coAuthor => matchesStudentSearch(coAuthor, query))
					: coAuthors
				const matchesMain = matchesStudentSearch(student, query)

				if (query && !matchesMain && matchingCoAuthors.length === 0) {
					return null
				}

				return {
					mainStudent: student,
					coAuthors,
					visibleCoAuthors: query && matchingCoAuthors.length > 0 ? matchingCoAuthors : coAuthors,
					autoExpanded: Boolean(query && matchingCoAuthors.length > 0)
				}
			})
			.filter(Boolean)
	}, [students, searchTerm])

	const mainPaperCount = useMemo(
		() => students.filter(student => !student.isCoAuthor).length,
		[students]
	)

	const toggleParentExpansion = useCallback((parentId) => {
		setExpandedParentIds(prev => ({
			...prev,
			[parentId]: !prev[parentId]
		}))
	}, [])

	if (loading) return (
		<div className="flex flex-col items-center justify-center py-20 text-brand-100/50">
			<FileCheck2 className="w-12 h-12 mb-4 animate-bounce text-brand-500" />
			<p>Puanlama verileri yükleniyor...</p>
		</div>
	)

	return (
		<div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
			<h2 className="text-xl font-semibold flex items-center gap-2">
				<FileCheck2 className="text-brand-400" />
				Puanlama Sistemi
			</h2>

			<div className="rounded-xl border border-brand-800 bg-brand-900/20 p-6 shadow-xl shadow-black/20">
				<div>
					<h3 className="text-lg font-semibold text-white">Manuel Puan Girişi</h3>
					<p className="mt-2 text-sm leading-relaxed text-brand-100/55">
						Atanan bildirilere bu alandan puan girişi yapabilirsiniz.
					</p>
				</div>
			</div>

			{/* List Header & Search */}
			<div className="flex items-center justify-between mt-10 mb-4">
				<div className="flex items-center gap-3">
					<h3 className="font-medium text-lg text-white">Güncel Puan Durumu</h3>
					<span className="text-[10px] text-brand-100/30 uppercase tracking-widest font-mono italic">
						{searchTerm ? `${scoringGroups.length} / ${mainPaperCount}` : mainPaperCount} ana bildiri
					</span>
				</div>
				<div className="relative group">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-100/30 group-focus-within:text-brand-400 transition-colors" />
					<input 
						type="text" 
						placeholder="Ara..."
						value={searchTerm}
						onChange={e => setSearchTerm(e.target.value)}
						className="bg-brand-900/40 border border-brand-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-brand-500 transition-all w-64"
					/>
					{searchTerm && (
						<button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-brand-800 rounded-md transition-colors">
							<X className="w-3 h-3 text-brand-100/40" />
						</button>
					)}
				</div>
			</div>
			<p className="mt-[-8px] text-sm text-brand-100/45">
				Puan sadece ana bildiri için girilir. Ortak yazar kayıtları aynı puanı otomatik devralır ve isterseniz satır altından görüntülenir.
			</p>

			{/* List */}
			<div className="bg-brand-900/10 border border-brand-800 rounded-xl overflow-hidden shadow-2xl shadow-black/40">
				<div className="overflow-x-auto overflow-y-auto max-h-[500px] custom-scrollbar">
					<table className="w-full min-w-[1080px] table-fixed border-collapse text-left text-sm">
						<colgroup>
							<col className="w-[150px]" />
							<col className="w-[220px]" />
							<col />
							<col className="w-[190px]" />
							<col className="w-[170px]" />
							<col className="w-[168px]" />
						</colgroup>
						<thead className="sticky top-0 z-10 bg-brand-950 border-b border-brand-800">
							<tr className="text-brand-100/40">
								<th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Bildiri No</th>
								<th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Öğrenci</th>
								<th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Bildiri Başlığı</th>
								<th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Danışman</th>
								<th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-center">Değerlendirici</th>
								<th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-center">Puan</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-brand-800/50">
							{scoringGroups.length === 0 ? (
								<tr>
									<td colSpan="6" className="px-6 py-12 text-center text-brand-100/40">
										<div className="flex flex-col items-center gap-3">
											{searchTerm ? <Search className="w-8 h-8 opacity-20" /> : <AlertCircle className="w-8 h-8 opacity-20" />}
											<span>{searchTerm ? 'Arama sonucu bulunamadı.' : 'Sistemde bildiri kaydı bulunmuyor.'}</span>
										</div>
									</td>
								</tr>
							) : (
								scoringGroups.flatMap(group => {
									const isExpanded = Boolean(expandedParentIds[group.mainStudent.id]) || group.autoExpanded
									const rows = [
										<ScoringMainRow
											key={group.mainStudent.id}
											student={group.mainStudent}
											coAuthorCount={group.coAuthors.length}
											expanded={isExpanded}
											autoExpanded={group.autoExpanded}
											onToggle={toggleParentExpansion}
											onScoreChange={handleManualScoreChange}
										/>
									]

									if (isExpanded) {
										group.visibleCoAuthors.forEach(coAuthor => {
											rows.push(
												<ScoringCoAuthorRow
													key={coAuthor.id}
													student={coAuthor}
												/>
											)
										})
									}

									return rows
								})
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}

import { useState, useEffect } from 'react'
import { Trash2, ChevronRight, BookOpen, Clock, GraduationCap } from 'lucide-react'
import { Header } from '../components/Header'
import type { Lesson, HistoryEntry } from '../types'
import { storage } from '../lib/storage'
import { truncate } from '../lib/utils'

interface Props {
  onLessonOpen: (lesson: Lesson) => void
  onHistoryOpen: (entry: HistoryEntry) => void
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffMins < 1)   return 'just now'
  if (diffMins < 60)  return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7)   return `${diffDays}d ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function SavedPage({ onLessonOpen, onHistoryOpen }: Props) {
  const [tab, setTab]           = useState<'saved' | 'recent'>('recent')
  const [lessons, setLessons]   = useState<Lesson[]>([])
  const [history, setHistory]   = useState<HistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([storage.getLessons(), storage.getHistory()]).then(([l, h]) => {
      setLessons(l)
      setHistory(h)
      setIsLoading(false)
    })
  }, [])

  async function handleDeleteSaved(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    await storage.deleteLesson(id)
    setLessons(prev => prev.filter(l => l.id !== id))
  }

  async function handleClearHistory(e: React.MouseEvent) {
    e.stopPropagation()
    await storage.clearHistory()
    setHistory([])
  }

  const tabBtn = (t: 'saved' | 'recent') =>
    `flex-1 py-2 text-xs font-bold rounded-xl transition-colors ${
      tab === t
        ? 'bg-white text-navy-700 shadow-sm'
        : 'text-slate-400 hover:text-slate-600'
    }`

  const Skeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 animate-pulse space-y-2">
          <div className="h-3 bg-slate-100 rounded w-1/3" />
          <div className="h-3 bg-slate-100 rounded w-3/4" />
        </div>
      ))}
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      <Header title="Your Library" subtitle="Lessons" />

      {/* Sub-tab switcher */}
      <div className="px-4 pb-3 shrink-0">
        <div className="flex bg-slate-100 rounded-2xl p-1 gap-1">
          <button className={tabBtn('recent')} onClick={() => setTab('recent')}>
            🕐 Recent
          </button>
          <button className={tabBtn('saved')} onClick={() => setTab('saved')}>
            📌 Saved
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {isLoading && <Skeleton />}

        {/* ── Recent tab ────────────────────────────────────────────────── */}
        {!isLoading && tab === 'recent' && (
          <>
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center pb-10">
                <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center">
                  <Clock size={28} className="text-navy-300" />
                </div>
                <div>
                  <p className="font-bold text-navy-800 text-sm">No history yet</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Generated lessons will appear here automatically.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {history.length} lesson{history.length !== 1 ? 's' : ''}
                  </p>
                  <button
                    onClick={handleClearHistory}
                    className="text-[10px] font-semibold text-slate-400 hover:text-red-400 transition-colors"
                  >
                    Clear all
                  </button>
                </div>

                <div className="space-y-2">
                  {history.map(entry => (
                    <button
                      key={entry.id}
                      onClick={() => onHistoryOpen(entry)}
                      className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-left hover:border-navy-400 hover:shadow-sm transition-all group flex items-center gap-3"
                    >
                      {/* Mode badge */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        entry.mode === 'teacher'
                          ? 'bg-navy-700'
                          : 'bg-sky-500'
                      }`}>
                        {entry.mode === 'teacher'
                          ? <GraduationCap size={18} className="text-white" />
                          : <span className="text-white text-xs font-black">{entry.level}</span>
                        }
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                            entry.mode === 'teacher'
                              ? 'bg-navy-100 text-navy-600'
                              : 'bg-sky-100 text-sky-600'
                          }`}>
                            {entry.mode === 'teacher' ? 'Teacher' : 'Student'}
                          </span>
                        </div>
                        <p className="font-semibold text-navy-800 text-xs leading-snug">
                          {truncate(
                            entry.mode === 'teacher'
                              ? (entry.teacherLesson?.title ?? entry.article.title)
                              : (entry.lessonContent?.title ?? entry.article.title),
                            55,
                          )}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {entry.article.source.name} · {formatDate(entry.createdAt)}
                        </p>
                      </div>

                      <ChevronRight size={15} className="text-slate-300 group-hover:text-navy-500 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ── Saved tab ─────────────────────────────────────────────────── */}
        {!isLoading && tab === 'saved' && (
          <>
            {lessons.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center pb-10">
                <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center">
                  <BookOpen size={28} className="text-navy-300" />
                </div>
                <div>
                  <p className="font-bold text-navy-800 text-sm">No saved lessons yet</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Generate a lesson and tap the bookmark icon to save it here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {lessons.map(lesson => (
                  <button
                    key={lesson.id}
                    onClick={() => onLessonOpen(lesson)}
                    className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-left hover:border-navy-400 hover:shadow-sm transition-all group flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-navy-700 flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-black">{lesson.level}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-navy-800 text-xs leading-snug">
                        {truncate(lesson.content.title, 60)}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {lesson.article.source.name} · {formatDate(lesson.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => handleDeleteSaved(lesson.id, e)}
                        className="p-1.5 rounded-xl hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        aria-label="Delete lesson"
                      >
                        <Trash2 size={14} />
                      </button>
                      <ChevronRight size={15} className="text-slate-300 group-hover:text-navy-500 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

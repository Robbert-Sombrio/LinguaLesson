import { useState, useEffect } from 'react'
import { ArrowRight, Loader2, RefreshCw, Sparkles, FileText } from 'lucide-react'
import { Header } from '../components/Header'
import { fetchArticleAngles, generateTeacherLesson } from '../lib/openai'
import { storage } from '../lib/storage'
import type { Article, ArticleAngle, TeacherLesson } from '../types'

interface Props {
  article: Article
  sourceText: string
  onBack: () => void
  onTeacherLessonReady: (lesson: TeacherLesson, article: Article) => void
}

export function ArticleAnglesPage({ article, sourceText, onBack, onTeacherLessonReady }: Props) {
  const [angles, setAngles]           = useState<ArticleAngle[]>([])
  const [loadingAngles, setLoadingAngles] = useState(true)
  const [generating, setGenerating]   = useState(false)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [error, setError]             = useState('')

  useEffect(() => {
    loadAngles()
  }, [])

  async function loadAngles() {
    setLoadingAngles(true)
    setError('')
    try {
      const key = await storage.getOpenAIKey()
      if (!key) throw new Error('Please add your OpenAI API key in Settings first.')
      const result = await fetchArticleAngles(sourceText, key)
      setAngles(result)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoadingAngles(false)
    }
  }

  async function handleSelect(angleInstruction: string | null, idx: number) {
    setSelectedIdx(idx)
    setGenerating(true)
    setError('')
    try {
      const key = await storage.getOpenAIKey()
      if (!key) throw new Error('Please add your OpenAI API key in Settings first.')
      const lesson = await generateTeacherLesson(sourceText, angleInstruction, key)
      onTeacherLessonReady(lesson, article)
    } catch (e) {
      setError((e as Error).message)
      setGenerating(false)
      setSelectedIdx(null)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Teacher Mode"
        subtitle="Choose a lesson angle"
        onBack={generating ? undefined : onBack}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Article info */}
        <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            {article.source.name}
          </p>
          <p className="text-xs font-semibold text-navy-800 leading-snug line-clamp-2">
            {article.title}
          </p>
        </div>

        {/* Loading angles */}
        {loadingAngles && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-10 h-10 rounded-2xl bg-navy-100 flex items-center justify-center">
              <Sparkles size={18} className="text-navy-700 animate-pulse" />
            </div>
            <p className="text-xs font-semibold text-slate-500">Generating lesson angles…</p>
          </div>
        )}

        {/* Generating lesson */}
        {generating && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-10 h-10 rounded-2xl bg-navy-700 flex items-center justify-center">
              <Loader2 size={18} className="text-white animate-spin" />
            </div>
            <p className="text-xs font-semibold text-navy-700">Building your speaking lesson…</p>
            <p className="text-[10px] text-slate-400 text-center px-6">
              This generates a complete 13-section lesson plan — it takes about 20–30 seconds
            </p>
          </div>
        )}

        {/* Angle cards */}
        {!loadingAngles && !generating && angles.length > 0 && (
          <>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                How do you want to frame this lesson?
              </p>
              <div className="space-y-2.5">

                {/* Option 0 — Rephrase original */}
                <button
                  onClick={() => handleSelect(null, 0)}
                  disabled={generating}
                  className={`w-full text-left border-2 rounded-2xl p-4 transition-colors group ${
                    selectedIdx === 0
                      ? 'bg-sky-50 border-sky-500'
                      : 'bg-white border-sky-200 hover:border-sky-400'
                  } disabled:opacity-60`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-sky-200 transition-colors">
                      <FileText size={15} className="text-sky-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-navy-800">Rephrase for the classroom</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        Keep the original content but rewrite it at C1/C2 level for English learners — clearer structure, richer vocabulary in context.
                      </p>
                    </div>
                    <ArrowRight size={15} className="text-slate-300 group-hover:text-sky-500 transition-colors mt-1 shrink-0" />
                  </div>
                </button>

                {/* Options 1-3 — GPT-suggested angles */}
                {angles.map((angle, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(angle.instruction, i + 1)}
                    disabled={generating}
                    className={`w-full text-left border-2 rounded-2xl p-4 transition-colors group ${
                      selectedIdx === i + 1
                        ? 'bg-navy-50 border-navy-500'
                        : 'bg-white border-slate-200 hover:border-navy-400'
                    } disabled:opacity-60`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-navy-100 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-navy-200 transition-colors">
                        <span className="text-sm font-black text-navy-700">{i + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-navy-800">{angle.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          {angle.description}
                        </p>
                      </div>
                      <ArrowRight size={15} className="text-slate-300 group-hover:text-navy-500 transition-colors mt-1 shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Refresh angles */}
            <button
              onClick={loadAngles}
              className="w-full flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 text-xs font-semibold py-2.5 rounded-xl transition-colors"
            >
              <RefreshCw size={13} /> Suggest different angles
            </button>
          </>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <div className="h-2" />
      </div>
    </div>
  )
}

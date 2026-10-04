import { useState, useEffect } from 'react'
import {
  Bookmark, BookmarkCheck, ExternalLink, Download,
  ChevronDown, ChevronUp, Pencil, Brain,
} from 'lucide-react'
import { Header } from '../components/Header'
import { VocabExercise } from '../components/VocabExercise'
import { ComprehensionExercise } from '../components/ComprehensionExercise'
import type { Article, Level, LessonContent, TopicId, Lesson } from '../types'
import { storage } from '../lib/storage'
import { generateId } from '../lib/utils'
import { openLessonWebView } from '../lib/lessonExport'

interface Props {
  article: Article
  lessonContent: LessonContent
  level: Level
  topicId: TopicId | 'custom'
  onBack: () => void
  existingLesson?: Lesson
}

type Section = 'article' | 'vocabulary' | 'comprehension' | 'discussion' | 'grammar'
type View    = 'lesson' | 'vocab-exercise' | 'comprehension-exercise'

export function LessonPage({ article, lessonContent, level, topicId, onBack, existingLesson }: Props) {
  const [isSaved, setIsSaved]         = useState(false)
  const [openSection, setOpenSection] = useState<Section | null>(
    lessonContent.fullArticle ? 'article' : 'vocabulary',
  )
  const [view, setView]               = useState<View>('lesson')
  const [exporting, setExporting]     = useState(false)
  const [saving, setSaving]           = useState(false)

  useEffect(() => {
    storage.isLessonSaved(article.url, level).then(setIsSaved)
  }, [article.url, level])

  async function handleSave() {
    if (isSaved) return
    const lesson: Lesson = existingLesson ?? {
      id: generateId(),
      article,
      level,
      topicId,
      content: lessonContent,
      createdAt: new Date().toISOString(),
    }
    await storage.saveLesson(lesson)
    setIsSaved(true)
  }

  async function handleWebView() {
    setExporting(true)
    try {
      await openLessonWebView(lessonContent, article, level)
    } finally {
      setExporting(false)
    }
  }

  async function handleDownload() {
    setSaving(true)
    try {
      await openLessonWebView(lessonContent, article, level, true)
    } finally {
      setSaving(false)
    }
  }

  function toggleSection(s: Section) {
    setOpenSection(openSection === s ? null : s)
  }

  // ── Exercise overlays ──────────────────────────────────────────────────────
  if (view === 'vocab-exercise') {
    return (
      <VocabExercise
        vocab={lessonContent.vocabulary}
        lessonTitle={lessonContent.title}
        onClose={() => setView('lesson')}
      />
    )
  }

  if (view === 'comprehension-exercise') {
    return (
      <ComprehensionExercise
        questions={lessonContent.comprehensionQuestions}
        onClose={() => setView('lesson')}
      />
    )
  }

  // ── Main lesson view ───────────────────────────────────────────────────────
  const isTopicBased  = article.url.startsWith('topic:')
  const sectionClass  = 'bg-white border border-slate-200 rounded-2xl overflow-hidden'
  const headerClass   = 'w-full flex items-center justify-between px-4 py-3 text-left'
  const titleClass    = 'font-bold text-sm text-navy-800'

  return (
    <div className="flex flex-col h-full">
      <Header
        title={`${level} Lesson`}
        subtitle={lessonContent.title}
        onBack={onBack}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

        {/* ── Source card + actions ─────────────────────────────────────── */}
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              {article.source.name}
            </p>
            <p className="text-xs text-navy-700 font-medium leading-tight line-clamp-2">
              {article.title}
            </p>
            {!isTopicBased && article.url.startsWith('http') && (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-sky-600 hover:underline mt-0.5 inline-block"
              >
                View source article ↗
              </a>
            )}
          </div>

          <div className="flex items-center gap-1.5 ml-3 shrink-0">
            {/* Open as full webpage */}
            <button
              onClick={handleWebView}
              disabled={exporting}
              title="Open as webpage"
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-navy-100 hover:text-navy-700 transition-colors text-slate-500 disabled:opacity-50"
            >
              <ExternalLink size={14} />
            </button>
            {/* Save as PDF */}
            <button
              onClick={handleDownload}
              disabled={saving}
              title="Save as PDF"
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-navy-100 hover:text-navy-700 transition-colors text-slate-500 disabled:opacity-50"
            >
              <Download size={14} />
            </button>
            {/* Save lesson */}
            <button
              onClick={handleSave}
              disabled={isSaved}
              title={isSaved ? 'Saved' : 'Save lesson'}
              className={`p-1.5 rounded-xl transition-colors ${
                isSaved ? 'bg-navy-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
              }`}
            >
              {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            </button>
          </div>
        </div>

        {/* ── Summary ──────────────────────────────────────────────────── */}
        <div className="bg-sky-50 border border-sky-100 rounded-2xl px-4 py-3">
          <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wider mb-1">Summary</p>
          <p className="text-xs text-slate-700 leading-relaxed">{lessonContent.summary}</p>
        </div>

        {/* ── Reading Material (topic-based only) ──────────────────────── */}
        {lessonContent.fullArticle && (
          <div className={sectionClass}>
            <button className={headerClass} onClick={() => toggleSection('article')}>
              <div className="flex items-center gap-2">
                <span className="text-base">📖</span>
                <span className={titleClass}>Reading Material</span>
              </div>
              {openSection === 'article'
                ? <ChevronUp size={16} className="text-slate-400" />
                : <ChevronDown size={16} className="text-slate-400" />}
            </button>

            {openSection === 'article' && (
              <div className="border-t border-slate-100 px-4 py-4 space-y-3">
                {lessonContent.fullArticle
                  .split(/\n{1,}/)
                  .map(p => p.trim())
                  .filter(Boolean)
                  .map((para, i) => (
                    <p key={i} className="text-xs text-slate-700 leading-relaxed">{para}</p>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* ── Vocabulary ───────────────────────────────────────────────── */}
        <div className={sectionClass}>
          <button className={headerClass} onClick={() => toggleSection('vocabulary')}>
            <div className="flex items-center gap-2">
              <span className="text-base">📚</span>
              <span className={titleClass}>Vocabulary</span>
              <span className="text-[10px] bg-navy-100 text-navy-700 font-bold px-2 py-0.5 rounded-full">
                {lessonContent.vocabulary.length} words
              </span>
            </div>
            {openSection === 'vocabulary'
              ? <ChevronUp size={16} className="text-slate-400" />
              : <ChevronDown size={16} className="text-slate-400" />}
          </button>

          {openSection === 'vocabulary' && (
            <div className="border-t border-slate-100">
              <div className="divide-y divide-slate-100">
                {lessonContent.vocabulary.map((v, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="font-bold text-sm text-navy-700">{v.word}</span>
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full font-medium">
                        {i + 1}/{lessonContent.vocabulary.length}
                      </span>
                    </div>
                    {v.pronunciation && (
                      <p className="text-[10px] font-mono font-semibold text-sky-600 tracking-wide mb-1">
                        {v.pronunciation}
                      </p>
                    )}
                    <p className="text-xs text-slate-600 mb-1">{v.definition}</p>
                    <p className="text-xs text-slate-400 italic">"{v.example}"</p>
                  </div>
                ))}
              </div>

              <div className="px-4 pb-4 pt-2">
                <button
                  onClick={() => setView('vocab-exercise')}
                  className="w-full flex items-center justify-center gap-2 bg-navy-700 hover:bg-navy-800 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
                >
                  <Pencil size={13} /> Practice Vocabulary
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Comprehension (questions only — answers via quiz) ─────────── */}
        <div className={sectionClass}>
          <button className={headerClass} onClick={() => toggleSection('comprehension')}>
            <div className="flex items-center gap-2">
              <span className="text-base">🧠</span>
              <span className={titleClass}>Comprehension</span>
              <span className="text-[10px] bg-navy-100 text-navy-700 font-bold px-2 py-0.5 rounded-full">
                {lessonContent.comprehensionQuestions.length} questions
              </span>
            </div>
            {openSection === 'comprehension'
              ? <ChevronUp size={16} className="text-slate-400" />
              : <ChevronDown size={16} className="text-slate-400" />}
          </button>

          {openSection === 'comprehension' && (
            <div className="border-t border-slate-100 px-4 py-4">
              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                Answer {lessonContent.comprehensionQuestions.length} questions about the lesson,
                then compare your responses with model answers.
              </p>
              <button
                onClick={() => setView('comprehension-exercise')}
                className="w-full flex items-center justify-center gap-2 bg-navy-700 hover:bg-navy-800 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
              >
                <Brain size={13} /> Start Comprehension Quiz
              </button>
            </div>
          )}
        </div>

        {/* ── Discussion Points ─────────────────────────────────────────── */}
        <div className={sectionClass}>
          <button className={headerClass} onClick={() => toggleSection('discussion')}>
            <div className="flex items-center gap-2">
              <span className="text-base">💬</span>
              <span className={titleClass}>Discussion</span>
            </div>
            {openSection === 'discussion'
              ? <ChevronUp size={16} className="text-slate-400" />
              : <ChevronDown size={16} className="text-slate-400" />}
          </button>

          {openSection === 'discussion' && (
            <div className="border-t border-slate-100 px-4 py-3 space-y-2">
              {lessonContent.discussionPoints.map((point, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-navy-400 font-bold text-xs mt-0.5 shrink-0">{i + 1}.</span>
                  <p className="text-xs text-slate-700 leading-relaxed">{point}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Grammar Focus ─────────────────────────────────────────────── */}
        <div className={sectionClass}>
          <button className={headerClass} onClick={() => toggleSection('grammar')}>
            <div className="flex items-center gap-2">
              <span className="text-base">✏️</span>
              <span className={titleClass}>Grammar Focus</span>
            </div>
            {openSection === 'grammar'
              ? <ChevronUp size={16} className="text-slate-400" />
              : <ChevronDown size={16} className="text-slate-400" />}
          </button>

          {openSection === 'grammar' && (
            <div className="border-t border-slate-100 px-4 py-4 space-y-2">
              <p className="text-sm font-bold text-navy-700">{lessonContent.grammar.point}</p>
              <p className="text-xs text-slate-600 leading-relaxed">{lessonContent.grammar.explanation}</p>
              <div className="bg-sky-50 border border-sky-100 rounded-xl px-3 py-2 mt-2">
                <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wider mb-0.5">Example</p>
                <p className="text-xs text-slate-700 italic">"{lessonContent.grammar.example}"</p>
              </div>
            </div>
          )}
        </div>

        <div className="h-2" />
      </div>
    </div>
  )
}

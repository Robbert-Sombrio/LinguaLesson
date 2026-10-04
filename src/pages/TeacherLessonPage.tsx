import { useState, useMemo } from 'react'
import {
  ChevronDown, ChevronUp, ExternalLink, FileText, FileDown,
} from 'lucide-react'
import { Header } from '../components/Header'
import { downloadTeacherHTML, downloadTeacherMarkdown } from '../lib/lessonExport'
import type { Article, TeacherLesson } from '../types'

interface Props {
  lesson: TeacherLesson
  article: Article
  onBack: () => void
}

type Section =
  | 'warmup' | 'quote' | 'vocab' | 'reading' | 'comprehension'
  | 'vocabEx' | 'grammar' | 'discussion' | 'critical' | 'writing'
  | 'roleplay' | 'dialogues' | 'didyouknow'


export function TeacherLessonPage({ lesson, article, onBack }: Props) {
  const [openSection, setOpenSection] = useState<Section>('warmup')

  function toggle(s: Section) {
    setOpenSection(openSection === s ? (null as unknown as Section) : s)
  }

  // Shuffle the answer words once so they form a word-bank (no answers revealed)
  const shuffledVocabWords = useMemo(() => {
    const arr = lesson.vocabularyExercise.map(ex => ex.answer)
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }, [lesson])

  const chipColors = [
    'bg-sky-100 text-sky-700 border-sky-200',
    'bg-navy-100 text-navy-700 border-navy-200',
    'bg-purple-100 text-purple-700 border-purple-200',
    'bg-amber-100 text-amber-700 border-amber-200',
  ]

  const sectionClass = 'bg-white border border-slate-200 rounded-2xl overflow-hidden'
  const headerClass  = 'w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 transition-colors'

  function SectionHeader({ id, label, emoji, badge }: { id: Section; label: string; emoji: string; badge?: string }) {
    const isOpen = openSection === id
    return (
      <button className={headerClass} onClick={() => toggle(id)}>
        <div className="flex items-center gap-2.5">
          <span className="text-base">{emoji}</span>
          <span className="font-bold text-sm text-navy-800">{label}</span>
          {badge && (
            <span className="text-[10px] bg-navy-100 text-navy-700 font-bold px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        {isOpen
          ? <ChevronUp size={15} className="text-slate-400 shrink-0" />
          : <ChevronDown size={15} className="text-slate-400 shrink-0" />}
      </button>
    )
  }

  const NumberedList = ({ items, className = '' }: { items: string[]; className?: string }) => (
    <ol className={`space-y-2 ${className}`}>
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className="shrink-0 w-5 h-5 rounded-full bg-navy-100 text-navy-700 text-[10px] font-black flex items-center justify-center mt-0.5">
            {i + 1}
          </span>
          <p className="text-xs text-slate-700 leading-relaxed">{item}</p>
        </li>
      ))}
    </ol>
  )

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Teacher Lesson"
        subtitle={lesson.title}
        onBack={onBack}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

        {/* Source + actions bar */}
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              {article.source.name}
            </p>
            <p className="text-xs text-navy-700 font-medium leading-tight line-clamp-2">
              {article.title}
            </p>
          </div>
          <div className="flex items-center gap-1.5 ml-3 shrink-0">
            {article.url.startsWith('http') && (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                title="View source article"
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-navy-100 hover:text-navy-700 transition-colors text-slate-500"
              >
                <ExternalLink size={14} />
              </a>
            )}
            <button
              onClick={() => downloadTeacherMarkdown(lesson, article)}
              title="Download as Markdown"
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-navy-100 hover:text-navy-700 transition-colors text-slate-500"
            >
              <FileText size={14} />
            </button>
            <button
              onClick={() => downloadTeacherHTML(lesson, article)}
              title="Download PDF-ready file"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-700 hover:bg-navy-800 text-white text-[11px] font-bold transition-colors"
            >
              <FileDown size={13} /> PDF
            </button>
          </div>
        </div>

        {/* ── Warm-up Questions ──────────────────────────────────────── */}
        <div className={sectionClass}>
          <SectionHeader id="warmup" label="Warm-up Questions" emoji="🔥" badge={`${lesson.warmupQuestions.length} questions`} />
          {openSection === 'warmup' && (
            <div className="border-t border-slate-100 px-4 py-4">
              <NumberedList items={lesson.warmupQuestions} />
            </div>
          )}
        </div>

        {/* ── Interesting Quote ──────────────────────────────────────── */}
        <div className={sectionClass}>
          <SectionHeader id="quote" label="Interesting Quote" emoji="💡" />
          {openSection === 'quote' && (
            <div className="border-t border-slate-100 px-4 py-4">
              <div className="bg-navy-50 border-l-4 border-navy-500 pl-4 pr-2 py-3 rounded-r-xl">
                <p className="text-sm font-semibold text-navy-800 italic leading-relaxed">
                  "{lesson.interestingQuote}"
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Vocabulary ─────────────────────────────────────────────── */}
        <div className={sectionClass}>
          <SectionHeader id="vocab" label="Vocabulary" emoji="📚" badge={`${lesson.vocabulary.length} words`} />
          {openSection === 'vocab' && (
            <div className="border-t border-slate-100">
              <div className="divide-y divide-slate-100">
                {lesson.vocabulary.map((v, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                      <span className="font-bold text-sm text-navy-700">{v.word}</span>
                      <span className="text-[10px] font-mono font-semibold text-sky-600 tracking-wide shrink-0">
                        {v.pronunciation}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{v.definition}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Reading ────────────────────────────────────────────────── */}
        <div className={sectionClass}>
          <SectionHeader id="reading" label="Reading" emoji="📖" />
          {openSection === 'reading' && (
            <div className="border-t border-slate-100 px-4 py-4 space-y-3">
              {lesson.reading
                .split(/\n{1,}/)
                .map(p => p.trim())
                .filter(Boolean)
                .map((para, i) => (
                  <p key={i} className="text-xs text-slate-700 leading-relaxed">{para}</p>
                ))}
            </div>
          )}
        </div>

        {/* ── Comprehension Questions ────────────────────────────────── */}
        <div className={sectionClass}>
          <SectionHeader id="comprehension" label="Comprehension Questions" emoji="❓" badge={`${lesson.comprehensionQuestions.length} questions`} />
          {openSection === 'comprehension' && (
            <div className="border-t border-slate-100 px-4 py-4">
              <NumberedList items={lesson.comprehensionQuestions} />
            </div>
          )}
        </div>

        {/* ── Vocabulary Exercise ────────────────────────────────────── */}
        <div className={sectionClass}>
          <SectionHeader id="vocabEx" label="Vocabulary Exercise" emoji="✏️" />
          {openSection === 'vocabEx' && (
            <div className="border-t border-slate-100 px-4 py-4 space-y-3">
              {/* Word bank */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Word Bank</p>
                <div className="flex flex-wrap gap-1.5">
                  {shuffledVocabWords.map((word, i) => (
                    <span
                      key={word}
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${chipColors[i % chipColors.length]}`}
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Complete each sentence with the correct word
              </p>
              <ol className="space-y-2.5">
                {lesson.vocabularyExercise.map((ex, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-navy-100 text-navy-700 text-[10px] font-black flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {ex.sentence.split('_____').map((part, j, arr) => (
                          j < arr.length - 1 ? (
                            <span key={j}>
                              {part}
                              <span className="inline-block bg-slate-100 border border-slate-300 rounded px-2 py-0 text-slate-400 font-mono text-[10px] mx-0.5">
                                _______
                              </span>
                            </span>
                          ) : part
                        ))}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* ── Grammar Point ──────────────────────────────────────────── */}
        <div className={sectionClass}>
          <SectionHeader id="grammar" label="Grammar Point" emoji="⚙️" />
          {openSection === 'grammar' && (
            <div className="border-t border-slate-100 px-4 py-4 space-y-3">
              <p className="text-sm font-bold text-navy-700">{lesson.grammarPoint.title}</p>
              <p className="text-xs text-slate-600 leading-relaxed">{lesson.grammarPoint.explanation}</p>

              {lesson.grammarPoint.examples.length > 0 && (
                <div className="bg-sky-50 border border-sky-100 rounded-xl px-3 py-3 space-y-2">
                  <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">Examples</p>
                  {lesson.grammarPoint.examples.map((ex, i) => (
                    <p key={i} className="text-xs text-slate-700 italic leading-relaxed">• {ex}</p>
                  ))}
                </div>
              )}

              <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-3">
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Activity</p>
                <p className="text-xs text-slate-700 leading-relaxed">{lesson.grammarPoint.activity}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Discussion Questions ───────────────────────────────────── */}
        <div className={sectionClass}>
          <SectionHeader id="discussion" label="Discussion Questions" emoji="💬" badge={`${lesson.discussionQuestions.length} questions`} />
          {openSection === 'discussion' && (
            <div className="border-t border-slate-100 px-4 py-4">
              <NumberedList items={lesson.discussionQuestions} />
            </div>
          )}
        </div>

        {/* ── Critical Thinking ──────────────────────────────────────── */}
        <div className={sectionClass}>
          <SectionHeader id="critical" label="Critical Thinking" emoji="🧠" />
          {openSection === 'critical' && (
            <div className="border-t border-slate-100 px-4 py-4">
              <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
                <p className="text-xs text-slate-700 leading-relaxed font-medium">{lesson.criticalThinking}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Writing Assignment ─────────────────────────────────────── */}
        <div className={sectionClass}>
          <SectionHeader id="writing" label="Writing Assignment" emoji="📝" />
          {openSection === 'writing' && (
            <div className="border-t border-slate-100 px-4 py-4">
              <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1.5">Essay Prompt</p>
                <p className="text-xs text-slate-700 leading-relaxed">{lesson.writingAssignment}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Role-play Scenario ─────────────────────────────────────── */}
        <div className={sectionClass}>
          <SectionHeader id="roleplay" label="Role-play Scenario" emoji="🎭" />
          {openSection === 'roleplay' && (
            <div className="border-t border-slate-100 px-4 py-4 space-y-3">
              {lesson.rolePlay.scenario && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Scenario</p>
                  <p className="text-xs text-slate-700 leading-relaxed">{lesson.rolePlay.scenario}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-sky-50 border border-sky-200 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wider mb-1">Role A</p>
                  <p className="text-xs text-slate-700 leading-relaxed">{lesson.rolePlay.roleA}</p>
                </div>
                <div className="bg-navy-50 border border-navy-200 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] font-bold text-navy-600 uppercase tracking-wider mb-1">Role B</p>
                  <p className="text-xs text-slate-700 leading-relaxed">{lesson.rolePlay.roleB}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Dialogue Practice ──────────────────────────────────────── */}
        <div className={sectionClass}>
          <SectionHeader id="dialogues" label="Dialogue Practice" emoji="🗣️" badge={`${lesson.dialogues.length} dialogues`} />
          {openSection === 'dialogues' && (
            <div className="border-t border-slate-100 px-4 py-4 space-y-5">
              {lesson.dialogues.map((dialogue, di) => (
                <div key={di} className="space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Dialogue {di + 1}
                  </p>
                  <div className="space-y-1.5">
                    {dialogue.lines.map((line, li) => {
                      const isA = line.speaker === 'A'
                      return (
                        <div key={li} className={`flex gap-2 ${isA ? '' : 'flex-row-reverse'}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 ${
                            isA ? 'bg-sky-100 text-sky-700' : 'bg-navy-100 text-navy-700'
                          }`}>
                            {line.speaker}
                          </div>
                          <div className={`flex-1 rounded-2xl px-3 py-2 ${
                            isA ? 'bg-sky-50 border border-sky-100 rounded-tl-none' : 'bg-navy-50 border border-navy-100 rounded-tr-none'
                          }`}>
                            <p className="text-xs text-slate-700 leading-relaxed">
                              {line.text.replace(/_{3,}/g, '').trim()}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Did You Know? ──────────────────────────────────────────── */}
        <div className={sectionClass}>
          <SectionHeader id="didyouknow" label="Did You Know?" emoji="🌍" />
          {openSection === 'didyouknow' && (
            <div className="border-t border-slate-100 px-4 py-4">
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                <p className="text-xs text-slate-700 leading-relaxed">{lesson.didYouKnow}</p>
              </div>
            </div>
          )}
        </div>

        <div className="h-2" />
      </div>
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { X, CheckCircle2, XCircle, ArrowRight, RotateCcw, Trophy, Eye } from 'lucide-react'
import type { ComprehensionQuestion } from '../types'

interface Props {
  questions: ComprehensionQuestion[]
  onClose: () => void
}

type Step = 'writing' | 'revealed'

function scoreFeedback(score: number, total: number) {
  const pct = score / total
  if (pct === 1)   return { emoji: '🏆', msg: 'Perfect! You understood everything!', color: 'text-yellow-600' }
  if (pct >= 0.75) return { emoji: '🎉', msg: 'Excellent comprehension!',            color: 'text-green-600' }
  if (pct >= 0.5)  return { emoji: '👍', msg: 'Good effort — keep reading!',          color: 'text-blue-600' }
  if (pct >= 0.25) return { emoji: '📚', msg: 'Review the summary and try again.',    color: 'text-orange-500' }
  return            { emoji: '🌱', msg: 'Re-read the lesson and give it another go!', color: 'text-red-500' }
}

export function ComprehensionExercise({ questions, onClose }: Props) {
  const [idx, setIdx]         = useState(0)
  const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(''))
  const [step, setStep]       = useState<Step>('writing')
  const [marks, setMarks]     = useState<(boolean | null)[]>(Array(questions.length).fill(null))
  const [done, setDone]       = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const current = questions[idx]
  const total   = questions.length
  const score   = marks.filter(m => m === true).length

  useEffect(() => {
    if (step === 'writing') setTimeout(() => textareaRef.current?.focus(), 50)
  }, [idx, step])

  function revealAnswer() {
    setStep('revealed')
  }

  function mark(correct: boolean) {
    const newMarks = [...marks]
    newMarks[idx] = correct
    setMarks(newMarks)

    if (idx + 1 >= total) {
      setDone(true)
    } else {
      setIdx(i => i + 1)
      setStep('writing')
    }
  }

  function restart() {
    setIdx(0)
    setAnswers(Array(questions.length).fill(''))
    setStep('writing')
    setMarks(Array(questions.length).fill(null))
    setDone(false)
  }

  function updateAnswer(val: string) {
    const next = [...answers]
    next[idx] = val
    setAnswers(next)
  }

  const progress = ((idx + (step === 'revealed' || done ? 1 : 0)) / total) * 100
  const fb = scoreFeedback(score, total)

  // ── Results screen ─────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="flex flex-col h-full bg-slate-50">
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
          <p className="text-xs font-bold text-navy-800 uppercase tracking-wide">Comprehension Results</p>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-500">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
          {/* Score card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm">
            <p className="text-5xl font-black text-navy-700">{score}<span className="text-2xl text-slate-300">/{total}</span></p>
            <p className="text-3xl mt-2">{fb.emoji}</p>
            <p className={`text-sm font-bold mt-2 ${fb.color}`}>{fb.msg}</p>
          </div>

          {/* Question breakdown */}
          <div className="space-y-3">
            {questions.map((q, i) => (
              <div key={i} className={`bg-white border rounded-2xl p-4 space-y-2 ${marks[i] ? 'border-green-200' : 'border-red-200'}`}>
                <div className="flex items-start gap-2">
                  {marks[i]
                    ? <CheckCircle2 size={15} className="text-green-500 mt-0.5 shrink-0" />
                    : <XCircle      size={15} className="text-red-400 mt-0.5 shrink-0" />}
                  <p className="text-xs font-semibold text-navy-700">{q.question}</p>
                </div>

                {answers[i] && (
                  <div className="ml-5 pl-3 border-l-2 border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Your answer</p>
                    <p className="text-xs text-slate-600 mt-0.5">{answers[i]}</p>
                  </div>
                )}

                <div className="ml-5 pl-3 border-l-2 border-navy-200">
                  <p className="text-[10px] font-bold text-navy-400 uppercase">Model answer</p>
                  <p className="text-xs text-slate-700 mt-0.5">{q.answer}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={restart}
              className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold py-2.5 rounded-xl transition-colors"
            >
              <RotateCcw size={13} /> Try Again
            </button>
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-1.5 bg-navy-700 hover:bg-navy-800 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors"
            >
              Back to Lesson
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Exercise screen ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header + progress */}
      <div className="bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs font-bold text-navy-800 uppercase tracking-wide">Comprehension Quiz</p>
            <p className="text-[10px] text-slate-400">Question {idx + 1} of {total}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-500">
            <X size={16} />
          </button>
        </div>
        <div className="h-1.5 bg-slate-100">
          <div
            className="h-full bg-navy-700 transition-all duration-500 rounded-r-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {/* Question */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Question {idx + 1}</p>
          <p className="text-sm font-semibold text-navy-800 leading-relaxed">{current.question}</p>
        </div>

        {/* Answer textarea */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Your Answer</p>
          <textarea
            ref={textareaRef}
            value={answers[idx]}
            onChange={(e) => updateAnswer(e.target.value)}
            disabled={step === 'revealed'}
            rows={4}
            placeholder="Write your answer here…"
            className="w-full bg-white border border-slate-200 focus:border-navy-500 rounded-xl px-4 py-3 text-xs text-slate-700 outline-none transition-colors resize-none placeholder:text-slate-300 disabled:opacity-70"
          />
        </div>

        {/* Reveal button */}
        {step === 'writing' && (
          <button
            onClick={revealAnswer}
            disabled={!answers[idx].trim()}
            className="w-full flex items-center justify-center gap-2 bg-white border border-navy-300 hover:bg-sky-50 disabled:opacity-40 text-navy-700 text-xs font-bold py-3 rounded-xl transition-colors"
          >
            <Eye size={13} /> Reveal Model Answer
          </button>
        )}

        {/* Model answer + self-mark */}
        {step === 'revealed' && (
          <div className="space-y-3">
            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4">
              <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wider mb-2">Model Answer</p>
              <p className="text-xs text-slate-700 leading-relaxed">{current.answer}</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-navy-800 text-center">How did you do?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => mark(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 text-xs font-bold py-3 rounded-xl transition-colors"
                >
                  <XCircle size={14} /> Need to review
                </button>
                <button
                  onClick={() => mark(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-green-50 border border-green-200 hover:bg-green-100 text-green-700 text-xs font-bold py-3 rounded-xl transition-colors"
                >
                  <CheckCircle2 size={14} />
                  {idx + 1 >= total ? (
                    <><Trophy size={13} /> Got it!</>
                  ) : (
                    <>Got it! <ArrowRight size={13} /></>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

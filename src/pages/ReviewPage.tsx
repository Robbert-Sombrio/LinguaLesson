import { useState, useEffect, useRef, useMemo } from 'react'
import { X, CheckCircle2, XCircle, Trophy } from 'lucide-react'
import { Header } from '../components/Header'
import { storage } from '../lib/storage'
import type { WordBankItem } from '../types'
import { shuffle } from '../lib/utils'

interface Props {
  onBack: () => void
  onBankUpdated: () => void
}

// Replace the first occurrence of `word` in `sentence` with ___ (case-insensitive)
function blankify(example: string, word: string): string {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const replaced = example.replace(new RegExp(escaped, 'gi'), '___')
  return replaced === example ? example : replaced
}

// ── Empty bank state ──────────────────────────────────────────────────────────
function EmptyBank({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <Header title="Word Bank" subtitle="Spaced repetition" onBack={onBack} />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4 pb-12">
        <span className="text-5xl">📖</span>
        <p className="text-sm font-bold text-navy-800">Your Word Bank is empty</p>
        <p className="text-xs text-slate-500 leading-relaxed max-w-[260px]">
          Complete vocabulary exercises — words you get wrong are automatically saved here for
          spaced repetition practice.
        </p>
        <button
          onClick={onBack}
          className="text-xs font-bold text-navy-700 border border-navy-300 rounded-xl px-5 py-2.5 hover:bg-navy-50 transition-colors"
        >
          ← Back to lessons
        </button>
      </div>
    </div>
  )
}

// ── All caught up state ───────────────────────────────────────────────────────
function AllCaughtUp({ onBack, allWords }: { onBack: () => void; allWords: WordBankItem[] }) {
  const nextDate = [...allWords].sort((a, b) => a.nextReview.localeCompare(b.nextReview))[0]?.nextReview
  const nextLabel = nextDate
    ? new Date(nextDate + 'T00:00:00').toLocaleDateString('en-GB', {
        weekday: 'short', month: 'short', day: 'numeric',
      })
    : ''

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Word Bank"
        subtitle={`${allWords.length} word${allWords.length !== 1 ? 's' : ''} saved`}
        onBack={onBack}
      />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4 pb-12">
        <span className="text-5xl">✅</span>
        <p className="text-sm font-bold text-navy-800">All caught up!</p>
        <p className="text-xs text-slate-500 leading-relaxed max-w-[260px]">
          No words are due right now. Spaced repetition is working — your brain needs time to
          consolidate before the next review.
        </p>
        {nextLabel && (
          <div className="bg-sky-50 border border-sky-100 rounded-xl px-5 py-2.5 text-center">
            <p className="text-[10px] text-sky-600 font-bold uppercase tracking-wider mb-0.5">Next review</p>
            <p className="text-sm font-bold text-navy-700">{nextLabel}</p>
          </div>
        )}
        <button
          onClick={onBack}
          className="text-xs font-bold text-navy-700 border border-navy-300 rounded-xl px-5 py-2.5 hover:bg-navy-50 transition-colors"
        >
          ← Back to lessons
        </button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function ReviewPage({ onBack, onBankUpdated }: Props) {
  const [dueWords, setDueWords]   = useState<WordBankItem[] | null>(null) // null = loading
  const [allWords, setAllWords]   = useState<WordBankItem[]>([])
  const [idx, setIdx]             = useState(0)
  const [selected, setSelected]   = useState<string | null>(null)
  const [results, setResults]     = useState<(boolean | null)[]>([])
  const [done, setDone]           = useState(false)
  const bankUpdatedRef            = useRef(false)

  useEffect(() => {
    Promise.all([storage.getDueWords(), storage.getWordBank()]).then(([due, all]) => {
      const shuffled = [...due].sort(() => Math.random() - 0.5)
      setDueWords(shuffled)
      setAllWords(all)
      setResults(Array(shuffled.length).fill(null))
    })
  }, [])

  const total   = dueWords?.length ?? 0
  const current = dueWords?.[idx]

  // Pre-generate shuffled options for every due word.
  // Distractors come from the full word bank (never the current word).
  const allOptions = useMemo(() => {
    if (!dueWords?.length) return []
    return dueWords.map((w) => {
      const pool = allWords
        .filter(b => b.word.toLowerCase() !== w.word.toLowerCase())
        .map(b => b.word)
      const wrong = shuffle(pool).slice(0, 3)
      return shuffle([w.word, ...wrong])
    })
  }, [dueWords, allWords])

  // Auto-advance 1.3 s after selection
  useEffect(() => {
    if (selected === null) return
    const timer = setTimeout(() => {
      if (idx + 1 >= total) {
        setDone(true)
      } else {
        setIdx(i => i + 1)
        setSelected(null)
      }
    }, 1300)
    return () => clearTimeout(timer)
  }, [selected, idx, total])

  // When done: persist all SR updates, then notify parent to refresh badge
  useEffect(() => {
    if (!done || bankUpdatedRef.current || !dueWords) return
    bankUpdatedRef.current = true
    Promise.all(
      dueWords.map((w, i) => storage.reviewWord(w.word, results[i] === true)),
    ).then(onBankUpdated)
  }, [done]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSelect(word: string) {
    if (selected !== null || !current) return
    const correct = word.toLowerCase() === current.word.toLowerCase()
    setSelected(word)
    const next = [...results]; next[idx] = correct
    setResults(next)
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (dueWords === null) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Word Bank" subtitle="Loading…" onBack={onBack} />
        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
          Loading your word bank…
        </div>
      </div>
    )
  }

  // ── Empty bank ────────────────────────────────────────────────────────────
  if (allWords.length === 0) return <EmptyBank onBack={onBack} />

  // ── All caught up ─────────────────────────────────────────────────────────
  if (dueWords.length === 0) return <AllCaughtUp onBack={onBack} allWords={allWords} />

  // ── Results screen ────────────────────────────────────────────────────────
  if (done) {
    const score   = results.filter(r => r === true).length
    const pct     = score / total
    const fb      =
      pct === 1   ? { emoji: '🏆', msg: 'Perfect review!',             color: 'text-yellow-600' }
      : pct >= 0.8 ? { emoji: '🎉', msg: 'Excellent work!',             color: 'text-green-600'  }
      : pct >= 0.6 ? { emoji: '👍', msg: 'Good progress!',              color: 'text-blue-600'   }
      :              { emoji: '📚', msg: "Keep at it — you'll get there!", color: 'text-orange-500' }

    // Interval ladder for showing "+Xd" badge
    const SR_INTERVALS = [1, 3, 7, 14, 30]

    return (
      <div className="flex flex-col h-full bg-slate-50">
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
          <p className="text-xs font-bold text-navy-800 uppercase tracking-wide">Review Complete</p>
          <button onClick={onBack} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {/* Score card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm">
            <p className="text-5xl font-black text-navy-700">
              {score}<span className="text-2xl text-slate-300">/{total}</span>
            </p>
            <p className="text-3xl mt-2">{fb.emoji}</p>
            <p className={`text-sm font-bold mt-2 ${fb.color}`}>{fb.msg}</p>
          </div>

          {/* SR explainer */}
          <div className="bg-sky-50 border border-sky-100 rounded-2xl px-4 py-3">
            <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wider mb-0.5">
              What happens next
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Words you got right are scheduled further into the future.
              Words you missed will return sooner.
            </p>
          </div>

          {/* Word-by-word breakdown */}
          <div className="space-y-2">
            {dueWords.map((w, i) => {
              const correct = results[i] === true
              const newReps = correct ? w.repetitions + 1 : 0
              const nextInterval = SR_INTERVALS[Math.min(newReps, SR_INTERVALS.length - 1)]
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 bg-white border rounded-xl px-4 py-3 ${
                    correct ? 'border-green-200' : 'border-red-200'
                  }`}
                >
                  {correct
                    ? <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                    : <XCircle      size={16} className="text-red-400 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-navy-700">{w.word}</p>
                    {w.pronunciation && (
                      <p className="text-[10px] font-mono text-sky-600">{w.pronunciation}</p>
                    )}
                    <p className="text-[10px] text-slate-400 truncate">{w.definition}</p>
                  </div>
                  <span className={`text-[9px] font-bold rounded-full px-2 py-0.5 shrink-0 ${
                    correct
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-red-50 border border-red-200 text-red-500'
                  }`}>
                    {correct ? `+${nextInterval}d` : 'retry ×1d'}
                  </span>
                </div>
              )
            })}
          </div>

          <button
            onClick={onBack}
            className="w-full flex items-center justify-center gap-2 bg-navy-700 hover:bg-navy-800 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
          >
            Back to Lessons
          </button>
        </div>
      </div>
    )
  }

  // ── Exercise screen ───────────────────────────────────────────────────────
  if (!current) return null

  const options       = allOptions[idx] ?? [current.word]
  const progress      = ((idx + (selected !== null ? 1 : 0)) / total) * 100
  const blankSentence = blankify(current.example, current.word)
  const isCorrect     = (opt: string) => opt.toLowerCase() === current.word.toLowerCase()

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header + progress bar */}
      <div className="bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs font-bold text-navy-800 uppercase tracking-wide">Word Bank Review</p>
            <p className="text-[10px] text-slate-400">{idx + 1} of {total} due word{total !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onBack} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500">
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

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* ── Word cloud ─────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            Today's review
          </p>
          <div className="flex flex-wrap gap-1.5">
            {dueWords.map((w, i) => (
              <span
                key={i}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                  results[i] === true  ? 'bg-green-100 border-green-300 text-green-700' :
                  results[i] === false ? 'bg-red-100 border-red-300 text-red-500 opacity-60 line-through' :
                  i === idx            ? 'bg-navy-700 border-navy-700 text-white shadow-sm' :
                                         'bg-slate-100 border-slate-200 text-slate-400'
                }`}
              >
                {results[i] === true ? '✓ ' : results[i] === false ? '✗ ' : ''}{w.word}
              </span>
            ))}
          </div>
        </div>

        {/* ── Sentence with blank ──────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Fill in the blank
          </p>
          <p className="text-sm text-navy-800 leading-relaxed font-medium">
            {blankSentence.split('___').map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span className={`inline-block border-b-2 px-3 mx-0.5 min-w-[4rem] text-center font-bold align-baseline ${
                    selected === null         ? 'border-navy-400 text-transparent' :
                    isCorrect(selected)       ? 'border-green-500 text-green-600'  :
                                               'border-red-400 text-red-500'
                  }`}>
                    {selected !== null ? current.word : '\u00a0\u00a0\u00a0'}
                  </span>
                )}
              </span>
            ))}
          </p>
        </div>

        {/* ── Definition card with lesson source ───────────────────────── */}
        <div className="bg-sky-50 border border-sky-100 rounded-2xl px-4 py-3">
          <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wider mb-1">Definition</p>
          {current.pronunciation && (
            <p className="text-[10px] font-mono font-semibold text-sky-500 tracking-wide mb-1.5">
              {current.pronunciation}
            </p>
          )}
          <p className="text-xs text-slate-700 leading-relaxed">{current.definition}</p>
          <p className="text-[9px] text-slate-400 mt-2 italic">From: {current.lessonTitle}</p>
        </div>

        {/* ── Multiple-choice buttons ───────────────────────────────────── */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-2">
            Choose the correct word
          </p>
          <div className="grid grid-cols-2 gap-2">
            {options.map(opt => {
              const answered    = selected !== null
              const isRight     = isCorrect(opt)
              const wasSelected = selected === opt
              let cls = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-navy-300'
              if (answered) {
                if (isRight)             cls = 'bg-green-50 border-green-400 text-green-800'
                else if (wasSelected)    cls = 'bg-red-50 border-red-400 text-red-700'
                else                     cls = 'bg-slate-50 border-slate-200 text-slate-400 opacity-50'
              }
              return (
                <button
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  disabled={answered}
                  className={`flex items-center justify-center gap-1.5 border rounded-xl py-3 px-2 text-xs font-bold transition-all duration-150 ${cls}`}
                >
                  {answered && isRight      && <CheckCircle2 size={13} className="shrink-0" />}
                  {answered && wasSelected  && !isRight && <XCircle size={13} className="shrink-0" />}
                  <span className="text-center leading-tight">{opt}</span>
                </button>
              )
            })}
          </div>

          {selected !== null && (
            <p className="text-center text-[10px] text-slate-400 mt-2">
              {isCorrect(selected) ? '✓ Correct!' : `✗ The word was: ${current.word}`}
              {idx + 1 < total ? ' — Next word in a moment…' : ' — Finishing…'}
            </p>
          )}
        </div>

        {/* Final word finishing indicator */}
        {idx + 1 >= total && selected !== null && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-navy-700 font-bold py-2">
            <Trophy size={14} /> Updating your Word Bank…
          </div>
        )}

      </div>
    </div>
  )
}

import { useState, useEffect, useRef, useMemo } from 'react'
import { X, CheckCircle2, XCircle, RotateCcw, Trophy } from 'lucide-react'
import type { VocabItem } from '../types'
import { storage } from '../lib/storage'

interface Props {
  vocab: VocabItem[]
  lessonTitle: string
  onClose: () => void
}

function blankify(example: string, word: string): string {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const replaced = example.replace(new RegExp(escaped, 'gi'), '___')
  return replaced === example ? example : replaced
}

function scoreFeedback(score: number, total: number) {
  const pct = score / total
  if (pct === 1)  return { emoji: '🏆', msg: 'Perfect! Every word nailed!',      color: 'text-yellow-600' }
  if (pct >= 0.8) return { emoji: '🎉', msg: 'Excellent! Almost perfect!',       color: 'text-green-600' }
  if (pct >= 0.6) return { emoji: '👍', msg: 'Good work! Keep practising.',      color: 'text-blue-600' }
  if (pct >= 0.4) return { emoji: '📚', msg: 'Nice try! Review and retry.',      color: 'text-orange-500' }
  return           { emoji: '🌱', msg: "Keep studying! You'll get there.",        color: 'text-red-500' }
}

export function VocabExercise({ vocab, lessonTitle, onClose }: Props) {
  const [idx, setIdx]           = useState(0)
  const [typed, setTyped]       = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [results, setResults]   = useState<(boolean | null)[]>(Array(vocab.length).fill(null))
  const [done, setDone]         = useState(false)
  const savedRef                = useRef(false)
  const inputRef                = useRef<HTMLInputElement>(null)

  const total        = vocab.length
  const current      = vocab[idx]
  const score        = results.filter(r => r === true).length
  const blankSentence = blankify(current.example, current.word)
  const progress     = ((idx + (selected !== null ? 1 : 0)) / total) * 100
  const fb           = scoreFeedback(score, total)
  const isCorrect    = selected !== null && selected.toLowerCase() === current.word.toLowerCase()

  // Shuffle cloud display order once so position doesn't reveal the current word
  const cloudOrder = useMemo(
    () => [...vocab.keys()].sort(() => Math.random() - 0.5),
    [vocab],
  )

  // Focus the input on each new question
  useEffect(() => {
    if (selected === null) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [idx, selected])

  // Auto-advance 1.3 s after an answer is submitted
  useEffect(() => {
    if (selected === null) return
    const timer = setTimeout(() => {
      if (idx + 1 >= total) {
        setDone(true)
      } else {
        setIdx(i => i + 1)
        setSelected(null)
        setTyped('')
      }
    }, 1300)
    return () => clearTimeout(timer)
  }, [selected, idx, total])

  // Auto-save wrong words to Word Bank when exercise finishes
  useEffect(() => {
    if (!done || savedRef.current) return
    savedRef.current = true
    const wrong = vocab.filter((_, i) => results[i] === false)
    if (wrong.length > 0) {
      storage.addWordsToBank(
        wrong.map(v => ({
          word:          v.word,
          pronunciation: v.pronunciation,
          definition:    v.definition,
          example:       v.example,
          lessonTitle,
        })),
      )
    }
  }, [done]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit() {
    if (!typed.trim() || selected !== null) return
    const correct = typed.trim().toLowerCase() === current.word.toLowerCase()
    setSelected(typed.trim())
    const next = [...results]
    next[idx]  = correct
    setResults(next)
  }

  function restart() {
    setIdx(0)
    setTyped('')
    setSelected(null)
    setResults(Array(vocab.length).fill(null))
    setDone(false)
    savedRef.current = false
  }

  // ── Results screen ────────────────────────────────────────────────────────
  if (done) {
    const wrongCount = results.filter(r => r === false).length

    return (
      <div className="flex flex-col h-full bg-slate-50">
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
          <p className="text-xs font-bold text-navy-800 uppercase tracking-wide">Vocabulary Results</p>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-500">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
          {/* Score card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm">
            <p className="text-5xl font-black text-navy-700">
              {score}<span className="text-2xl text-slate-300">/{total}</span>
            </p>
            <p className="text-3xl mt-2">{fb.emoji}</p>
            <p className={`text-sm font-bold mt-2 ${fb.color}`}>{fb.msg}</p>
          </div>

          {/* Word Bank notification */}
          {wrongCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-center">
              <p className="text-xs font-bold text-amber-700">
                🧠 {wrongCount} word{wrongCount !== 1 ? 's' : ''} added to your Word Bank
              </p>
              <p className="text-[10px] text-amber-600 mt-0.5">
                You'll be reminded to review {wrongCount !== 1 ? 'them' : 'it'} using spaced repetition
              </p>
            </div>
          )}

          {/* Word breakdown */}
          <div className="space-y-2">
            {vocab.map((v, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 bg-white border rounded-xl px-4 py-3 ${
                  results[i] ? 'border-green-200' : 'border-red-200'
                }`}
              >
                {results[i]
                  ? <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                  : <XCircle      size={16} className="text-red-400 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-navy-700">{v.word}</p>
                  <p className="text-[10px] text-slate-400 truncate">{v.definition}</p>
                </div>
              </div>
            ))}
          </div>

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

  // ── Exercise screen ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header + progress bar */}
      <div className="bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs font-bold text-navy-800 uppercase tracking-wide">Vocabulary Practice</p>
            <p className="text-[10px] text-slate-400">{idx + 1} of {total} words</p>
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

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* ── Word cloud (shuffled so order doesn't hint at the answer) ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            Vocabulary
          </p>
          <div className="flex flex-wrap gap-1.5">
            {cloudOrder.map(i => (
              <span
                key={i}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                  results[i] === true  ? 'bg-green-100 border-green-300 text-green-700' :
                  results[i] === false ? 'bg-red-100 border-red-300 text-red-500 opacity-60 line-through' :
                                         'bg-slate-100 border-slate-200 text-slate-400'
                }`}
              >
                {results[i] === true ? '✓ ' : results[i] === false ? '✗ ' : ''}{vocab[i].word}
              </span>
            ))}
          </div>
        </div>

        {/* ── Sentence with blank ─────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Fill in the blank
          </p>
          <p className="text-sm text-navy-800 leading-relaxed font-medium">
            {blankSentence.split('___').map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span
                    className={`inline-block border-b-2 px-3 mx-0.5 min-w-[4rem] text-center font-bold align-baseline ${
                      selected === null ? 'border-navy-400 text-transparent' :
                      isCorrect         ? 'border-green-500 text-green-600' :
                                          'border-red-400 text-red-500'
                    }`}
                  >
                    {selected !== null ? selected : '\u00a0\u00a0\u00a0'}
                  </span>
                )}
              </span>
            ))}
          </p>
        </div>

        {/* ── Definition (pronunciation revealed only after submission) ── */}
        <div className="bg-sky-50 border border-sky-100 rounded-2xl px-4 py-3">
          <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wider mb-1">Definition</p>
          {current.pronunciation && selected !== null && (
            <p className="text-[10px] font-mono font-semibold text-sky-500 tracking-wide mb-1.5">
              {current.pronunciation}
            </p>
          )}
          <p className="text-xs text-slate-700 leading-relaxed">{current.definition}</p>
        </div>

        {/* ── Type your answer ─────────────────────────────────────── */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-2">
            Type the missing word
          </p>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={typed}
              onChange={e => setTyped(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
              disabled={selected !== null}
              placeholder="Type the word…"
              className={`flex-1 border rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition-all ${
                selected === null
                  ? 'border-slate-200 bg-white text-navy-800 focus:border-navy-400 focus:ring-2 focus:ring-navy-100'
                  : isCorrect
                  ? 'border-green-400 bg-green-50 text-green-800'
                  : 'border-red-400 bg-red-50 text-red-700'
              }`}
            />
            <button
              onClick={handleSubmit}
              disabled={!typed.trim() || selected !== null}
              className="px-4 py-2.5 bg-navy-700 hover:bg-navy-800 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-colors"
            >
              Check
            </button>
          </div>

          {/* Feedback */}
          {selected !== null && (
            <p className="text-center text-[10px] text-slate-400 mt-2">
              {isCorrect ? '✓ Correct!' : `✗ The word was: ${current.word}`}
              {idx + 1 < total ? ' — Next word in a moment…' : ' — Finishing…'}
            </p>
          )}
        </div>

        {/* Trophy hint on last word */}
        {idx + 1 >= total && selected !== null && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-navy-700 font-bold py-2">
            <Trophy size={14} /> Calculating your score…
          </div>
        )}
      </div>
    </div>
  )
}

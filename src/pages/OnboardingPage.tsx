import { useState } from 'react'
import { ArrowRight, ArrowLeft, Eye, EyeOff, ExternalLink, CheckCircle2 } from 'lucide-react'
import { storage } from '../lib/storage'

interface Props {
  onComplete: () => void
}

const FEATURES = [
  {
    emoji: '📰',
    title: 'Lessons from any article',
    desc: 'Paste a URL, type a topic, or let the extension detect the article you\'re reading.',
  },
  {
    emoji: '🎓',
    title: 'Student & Teacher modes',
    desc: 'Students get vocabulary, comprehension and grammar. Teachers get a full 13-section lesson plan with dialogues, role-play and more.',
  },
  {
    emoji: '🧠',
    title: 'Built-in word review',
    desc: 'Words you find difficult are added to a spaced-repetition bank so you never forget them.',
  },
  {
    emoji: '🖨',
    title: 'Download for class',
    desc: 'Export a print-ready PDF or Markdown in one click — no extra tools needed.',
  },
]

export function OnboardingPage({ onComplete }: Props) {
  const [step, setStep]           = useState(0)
  const [openaiKey, setOpenaiKey] = useState('')
  const [newsKey, setNewsKey]     = useState('')
  const [showOpenai, setShowOpenai] = useState(false)
  const [showNews, setShowNews]   = useState(false)
  const [saving, setSaving]       = useState(false)

  async function handleFinish() {
    if (!openaiKey.trim()) return
    setSaving(true)
    await Promise.all([
      storage.setOpenAIKey(openaiKey.trim()),
      newsKey.trim() ? storage.setNewsApiKey(newsKey.trim()) : Promise.resolve(),
      storage.setOnboardingComplete(),
    ])
    onComplete()
  }

  const inputClass =
    'flex-1 text-xs bg-transparent outline-none text-slate-700 placeholder:text-slate-400 font-mono tracking-tight'
  const fieldClass =
    'flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3 py-3 focus-within:border-navy-500 transition-colors'

  /* ── Dots ──────────────────────────────────────────────────────────────── */
  const Dots = () => (
    <div className="flex items-center justify-center gap-1.5">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className={`rounded-full transition-all ${
            i === step ? 'w-4 h-1.5 bg-navy-700' : 'w-1.5 h-1.5 bg-slate-300'
          }`}
        />
      ))}
    </div>
  )

  /* ── Step 0: Welcome ───────────────────────────────────────────────────── */
  if (step === 0) return (
    <div className="flex flex-col h-full bg-gradient-to-b from-navy-800 to-navy-900 text-white">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-5">
        <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center text-4xl shadow-lg">
          🌍
        </div>

        <div>
          <h1 className="text-2xl font-black tracking-tight mb-2">LinguaLesson</h1>
          <p className="text-sky-200 text-sm leading-relaxed">
            Turn any news article into a complete English lesson — instantly.
          </p>
        </div>

        <div className="w-full space-y-2.5 text-left">
          {['Generate lessons from any article or topic', 'Student & teacher modes in one click', 'Export print-ready PDFs for class'].map(item => (
            <div key={item} className="flex items-center gap-3">
              <CheckCircle2 size={15} className="text-sky-400 shrink-0" />
              <span className="text-sm text-sky-100">{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 pb-8 space-y-3">
        <button
          onClick={() => setStep(1)}
          className="w-full flex items-center justify-center gap-2 bg-white text-navy-800 font-bold text-sm py-3.5 rounded-2xl hover:bg-sky-50 transition-colors"
        >
          Get started <ArrowRight size={16} />
        </button>
        <Dots />
      </div>
    </div>
  )

  /* ── Step 1: Features ──────────────────────────────────────────────────── */
  if (step === 1) return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex-1 overflow-y-auto px-5 pt-8 pb-4 space-y-4">
        <div className="mb-2">
          <h2 className="text-lg font-black text-navy-800">What can you do?</h2>
          <p className="text-xs text-slate-400 mt-0.5">Everything you need in one extension.</p>
        </div>

        {FEATURES.map(f => (
          <div key={f.title} className="flex items-start gap-3 bg-white border border-slate-200 rounded-2xl p-4">
            <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center text-xl shrink-0">
              {f.emoji}
            </div>
            <div>
              <p className="text-xs font-bold text-navy-800 mb-0.5">{f.title}</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 pb-8 space-y-3 shrink-0">
        <button
          onClick={() => setStep(2)}
          className="w-full flex items-center justify-center gap-2 bg-navy-700 hover:bg-navy-800 text-white font-bold text-sm py-3.5 rounded-2xl transition-colors"
        >
          Continue <ArrowRight size={16} />
        </button>
        <div className="flex items-center justify-between">
          <button onClick={() => setStep(0)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={13} /> Back
          </button>
          <Dots />
          <div className="w-12" />
        </div>
      </div>
    </div>
  )

  /* ── Step 2: API Keys ──────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex-1 overflow-y-auto px-5 pt-8 pb-4 space-y-5">
        <div>
          <h2 className="text-lg font-black text-navy-800">Set up your keys</h2>
          <p className="text-xs text-slate-400 mt-0.5">One-time setup — takes 30 seconds.</p>
        </div>

        {/* OpenAI — required */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">OpenAI API Key</p>
              <p className="text-[10px] text-red-400 font-semibold">Required</p>
            </div>
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-navy-600 hover:underline"
            >
              Get key <ExternalLink size={10} />
            </a>
          </div>
          <div className={fieldClass}>
            <input
              type={showOpenai ? 'text' : 'password'}
              value={openaiKey}
              onChange={e => setOpenaiKey(e.target.value)}
              placeholder="sk-…"
              className={inputClass}
              autoComplete="off"
              spellCheck={false}
            />
            <button onClick={() => setShowOpenai(v => !v)} className="text-slate-400 hover:text-slate-600 transition-colors shrink-0">
              {showOpenai ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 px-1">Powers all lesson generation using GPT-4o-mini.</p>
        </div>

        {/* NewsAPI — optional */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">NewsAPI Key</p>
              <p className="text-[10px] text-slate-400 font-semibold">Optional</p>
            </div>
            <a
              href="https://newsapi.org/register"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-navy-600 hover:underline"
            >
              Free key <ExternalLink size={10} />
            </a>
          </div>
          <div className={fieldClass}>
            <input
              type={showNews ? 'text' : 'password'}
              value={newsKey}
              onChange={e => setNewsKey(e.target.value)}
              placeholder="Your NewsAPI key…"
              className={inputClass}
              autoComplete="off"
              spellCheck={false}
            />
            <button onClick={() => setShowNews(v => !v)} className="text-slate-400 hover:text-slate-600 transition-colors shrink-0">
              {showNews ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 px-1">Browse real news by topic. Free tier: 100 req/day. Skip if you'll use URLs or topics only.</p>
        </div>

        {/* Privacy notice */}
        <div className="bg-sky-50 border border-sky-100 rounded-2xl p-3.5 flex gap-3">
          <span className="text-base shrink-0">🔒</span>
          <p className="text-[11px] text-sky-700 leading-relaxed">
            Both keys are stored only in your browser using{' '}
            <code className="bg-sky-100 px-1 rounded text-[10px]">chrome.storage.local</code>
            {' '}— never sent to any third-party server.
          </p>
        </div>
      </div>

      <div className="px-5 pb-8 space-y-3 shrink-0">
        <button
          onClick={handleFinish}
          disabled={!openaiKey.trim() || saving}
          className="w-full flex items-center justify-center gap-2 bg-navy-700 hover:bg-navy-800 disabled:opacity-40 text-white font-bold text-sm py-3.5 rounded-2xl transition-colors"
        >
          {saving ? 'Saving…' : <><CheckCircle2 size={16} /> Start using LinguaLesson</>}
        </button>
        <div className="flex items-center justify-between">
          <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={13} /> Back
          </button>
          <Dots />
          <div className="w-12" />
        </div>
      </div>
    </div>
  )
}

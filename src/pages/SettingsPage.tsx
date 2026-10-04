import { useState, useEffect } from 'react'
import { Eye, EyeOff, CheckCircle2, ExternalLink } from 'lucide-react'
import { Header } from '../components/Header'
import { storage } from '../lib/storage'

interface Props {
  onBack: () => void
}

export function SettingsPage({ onBack }: Props) {
  const [openaiKey, setOpenaiKey] = useState('')
  const [newsKey, setNewsKey] = useState('')
  const [showOpenai, setShowOpenai] = useState(false)
  const [showNews, setShowNews] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([storage.getOpenAIKey(), storage.getNewsApiKey()]).then(
      ([oKey, nKey]) => {
        setOpenaiKey(oKey)
        setNewsKey(nKey)
      },
    )
  }, [])

  async function handleSave() {
    await Promise.all([
      storage.setOpenAIKey(openaiKey.trim()),
      storage.setNewsApiKey(newsKey.trim()),
    ])
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const inputClass =
    'flex-1 text-xs bg-transparent outline-none text-slate-700 placeholder:text-slate-400 font-mono tracking-tight'

  const fieldClass =
    'flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3 py-3 focus-within:border-navy-500 transition-colors'

  return (
    <div className="flex flex-col h-full">
      <Header title="Configuration" subtitle="API Keys" onBack={onBack} />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* ── OpenAI ──────────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              OpenAI API Key
            </p>
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
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="sk-…"
              className={inputClass}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              onClick={() => setShowOpenai(!showOpenai)}
              className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
            >
              {showOpenai ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          <p className="text-[10px] text-slate-400 px-1">
            Used to generate lessons. Stored locally — never sent to our servers.
          </p>
        </div>

        {/* ── NewsAPI ─────────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              NewsAPI Key
            </p>
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
              onChange={(e) => setNewsKey(e.target.value)}
              placeholder="Your NewsAPI key…"
              className={inputClass}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              onClick={() => setShowNews(!showNews)}
              className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
            >
              {showNews ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          <p className="text-[10px] text-slate-400 px-1">
            Used to fetch real news articles. Free tier: 100 req/day.
          </p>
        </div>

        {/* ── Info box ─────────────────────────────────────────────── */}
        <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 space-y-1.5">
          <p className="text-xs font-bold text-sky-700">🔒 Your keys stay on your device</p>
          <p className="text-[11px] text-sky-600 leading-relaxed">
            Both API keys are stored only in your browser using{' '}
            <code className="bg-sky-100 px-1 rounded text-[10px]">chrome.storage.local</code>.
            They are never sent to any third-party server — only directly to OpenAI and NewsAPI.
          </p>
        </div>

        {/* ── Save button ──────────────────────────────────────────── */}
        <button
          onClick={handleSave}
          disabled={!openaiKey.trim() && !newsKey.trim()}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all ${
            saved
              ? 'bg-green-500 text-white'
              : 'bg-navy-700 hover:bg-navy-800 disabled:opacity-40 text-white'
          }`}
        >
          {saved ? (
            <><CheckCircle2 size={16} /> Saved!</>
          ) : (
            'Save Keys'
          )}
        </button>
      </div>
    </div>
  )
}

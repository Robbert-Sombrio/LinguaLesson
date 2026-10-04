import { useState, useEffect, useRef } from 'react'
import { ArrowRight, Loader2, Link2, Search, Newspaper, X, GraduationCap, BookOpen } from 'lucide-react'
import { Header } from '../components/Header'
import { TopicCard } from '../components/TopicCard'
import { LEVELS, TOPICS } from '../types'
import type { Level, TopicId, Article, LessonContent } from '../types'
import { generateLesson, generateLessonFromTopic } from '../lib/openai'
import { getArticleText } from '../lib/articleText'
import { storage } from '../lib/storage'

interface DetectedArticle {
  url: string
  title: string
  description: string
  image: string | null
  siteName: string
}

interface Props {
  level: Level
  onLevelChange: (l: Level) => void
  onTopicSelect: (topicId: TopicId) => void
  onSettings: () => void
  onLessonReady: (article: Article, content: LessonContent) => void
  onTeacherModeReady: (article: Article, sourceText: string) => void
}

type Mode = 'student' | 'teacher'

export function CreatePage({ level, onLevelChange, onTopicSelect, onSettings, onLessonReady, onTeacherModeReady }: Props) {
  const [mode, setMode]                 = useState<Mode>('student')
  const [topicInput, setTopicInput]     = useState('')
  const [urlInput, setUrlInput]         = useState('')
  const [detectedArticle, setDetectedArticle] = useState<DetectedArticle | null>(null)
  const [loadingWhat, setLoadingWhat]   = useState<'topic' | 'url' | 'detected' | null>(null)
  const [error, setError]               = useState('')
  const topicRef = useRef<HTMLInputElement>(null)

  // On mount: probe the active tab for article metadata
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0]
      if (!tab?.id || !tab.url || tab.url.startsWith('chrome://')) return

      chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_META' }, (response) => {
        if (chrome.runtime.lastError || !response) return
        if (response.isArticle && response.title && response.url) {
          setDetectedArticle({
            url:         response.url,
            title:       response.title,
            description: response.description ?? '',
            image:       response.image ?? null,
            siteName:    response.siteName ?? '',
          })
        }
      })
    })
  }, [])

  async function getOpenAIKey() {
    const key = await storage.getOpenAIKey()
    if (!key) throw new Error('Please add your OpenAI API key in Settings first.')
    return key
  }

  // Build a concise source description for teacher mode
  function buildSourceText(article: Article, extra?: string, articleText?: string | null): string {
    const parts: string[] = []
    if (article.url.startsWith('topic:')) {
      const topic = decodeURIComponent(article.url.replace('topic:', ''))
      parts.push(`Topic: ${topic}`)
    } else if (article.url.startsWith('http')) {
      parts.push(`Article URL: ${article.url}`)
    }
    if (article.title && !article.title.startsWith('http') && !article.url.startsWith('topic:')) {
      parts.push(`Title: ${article.title}`)
    }
    if (extra) parts.push(extra)
    if (articleText) parts.push(`Article text:\n${articleText}`)
    return parts.join('\n')
  }

  // ── Student mode: Generate from typed topic ─────────────────────────────────
  async function handleTopicGenerate() {
    const topic = topicInput.trim()
    if (!topic) return
    setError('')
    setLoadingWhat('topic')
    try {
      const key = await getOpenAIKey()
      const article: Article = {
        title:       `Topic: ${topic}`,
        description: `A ${level} English lesson about: ${topic}`,
        url:         `topic:${encodeURIComponent(topic)}`,
        urlToImage:  null,
        publishedAt: new Date().toISOString(),
        source:      { name: 'Custom Topic' },
      }

      if (mode === 'teacher') {
        onTeacherModeReady(article, `Topic: ${topic}`)
        return
      }

      const content = await generateLessonFromTopic(topic, level, key)
      onLessonReady(article, content)
    } catch (e) { setError((e as Error).message) }
    finally    { setLoadingWhat(null) }
  }

  // ── Student mode: Generate from pasted URL ──────────────────────────────────
  async function handleUrlGenerate() {
    const url = urlInput.trim()
    if (!url) return
    setError('')
    setLoadingWhat('url')
    try {
      // First: the permission prompt for this site needs the click's user gesture
      const read = await getArticleText(url)
      await getOpenAIKey()
      let hostname = url
      try { hostname = new URL(url).hostname.replace(/^www\./, '') } catch { /* keep raw */ }
      const article: Article = {
        title: url, description: '', url,
        urlToImage: null, publishedAt: new Date().toISOString(),
        source: { name: hostname },
      }

      if (mode === 'teacher') {
        onTeacherModeReady(article, buildSourceText(article, undefined, read?.text))
        setLoadingWhat(null)
        return
      }

      const key = await storage.getOpenAIKey()
      if (!key) throw new Error('Please add your OpenAI API key in Settings first.')
      const content = await generateLesson(article, level, key, read?.text)
      onLessonReady(article, content)
    } catch (e) { setError((e as Error).message) }
    finally    { setLoadingWhat(null) }
  }

  // ── Generate from auto-detected article ────────────────────────────────────
  async function handleDetectedGenerate() {
    if (!detectedArticle) return
    setError('')
    setLoadingWhat('detected')
    try {
      const read = await getArticleText(detectedArticle.url)
      await getOpenAIKey()
      const article: Article = {
        title:       detectedArticle.title,
        description: detectedArticle.description,
        url:         detectedArticle.url,
        urlToImage:  detectedArticle.image,
        publishedAt: new Date().toISOString(),
        source:      { name: detectedArticle.siteName },
      }

      if (mode === 'teacher') {
        onTeacherModeReady(
          article,
          buildSourceText(article, detectedArticle.description ? `Description: ${detectedArticle.description}` : '', read?.text),
        )
        setLoadingWhat(null)
        return
      }

      const key = await storage.getOpenAIKey()
      if (!key) throw new Error('Please add your OpenAI API key in Settings first.')
      const content = await generateLesson(article, level, key, read?.text)
      onLessonReady(article, content)
    } catch (e) { setError((e as Error).message) }
    finally    { setLoadingWhat(null) }
  }

  const isLoading = loadingWhat !== null

  const Divider = ({ label }: { label: string }) => (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase shrink-0">{label}</span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  )

  const isTeacher = mode === 'teacher'
  const btnLabel  = isTeacher ? 'Create Speaking Lesson' : 'Generate Lesson'
  const btnDetectedLabel = isTeacher ? 'Create Speaking Lesson from Article' : 'Generate Lesson from Article'

  return (
    <div className="flex flex-col h-full">
      <Header title="LinguaLesson" subtitle="English from the News" onSettings={onSettings} />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* ── Mode Toggle ──────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-1.5 flex gap-1.5">
          <button
            onClick={() => setMode('student')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              mode === 'student'
                ? 'bg-navy-700 text-white shadow-sm'
                : 'text-slate-500 hover:text-navy-700'
            }`}
          >
            <BookOpen size={13} />
            Student
          </button>
          <button
            onClick={() => setMode('teacher')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              mode === 'teacher'
                ? 'bg-navy-700 text-white shadow-sm'
                : 'text-slate-500 hover:text-navy-700'
            }`}
          >
            <GraduationCap size={13} />
            Teacher
          </button>
        </div>

        {/* Teacher mode description */}
        {isTeacher && (
          <div className="bg-sky-50 border border-sky-200 rounded-2xl px-4 py-3">
            <p className="text-[10px] font-bold text-sky-700 uppercase tracking-wider mb-1">
              🎓 Speaking-Focused Lesson Builder
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Generate a full C1/C2 lesson plan with warm-up, reading, vocabulary, grammar, role-play, dialogue practice and more — from any article or topic.
            </p>
          </div>
        )}

        {/* ── 1. Free-topic input ──────────────────────────────────────── */}
        <div className="bg-white border-2 border-sky-100 rounded-2xl p-4 space-y-3">
          <div>
            <p className="text-xs font-bold text-navy-800">What do you want to learn about?</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {isTeacher
                ? 'Type any topic and choose a lesson angle'
                : 'Type any topic — history, science, culture…'}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-navy-500 transition-colors">
            <Search size={13} className="text-slate-400 shrink-0" />
            <input
              ref={topicRef}
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTopicGenerate()}
              placeholder='e.g. "artificial intelligence", "climate change"'
              className="flex-1 text-xs bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={handleTopicGenerate}
            disabled={!topicInput.trim() || isLoading}
            className="w-full flex items-center justify-center gap-2 bg-navy-700 hover:bg-navy-800 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
          >
            {loadingWhat === 'topic' ? (
              <><Loader2 size={13} className="animate-spin" /> {isTeacher ? 'Preparing angles…' : 'Generating lesson…'}</>
            ) : (
              <><ArrowRight size={13} /> {btnLabel}</>
            )}
          </button>
        </div>

        {/* ── 2. Auto-detected article banner ─────────────────────────── */}
        {detectedArticle && (
          <>
            <Divider label="Or use this article" />
            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3 space-y-2">
              <div className="flex items-start gap-2">
                <Newspaper size={14} className="text-sky-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-sky-700 uppercase tracking-wide">Article detected</p>
                  <p className="text-xs font-semibold text-navy-800 leading-tight mt-0.5 line-clamp-2">
                    {detectedArticle.title}
                  </p>
                  {detectedArticle.siteName && (
                    <p className="text-[10px] text-slate-400 mt-0.5">{detectedArticle.siteName}</p>
                  )}
                </div>
                <button
                  onClick={() => setDetectedArticle(null)}
                  className="p-1 rounded-lg hover:bg-sky-100 text-sky-400 transition-colors shrink-0"
                >
                  <X size={12} />
                </button>
              </div>
              <button
                onClick={handleDetectedGenerate}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-navy-700 hover:bg-navy-800 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
              >
                {loadingWhat === 'detected' ? (
                  <><Loader2 size={13} className="animate-spin" /> {isTeacher ? 'Preparing angles…' : 'Generating lesson…'}</>
                ) : (
                  <><ArrowRight size={13} /> {btnDetectedLabel}</>
                )}
              </button>
            </div>
          </>
        )}

        {/* ── 3. Manual URL paste ──────────────────────────────────────── */}
        <Divider label={detectedArticle ? 'Or paste a URL' : 'Or use an article URL'} />
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3 py-2.5 focus-within:border-navy-500 transition-colors">
              <Link2 size={13} className="text-slate-400 shrink-0" />
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlGenerate()}
                placeholder="https://example.com/article…"
                className="flex-1 text-xs bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
              />
            </div>
            <button
              onClick={handleUrlGenerate}
              disabled={!urlInput.trim() || isLoading}
              className="flex items-center gap-1.5 bg-navy-700 hover:bg-navy-800 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-2xl transition-colors shrink-0"
            >
              {loadingWhat === 'url' ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <ArrowRight size={13} />
              )}
            </button>
          </div>
          {error && <p className="text-xs text-red-500 px-1">{error}</p>}
        </div>

        {/* ── 4. Level selector (student mode only) ───────────────────── */}
        {!isTeacher && (
          <>
            <Divider label="Or browse by topic" />
            <div>
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2">Your English Level</p>
              <div className="flex gap-2">
                {LEVELS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => onLevelChange(l.id)}
                    className={`flex-1 rounded-2xl py-3 px-2 text-center transition-all border ${
                      level === l.id
                        ? 'bg-navy-700 border-navy-700 text-white shadow-md'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-navy-400'
                    }`}
                  >
                    <p className="text-base font-black">{l.id}</p>
                    <p className={`text-[10px] leading-tight mt-0.5 ${level === l.id ? 'text-sky-200' : 'text-slate-400'}`}>
                      {l.sublabel}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2">Choose a Topic</p>
              <div className="space-y-2">
                {TOPICS.map((topic) => (
                  <TopicCard key={topic.id} topic={topic} onClick={() => onTopicSelect(topic.id)} />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Teacher mode: topic cards go to teacher flow too */}
        {isTeacher && (
          <>
            <Divider label="Or browse by topic" />
            <div>
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2">Choose a Topic</p>
              <div className="space-y-2">
                {TOPICS.map((topic) => (
                  <TopicCard key={topic.id} topic={topic} onClick={() => onTopicSelect(topic.id)} />
                ))}
              </div>
            </div>
          </>
        )}

        <div className="h-2" />
      </div>
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { Link2, ArrowRight, AlertCircle, Loader2 } from 'lucide-react'
import { Header } from '../components/Header'
import { ArticleCard } from '../components/ArticleCard'
import { TOPICS } from '../types'
import type { TopicId, Article, Level, LessonContent } from '../types'
import { fetchArticles } from '../lib/news'
import { generateLesson } from '../lib/openai'
import { getArticleText } from '../lib/articleText'
import { storage } from '../lib/storage'

interface Props {
  topicId: TopicId
  level: Level
  onBack: () => void
  onLessonReady: (article: Article, content: LessonContent) => void
}

export function ArticlesPage({ topicId, level, onBack, onLessonReady }: Props) {
  const topic = TOPICS.find((t) => t.id === topicId)!

  const [articles, setArticles] = useState<Article[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)   // article URL being generated
  const [genError, setGenError] = useState('')

  // Custom URL input state
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [customUrl, setCustomUrl] = useState('')
  const [isCustomLoading, setIsCustomLoading] = useState(false)

  const loadArticles = useCallback(async () => {
    setIsFetching(true)
    setFetchError('')
    try {
      const newsKey = await storage.getNewsApiKey()
      if (!newsKey) throw new Error('Please add your NewsAPI key in Settings.')
      const results = await fetchArticles(topic, newsKey)
      setArticles(results)
    } catch (e) {
      setFetchError((e as Error).message)
    } finally {
      setIsFetching(false)
    }
  }, [topic])

  useEffect(() => { loadArticles() }, [loadArticles])

  async function handleCreate(article: Article) {
    if (loadingId) return
    setGenError('')
    setLoadingId(article.url)
    try {
      const read = await getArticleText(article.url)
      const openaiKey = await storage.getOpenAIKey()
      if (!openaiKey) throw new Error('Please add your OpenAI API key in Settings.')
      const content = await generateLesson(article, level, openaiKey, read?.text)
      onLessonReady(article, content)
    } catch (e) {
      setGenError((e as Error).message)
    } finally {
      setLoadingId(null)
    }
  }

  async function handleCustomUrl() {
    const url = customUrl.trim()
    if (!url) return
    setIsCustomLoading(true)
    setGenError('')
    try {
      const read = await getArticleText(url)
      const openaiKey = await storage.getOpenAIKey()
      if (!openaiKey) throw new Error('Please add your OpenAI API key in Settings.')

      const article: Article = {
        title: url,
        description: '',
        url,
        urlToImage: null,
        publishedAt: new Date().toISOString(),
        source: { name: new URL(url).hostname.replace(/^www\./, '') },
      }
      const content = await generateLesson(article, level, openaiKey, read?.text)
      onLessonReady(article, content)
    } catch (e) {
      setGenError((e as Error).message)
    } finally {
      setIsCustomLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Trending News"
        subtitle={topic.label}
        onBack={onBack}
        onRefresh={loadArticles}
        isRefreshing={isFetching}
      />

      {/* Sub-heading */}
      <div className="px-4 pt-3 pb-1 shrink-0">
        <p className="text-xs text-slate-400">Select an article to generate your lesson</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {/* ── Use your own article link ──────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
              <Link2 size={15} className="text-navy-700" />
            </div>
            <span className="flex-1 text-sm font-semibold text-navy-700">
              Use your own article link
            </span>
            <ArrowRight size={15} className="text-slate-400" />
          </button>

          {showUrlInput && (
            <div className="px-4 pb-3 space-y-2 border-t border-slate-100">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://example.com/article"
                className="w-full mt-2 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-navy-500 transition-colors text-slate-700 placeholder:text-slate-400"
                autoFocus
              />
              <button
                onClick={handleCustomUrl}
                disabled={!customUrl.trim() || isCustomLoading}
                className="w-full flex items-center justify-center gap-1.5 bg-navy-700 hover:bg-navy-800 disabled:opacity-60 text-white text-xs font-bold py-2 rounded-xl transition-colors"
              >
                {isCustomLoading ? (
                  <><Loader2 size={12} className="animate-spin" /> Generating…</>
                ) : (
                  <><ArrowRight size={12} /> Create Lesson</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── Error states ─────────────────────────────────────── */}
        {genError && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-2xl px-3 py-2.5">
            <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs text-red-600">{genError}</p>
          </div>
        )}

        {fetchError && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-3 py-2.5">
            <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">{fetchError}</p>
          </div>
        )}

        {/* ── Loading skeleton ─────────────────────────────────── */}
        {isFetching && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-36 bg-slate-100" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Article cards ─────────────────────────────────────── */}
        {!isFetching && articles.map((article) => (
          <ArticleCard
            key={article.url}
            article={article}
            isLoading={loadingId === article.url}
            onCreateLesson={() => handleCreate(article)}
          />
        ))}

        {!isFetching && !fetchError && articles.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-10">
            No articles found. Try refreshing.
          </p>
        )}
      </div>
    </div>
  )
}

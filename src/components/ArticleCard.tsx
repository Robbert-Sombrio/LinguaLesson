import { Calendar, ArrowRight, Loader2 } from 'lucide-react'
import type { Article } from '../types'
import { formatDate } from '../lib/news'
import { truncate } from '../lib/utils'

interface Props {
  article: Article
  isLoading: boolean
  onCreateLesson: () => void
}

export function ArticleCard({ article, isLoading, onCreateLesson }: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      {/* Article image with source badge */}
      {article.urlToImage && (
        <div className="relative h-36 overflow-hidden bg-slate-100">
          <img
            src={article.urlToImage}
            alt={article.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
          {/* Source badge */}
          <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-navy-800 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wide">
            {article.source.name}
          </span>
        </div>
      )}

      <div className="p-3">
        {/* Title */}
        <h3 className="font-semibold text-navy-800 text-sm leading-snug mb-1">
          {truncate(article.title, 90)}
        </h3>

        {/* Description */}
        {article.description && (
          <p className="text-xs text-slate-500 leading-relaxed mb-2">
            {truncate(article.description, 110)}
          </p>
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between mt-2">
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <Calendar size={11} />
            {formatDate(article.publishedAt)}
          </span>

          <button
            onClick={onCreateLesson}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-navy-700 hover:bg-navy-800 disabled:opacity-60 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Generating…
              </>
            ) : (
              <>
                Create Lesson
                <ArrowRight size={12} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

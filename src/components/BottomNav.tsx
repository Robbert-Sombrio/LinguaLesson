import { BookOpen, Bookmark, Brain } from 'lucide-react'
import type { Tab } from '../types'

interface Props {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  reviewDueCount?: number
}

export function BottomNav({ activeTab, onTabChange, reviewDueCount = 0 }: Props) {
  const tabClass = (t: Tab) =>
    `flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
      activeTab === t
        ? 'text-navy-700 border-t-2 border-navy-700 -mt-px'
        : 'text-slate-400 hover:text-slate-600'
    }`

  return (
    <nav className="flex border-t border-slate-200 bg-white shrink-0">

      {/* ── Create ─────────────────────────────────────────────────────── */}
      <button onClick={() => onTabChange('create')} className={tabClass('create')}>
        <BookOpen size={20} />
        <span>Create</span>
      </button>

      {/* ── Review (Word Bank) ──────────────────────────────────────────── */}
      <button onClick={() => onTabChange('review')} className={tabClass('review')}>
        <div className="relative">
          <Brain size={20} />
          {reviewDueCount > 0 && (
            <span className="absolute -top-1.5 -right-2.5 text-[8px] font-black bg-red-500 text-white rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5 leading-none">
              {reviewDueCount > 99 ? '99+' : reviewDueCount}
            </span>
          )}
        </div>
        <span>Review</span>
      </button>

      {/* ── Saved ───────────────────────────────────────────────────────── */}
      <button onClick={() => onTabChange('saved')} className={tabClass('saved')}>
        <Bookmark size={20} />
        <span>Saved</span>
      </button>

    </nav>
  )
}

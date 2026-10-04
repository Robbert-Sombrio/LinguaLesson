import { ChevronRight } from 'lucide-react'
import type { Topic } from '../types'

interface Props {
  topic: Topic
  onClick: () => void
}

export function TopicCard({ topic, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 bg-white border border-slate-200 rounded-2xl p-4 text-left hover:border-navy-500 hover:shadow-md transition-all group"
    >
      {/* Emoji icon in a soft blue circle */}
      <div className="w-11 h-11 rounded-xl bg-sky-50 flex items-center justify-center text-xl shrink-0">
        {topic.emoji}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-navy-800 text-sm leading-tight">{topic.label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{topic.description}</p>
      </div>

      <ChevronRight
        size={18}
        className="text-slate-300 group-hover:text-navy-500 transition-colors shrink-0"
      />
    </button>
  )
}

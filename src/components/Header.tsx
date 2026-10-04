import { ArrowLeft, RefreshCw, Settings } from 'lucide-react'

interface Props {
  title?: string
  subtitle?: string
  onBack?: () => void
  onRefresh?: () => void
  onSettings?: () => void
  isRefreshing?: boolean
}

export function Header({
  title,
  subtitle,
  onBack,
  onRefresh,
  onSettings,
  isRefreshing = false,
}: Props) {
  return (
    <header className="flex items-center gap-2 px-4 py-3 bg-white border-b border-slate-200 shrink-0">
      {onBack && (
        <button
          onClick={onBack}
          className="p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-600"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
      )}

      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {title}
          </p>
        )}
        {subtitle && (
          <p className="text-sm font-bold text-navy-800 leading-tight">{subtitle}</p>
        )}
      </div>

      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-500 disabled:opacity-40"
          aria-label="Refresh"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      )}

      {onSettings && (
        <button
          onClick={onSettings}
          className="p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-500"
          aria-label="Settings"
        >
          <Settings size={16} />
        </button>
      )}
    </header>
  )
}

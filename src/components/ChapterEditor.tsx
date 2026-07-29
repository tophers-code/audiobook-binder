import type { ChapterMeta } from '../utils/ffmetadata'
import { formatDuration } from '../utils/audioHelpers'

interface Props {
  chapters: ChapterMeta[]
  disabled?: boolean
  onRename: (index: number, title: string) => void
}

const INPUT_CLASS =
  'flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50 transition-colors'

export default function ChapterEditor({ chapters, disabled, onRename }: Props) {
  if (chapters.length === 0) {
    return (
      <p className="text-sm text-slate-500 italic py-2">
        No chapter markers found in this file.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
      {chapters.map((ch, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-slate-600 w-5 text-right shrink-0 tabular-nums">
            {i + 1}
          </span>
          <input
            type="text"
            value={ch.title}
            onChange={e => onRename(i, e.target.value)}
            disabled={disabled}
            className={INPUT_CLASS}
          />
          <span className="text-xs text-slate-600 shrink-0 tabular-nums w-16 text-right">
            {formatDuration((ch.endMs - ch.startMs) / 1000)}
          </span>
        </div>
      ))}
    </div>
  )
}

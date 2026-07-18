import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AudioFileEntry } from '../hooks/useAudioBinder'
import { formatDuration } from '../utils/audioHelpers'

interface Props {
  entry: AudioFileEntry
  index: number
  disabled: boolean
  onRemove: (id: string) => void
  onRenameChapter: (id: string, title: string) => void
}

export default function FileListItem({ entry, index, disabled, onRemove, onRenameChapter }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.75 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 border transition-colors ${
        isDragging
          ? 'bg-slate-700 border-indigo-500 shadow-lg'
          : 'bg-slate-800 border-slate-700'
      }`}
    >
      {/* Chapter number */}
      <span className="text-slate-600 text-xs w-5 text-right flex-shrink-0 select-none">
        {index + 1}
      </span>

      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        disabled={disabled}
        className="text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 touch-none"
        aria-label="Drag to reorder"
      >
        <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
          <circle cx="2" cy="2" r="1.5" />
          <circle cx="8" cy="2" r="1.5" />
          <circle cx="2" cy="8" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="2" cy="14" r="1.5" />
          <circle cx="8" cy="14" r="1.5" />
        </svg>
      </button>

      {/* Chapter title (editable) */}
      <input
        type="text"
        value={entry.chapterTitle}
        onChange={e => onRenameChapter(entry.id, e.target.value)}
        disabled={disabled}
        placeholder="Chapter title"
        className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 focus:outline-none disabled:opacity-50 min-w-0"
      />

      {/* File size */}
      <span className="text-xs text-slate-600 flex-shrink-0 hidden sm:block">
        {(entry.file.size / 1024 / 1024).toFixed(1)} MB
      </span>

      {/* Duration */}
      <span className="text-xs text-slate-500 w-12 text-right flex-shrink-0">
        {entry.duration !== null ? formatDuration(entry.duration) : '…'}
      </span>

      {/* Remove */}
      <button
        onClick={() => onRemove(entry.id)}
        disabled={disabled}
        aria-label="Remove file"
        className="text-slate-600 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M1 1l12 12M13 1L1 13" />
        </svg>
      </button>
    </div>
  )
}

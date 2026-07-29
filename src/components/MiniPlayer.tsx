import { formatDuration } from '../utils/audioHelpers'

interface Props {
  title: string
  isPlaying: boolean
  currentTime: number
  duration: number
  onPlayPause: () => void
  onSeek: (time: number) => void
  onClose: () => void
}

export default function MiniPlayer({
  title,
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onSeek,
  onClose,
}: Props) {
  const progress = duration > 0 ? currentTime / duration : 0

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 border-t border-slate-800 backdrop-blur-sm z-50">
      <div className="max-w-2xl mx-auto px-6 py-3 flex flex-col gap-2">
        {/* Controls row */}
        <div className="flex items-center gap-3">
          {/* Play / Pause */}
          <button
            onClick={onPlayPause}
            className="text-slate-200 hover:text-white transition-colors flex-shrink-0"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 3l14 9-14 9V3z" />
              </svg>
            )}
          </button>

          {/* Title */}
          <span className="flex-1 text-sm text-slate-300 truncate">{title}</span>

          {/* Time */}
          <span className="text-xs text-slate-500 flex-shrink-0 tabular-nums">
            {formatDuration(currentTime)}
            {duration > 0 && ` / ${formatDuration(duration)}`}
          </span>

          {/* Close */}
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-400 transition-colors flex-shrink-0"
            aria-label="Close player"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        </div>

        {/* Scrubber */}
        <div className="relative flex items-center">
          {/* Track */}
          <div className="absolute left-0 right-0 h-1 bg-slate-700 rounded-full pointer-events-none">
            <div
              className="h-full bg-indigo-500 rounded-full transition-none"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={currentTime}
            onChange={e => onSeek(Number(e.target.value))}
            className="relative w-full h-1 appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0"
          />
        </div>
      </div>
    </div>
  )
}

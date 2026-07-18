import { useState, useEffect } from 'react'
import { BinderStatus } from '../hooks/useAudioBinder'

interface Props {
  status: BinderStatus
  progress: number
  label: string
  startedAt: number | null
  error: string | null
  outputUrl: string | null
  outputFilename: string
  onReset: () => void
}

function useElapsed(startedAt: number | null, active: boolean): string {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!active || startedAt === null) {
      setElapsed(0)
      return
    }
    setElapsed(Math.floor((Date.now() - startedAt) / 1000))
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [active, startedAt])

  if (elapsed < 60) return `${elapsed}s`
  const m = Math.floor(elapsed / 60)
  const s = elapsed % 60
  return `${m}m ${s}s`
}

export default function ProgressPanel({
  status,
  progress,
  label,
  startedAt,
  error,
  outputUrl,
  outputFilename,
  onReset,
}: Props) {
  const isActive = status === 'processing' || status === 'loading-ffmpeg'
  const elapsed = useElapsed(startedAt, isActive)

  if (status === 'error') {
    return (
      <div className="space-y-3">
        <div className="bg-red-950/40 border border-red-800/60 rounded-lg p-4">
          <p className="text-red-400 text-sm font-medium">Binding failed</p>
          {error && (
            <p className="text-red-500/80 text-xs mt-1.5 font-mono break-all">{error}</p>
          )}
        </div>
        <button
          onClick={onReset}
          className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors text-sm"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (status === 'done' && outputUrl) {
    return (
      <div className="space-y-3">
        <div className="bg-green-950/40 border border-green-800/60 rounded-lg p-4 text-center">
          <p className="text-green-400 font-medium">Audiobook ready</p>
        </div>
        <a
          href={outputUrl}
          download={outputFilename}
          className="block w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium text-center transition-colors"
        >
          Download {outputFilename}
        </a>
        <button
          onClick={onReset}
          className="w-full py-2 text-slate-500 hover:text-slate-300 text-sm transition-colors"
        >
          Bind another
        </button>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-slate-400 truncate pr-4">{label || 'Working...'}</span>
        <span className="text-slate-500 tabular-nums flex-shrink-0">{progress}%</span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {startedAt !== null && (
        <p className="text-xs text-slate-600 tabular-nums">
          Elapsed: {elapsed} — large audiobooks can take 30–90 min in browser
        </p>
      )}
    </div>
  )
}

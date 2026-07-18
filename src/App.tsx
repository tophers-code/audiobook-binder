import { useAudioBinder } from './hooks/useAudioBinder'
import DropZone from './components/DropZone'
import FileList from './components/FileList'
import ProgressPanel from './components/ProgressPanel'
import { formatDuration } from './utils/audioHelpers'

export default function App() {
  const binder = useAudioBinder()

  const isProcessing = binder.status === 'loading-ffmpeg' || binder.status === 'processing'
  const totalDuration = binder.files.reduce((sum, f) => sum + (f.duration ?? 0), 0)
  const outputFilename = `${binder.title.trim() || 'audiobook'}.m4b`

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
            </svg>
          </div>
          <h1 className="font-semibold text-slate-100">Audiobook Binder</h1>
        </div>

        {binder.files.length > 0 && binder.status === 'idle' && (
          <button
            onClick={binder.clearAll}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            Clear all
          </button>
        )}
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1.5 uppercase tracking-wider">
              Title
            </label>
            <input
              type="text"
              value={binder.title}
              onChange={e => binder.setTitle(e.target.value)}
              placeholder="My Audiobook"
              disabled={isProcessing}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 placeholder-slate-600 disabled:opacity-50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5 uppercase tracking-wider">
              Author
            </label>
            <input
              type="text"
              value={binder.author}
              onChange={e => binder.setAuthor(e.target.value)}
              placeholder="Author Name"
              disabled={isProcessing}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 placeholder-slate-600 disabled:opacity-50 transition-colors"
            />
          </div>
        </div>

        {/* File area */}
        {binder.files.length === 0 ? (
          <DropZone onFiles={binder.addFiles} />
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {binder.files.length} file{binder.files.length !== 1 ? 's' : ''}
                {totalDuration > 0 && ` · ${formatDuration(totalDuration)}`}
              </span>
              <span className="text-xs text-slate-600">Drag to reorder · click title to rename</span>
            </div>

            <FileList
              files={binder.files}
              disabled={isProcessing}
              onRemove={binder.removeFile}
              onReorder={binder.reorderFiles}
              onRenameChapter={binder.updateChapterTitle}
            />

            <DropZone onFiles={binder.addFiles} compact disabled={isProcessing} />
          </div>
        )}

        {/* Action area */}
        {isProcessing || binder.status === 'done' || binder.status === 'error' ? (
          <ProgressPanel
            status={binder.status}
            progress={binder.progress}
            label={binder.progressLabel}
            error={binder.error}
            outputUrl={binder.outputUrl}
            outputFilename={outputFilename}
            onReset={binder.reset}
          />
        ) : (
          <button
            onClick={binder.bind}
            disabled={binder.files.length === 0}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors text-sm"
          >
            Bind to M4B
          </button>
        )}
      </main>
    </div>
  )
}

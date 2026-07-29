import { useState } from 'react'
import { useAudioBinder } from './hooks/useAudioBinder'
import { useLocalHistory } from './hooks/useLocalHistory'
import { useAudioPlayer } from './hooks/useAudioPlayer'
import DropZone from './components/DropZone'
import FileList from './components/FileList'
import ProgressPanel from './components/ProgressPanel'
import CoverArtPicker from './components/CoverArtPicker'
import EncodingOptions from './components/EncodingOptions'
import AutocompleteInput from './components/AutocompleteInput'
import EditorPanel from './components/EditorPanel'
import MiniPlayer from './components/MiniPlayer'
import ChapterTemplate from './components/ChapterTemplate'
import { formatDuration } from './utils/audioHelpers'

type Mode = 'create' | 'edit'

const INPUT_CLASS =
  'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 placeholder-slate-600 disabled:opacity-50 transition-colors'

export default function App() {
  const [mode, setMode] = useState<Mode>('create')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const binder = useAudioBinder()
  const player = useAudioPlayer()

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const selectAll = () => setSelectedIds(new Set(binder.files.map(f => f.id)))
  const selectNone = () => setSelectedIds(new Set())

  const titleHistory   = useLocalHistory('title')
  const authorHistory  = useLocalHistory('author')
  const narratorHistory = useLocalHistory('narrator')
  const genreHistory   = useLocalHistory('genre')

  const isProcessing = binder.status === 'loading-ffmpeg' || binder.status === 'processing'
  const totalDuration = binder.files.reduce((sum, f) => sum + (f.duration ?? 0), 0)
  const estimatedMB = totalDuration > 0
    ? ((binder.bitrate * 1000 * totalDuration) / 8 / 1024 / 1024).toFixed(1)
    : null

  const handleRemoveFile = (id: string) => {
    binder.removeFile(id)
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  const handleClearAll = () => {
    binder.clearAll()
    setSelectedIds(new Set())
  }

  const handleBind = () => {
    if (binder.title.trim())    titleHistory.add(binder.title.trim())
    if (binder.author.trim())   authorHistory.add(binder.author.trim())
    if (binder.narrator.trim()) narratorHistory.add(binder.narrator.trim())
    if (binder.genre.trim())    genreHistory.add(binder.genre.trim())
    binder.bind()
  }

  const fields = [
    { label: 'Title',    value: binder.title,    onChange: binder.setTitle,    placeholder: 'My Audiobook',   history: titleHistory.history },
    { label: 'Author',   value: binder.author,   onChange: binder.setAuthor,   placeholder: 'Author Name',    history: authorHistory.history },
    { label: 'Narrator', value: binder.narrator, onChange: binder.setNarrator, placeholder: 'Narrator Name',  history: narratorHistory.history },
    { label: 'Genre',    value: binder.genre,    onChange: binder.setGenre,    placeholder: 'Audiobook',      history: genreHistory.history },
  ]

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

        <div className="flex items-center gap-4">
          {/* Mode tabs */}
          <div className="flex bg-slate-800 rounded-lg p-0.5 text-sm">
            {(['create', 'edit'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => { player.pause(); setMode(m) }}
                className={`px-3 py-1 rounded-md capitalize transition-colors ${
                  mode === m
                    ? 'bg-slate-700 text-slate-100'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {m === 'create' ? 'Create' : 'Edit'}
              </button>
            ))}
          </div>

          {mode === 'create' && binder.files.length > 0 && binder.status === 'idle' && (
            <button
              onClick={handleClearAll}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">
        {/* Edit mode — always mounted to preserve state */}
        <div className={`flex flex-col gap-6 ${mode !== 'edit' ? 'hidden' : ''}`}>
          <EditorPanel />
        </div>

        {/* Create mode — always mounted to preserve state */}
        <div className={`flex flex-col gap-6 ${mode !== 'create' ? 'hidden' : ''}`}>
        {/* Metadata row: cover art + four fields */}
        <div className="flex gap-4 items-start">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Cover</span>
            <CoverArtPicker
              previewUrl={binder.coverArtPreviewUrl}
              disabled={isProcessing}
              onFile={binder.setCoverArt}
            />
          </div>

          <div className="flex-1 grid grid-cols-2 gap-3">
            {fields.map(({ label, value, onChange, placeholder, history }) => (
              <div key={label}>
                <label className="block text-xs text-slate-500 mb-1.5 uppercase tracking-wider">
                  {label}
                </label>
                <AutocompleteInput
                  value={value}
                  onChange={onChange}
                  history={history}
                  placeholder={placeholder}
                  disabled={isProcessing}
                  inputClassName={INPUT_CLASS}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Encoding options */}
        <EncodingOptions
          bitrate={binder.bitrate}
          channels={binder.channels}
          sampleRate={binder.sampleRate}
          splitEnabled={binder.splitEnabled}
          splitHours={binder.splitHours}
          disabled={isProcessing}
          onBitrate={binder.setBitrate}
          onChannels={binder.setChannels}
          onSampleRate={binder.setSampleRate}
          onSplitEnabled={binder.setSplitEnabled}
          onSplitHours={binder.setSplitHours}
        />

        {/* File area */}
        {binder.files.length === 0 ? (
          <DropZone onFiles={binder.addFiles} />
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {binder.files.length} file{binder.files.length !== 1 ? 's' : ''}
                {totalDuration > 0 && ` · ${formatDuration(totalDuration)}`}
                {estimatedMB && ` · ~${estimatedMB} MB`}
              </span>
              <span className="text-xs text-slate-600">Drag to Reorder · Click Title to Rename</span>
            </div>

            <ChapterTemplate
              disabled={isProcessing}
              selectedCount={selectedIds.size}
              totalCount={binder.files.length}
              onApply={template => binder.applyTemplate(template, selectedIds.size > 0 ? selectedIds : undefined)}
              onSelectAll={selectAll}
              onSelectNone={selectNone}
            />

            <FileList
              files={binder.files}
              disabled={isProcessing}
              playingFile={player.currentFile}
              isPlayerPlaying={player.isPlaying}
              selectedIds={selectedIds}
              onRemove={handleRemoveFile}
              onReorder={binder.reorderFiles}
              onRenameChapter={binder.updateChapterTitle}
              onToggleSelect={toggleSelect}
              onPlayFile={entry => {
                if (player.currentFile === entry.file) {
                  player.isPlaying ? player.pause() : player.resume()
                } else {
                  player.play(entry.file, entry.chapterTitle)
                }
              }}
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
            startedAt={binder.startedAt}
            error={binder.error}
            outputFiles={binder.outputFiles}
            onReset={binder.reset}
          />
        ) : (
          <button
            onClick={handleBind}
            disabled={binder.files.length === 0}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors text-sm"
          >
            Bind to M4B
          </button>
        )}
        </div>
      </main>

      {player.currentFile && (
        <div className={mode !== 'create' ? 'hidden' : ''}>
          <MiniPlayer
            title={player.currentTitle}
            isPlaying={player.isPlaying}
            currentTime={player.currentTime}
            duration={player.duration}
            onPlayPause={() => player.isPlaying ? player.pause() : player.resume()}
            onSeek={player.seek}
            onClose={player.close}
          />
        </div>
      )}
    </div>
  )
}

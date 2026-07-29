import { useM4BEditor } from '../hooks/useM4BEditor'
import { useLocalHistory } from '../hooks/useLocalHistory'
import { useAudioPlayer } from '../hooks/useAudioPlayer'
import DropZone from './DropZone'
import CoverArtPicker from './CoverArtPicker'
import AutocompleteInput from './AutocompleteInput'
import ChapterEditor from './ChapterEditor'
import ProgressPanel from './ProgressPanel'
import MiniPlayer from './MiniPlayer'

const INPUT_CLASS =
  'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 placeholder-slate-600 disabled:opacity-50 transition-colors'

export default function EditorPanel() {
  const editor = useM4BEditor()
  const player = useAudioPlayer()

  const titleHistory    = useLocalHistory('title')
  const authorHistory   = useLocalHistory('author')
  const narratorHistory = useLocalHistory('narrator')
  const genreHistory    = useLocalHistory('genre')

  const isBusy = editor.status === 'loading-ffmpeg' || editor.status === 'reading' || editor.status === 'saving'
  const isReady = editor.status === 'ready'
  const showProgress = isBusy || editor.status === 'done' || editor.status === 'error'

  const handleFiles = (files: File[]) => {
    const m4b = files.find(
      f => f.name.toLowerCase().endsWith('.m4b') || f.type === 'audio/mp4' || f.type === 'video/mp4',
    )
    if (m4b) editor.loadFile(m4b)
  }

  const handleSave = () => {
    if (editor.title.trim())    titleHistory.add(editor.title.trim())
    if (editor.author.trim())   authorHistory.add(editor.author.trim())
    if (editor.narrator.trim()) narratorHistory.add(editor.narrator.trim())
    if (editor.genre.trim())    genreHistory.add(editor.genre.trim())
    editor.save()
  }

  const fields = [
    { label: 'Title',    value: editor.title,    onChange: editor.setTitle,    placeholder: 'My Audiobook',  history: titleHistory.history },
    { label: 'Author',   value: editor.author,   onChange: editor.setAuthor,   placeholder: 'Author Name',   history: authorHistory.history },
    { label: 'Narrator', value: editor.narrator, onChange: editor.setNarrator, placeholder: 'Narrator Name', history: narratorHistory.history },
    { label: 'Genre',    value: editor.genre,    onChange: editor.setGenre,    placeholder: 'Audiobook',     history: genreHistory.history },
  ]

  // No file loaded yet
  if (editor.status === 'idle') {
    return (
      <DropZone
        onFiles={handleFiles}
        accept=".m4b,audio/mp4,video/mp4"
        multiple={false}
        label="Drop an M4B file here"
        sublabel="or click to browse — metadata and chapters will be extracted"
      />
    )
  }

  // Loading / reading / extracting
  if (editor.status === 'loading-ffmpeg' || editor.status === 'reading') {
    return (
      <div className="flex flex-col gap-3">
        <div className="text-sm text-slate-400">{editor.progressLabel || 'Loading...'}</div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${editor.progress}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* File header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {/* Preview play/pause */}
          <button
            onClick={() => {
              if (!editor.inputFile) return
              if (player.currentFile === editor.inputFile) {
                player.isPlaying ? player.pause() : player.resume()
              } else {
                player.play(editor.inputFile, editor.inputFile.name)
              }
            }}
            className={`transition-colors shrink-0 ${
              player.currentFile === editor.inputFile && player.isPlaying
                ? 'text-indigo-400 hover:text-indigo-300'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            aria-label="Preview audio"
          >
            {player.currentFile === editor.inputFile && player.isPlaying ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 3l14 9-14 9V3z" />
              </svg>
            )}
          </button>
          <svg className="text-slate-600 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" />
          </svg>
          <span className="text-sm text-slate-400 truncate">{editor.inputFile?.name}</span>
        </div>
        {isReady && (
          <button
            onClick={() => { player.close(); editor.clearAll() }}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors shrink-0 ml-3"
          >
            Change file
          </button>
        )}
      </div>

      {/* Metadata */}
      <div className="flex gap-4 items-start">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-500 uppercase tracking-wider">Cover</span>
          <CoverArtPicker
            previewUrl={editor.coverArtPreviewUrl}
            disabled={isBusy}
            onFile={editor.setCoverArt}
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
                disabled={isBusy}
                inputClassName={INPUT_CLASS}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Chapters */}
      {(isReady || showProgress) && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Chapters</span>
            {editor.chapters.length > 0 && (
              <span className="text-xs text-slate-600">{editor.chapters.length} chapters</span>
            )}
          </div>
          <ChapterEditor
            chapters={editor.chapters}
            disabled={isBusy}
            onRename={editor.updateChapterTitle}
          />
        </div>
      )}

      {/* Action */}
      {showProgress ? (
        <ProgressPanel
          status={editor.status === 'saving' ? 'processing' : editor.status === 'done' ? 'done' : 'error'}
          progress={editor.progress}
          label={editor.progressLabel}
          startedAt={editor.startedAt}
          error={editor.error}
          outputFiles={
            editor.outputUrl
              ? [{ url: editor.outputUrl, filename: editor.outputFilename }]
              : []
          }
          onReset={editor.reset}
        />
      ) : (
        <button
          onClick={handleSave}
          disabled={!isReady}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors text-sm"
        >
          Save M4B
        </button>
      )}

      {player.currentFile && (
        <MiniPlayer
          title={player.currentTitle}
          isPlaying={player.isPlaying}
          currentTime={player.currentTime}
          duration={player.duration}
          onPlayPause={() => player.isPlaying ? player.pause() : player.resume()}
          onSeek={player.seek}
          onClose={player.close}
        />
      )}
    </div>
  )
}

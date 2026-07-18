import { useState, useCallback, useRef, useEffect } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import { getAudioDuration, sanitizeFilename } from '../utils/audioHelpers'
import { buildFFMetadata } from '../utils/ffmetadata'

export interface AudioFileEntry {
  id: string
  file: File
  chapterTitle: string
  safeFilename: string
  duration: number | null
}

export type BinderStatus = 'idle' | 'loading-ffmpeg' | 'processing' | 'done' | 'error'

export function useAudioBinder() {
  const [files, setFiles] = useState<AudioFileEntry[]>([])
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [status, setStatus] = useState<BinderStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const ffmpegRef = useRef<FFmpeg | null>(null)
  const outputUrlRef = useRef<string | null>(null)

  // Keep refs in sync so the stable `bind` callback can read latest values
  const filesRef = useRef(files)
  const titleRef = useRef(title)
  const authorRef = useRef(author)
  useEffect(() => { filesRef.current = files }, [files])
  useEffect(() => { titleRef.current = title }, [title])
  useEffect(() => { authorRef.current = author }, [author])

  const addFiles = useCallback((newFiles: File[]) => {
    const mp3Files = newFiles.filter(
      f => f.type === 'audio/mpeg' || f.name.toLowerCase().endsWith('.mp3'),
    )
    if (mp3Files.length === 0) return

    const ts = Date.now()
    const entries: AudioFileEntry[] = mp3Files.map((file, i) => ({
      id: `${ts}-${i}-${file.name}`,
      file,
      chapterTitle: file.name.replace(/\.mp3$/i, ''),
      safeFilename: `input_${ts}_${i}_${sanitizeFilename(file.name)}`,
      duration: null,
    }))

    setFiles(prev => [...prev, ...entries])

    for (const entry of entries) {
      getAudioDuration(entry.file)
        .then(duration =>
          setFiles(prev => prev.map(f => (f.id === entry.id ? { ...f, duration } : f))),
        )
        .catch(() => {})
    }
  }, [])

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }, [])

  const reorderFiles = useCallback((activeId: string, overId: string) => {
    setFiles(prev => {
      const oldIdx = prev.findIndex(f => f.id === activeId)
      const newIdx = prev.findIndex(f => f.id === overId)
      if (oldIdx === -1 || newIdx === -1) return prev
      const next = [...prev]
      const [moved] = next.splice(oldIdx, 1)
      next.splice(newIdx, 0, moved)
      return next
    })
  }, [])

  const updateChapterTitle = useCallback((id: string, chapterTitle: string) => {
    setFiles(prev => prev.map(f => (f.id === id ? { ...f, chapterTitle } : f)))
  }, [])

  const bind = useCallback(async () => {
    const currentFiles = filesRef.current
    const currentTitle = titleRef.current
    const currentAuthor = authorRef.current

    if (currentFiles.length === 0) return

    if (outputUrlRef.current) {
      URL.revokeObjectURL(outputUrlRef.current)
      outputUrlRef.current = null
    }

    setError(null)
    setOutputUrl(null)
    setStatus('loading-ffmpeg')
    setProgress(0)
    setProgressLabel('Loading FFmpeg...')

    try {
      if (!ffmpegRef.current) {
        const ffmpeg = new FFmpeg()
        await ffmpeg.load({
          coreURL: '/ffmpeg/ffmpeg-core.js',
          wasmURL: '/ffmpeg/ffmpeg-core.wasm',
        })
        ffmpegRef.current = ffmpeg
      }

      const ffmpeg = ffmpegRef.current

      // Track encode progress via time position in FFmpeg log output
      const totalDurationSec = currentFiles.reduce((sum, f) => sum + (f.duration ?? 0), 0)
      const handleLog = ({ message }: { message: string }) => {
        const match = message.match(/time=(\d+):(\d+):(\d+\.\d+)/)
        if (match && totalDurationSec > 0) {
          const secs =
            parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseFloat(match[3])
          const p = 35 + Math.round((secs / totalDurationSec) * 58)
          setProgress(Math.min(p, 93))
        }
      }
      ffmpeg.on('log', handleLog)

      setStatus('processing')
      setProgress(5)

      // Write input files into FFmpeg virtual FS
      for (let i = 0; i < currentFiles.length; i++) {
        const entry = currentFiles[i]
        setProgressLabel(`Loading file ${i + 1} of ${currentFiles.length}...`)
        setProgress(5 + Math.round((i / currentFiles.length) * 25))
        await ffmpeg.writeFile(entry.safeFilename, await fetchFile(entry.file))
      }

      setProgress(30)
      setProgressLabel('Computing chapter times...')

      // Resolve durations (may already be cached in state)
      const durations = await Promise.all(
        currentFiles.map(entry =>
          entry.duration !== null ? Promise.resolve(entry.duration) : getAudioDuration(entry.file),
        ),
      )

      // Build FFMETADATA with chapter markers
      let cursorMs = 0
      const chapters = currentFiles.map((entry, i) => {
        const startMs = cursorMs
        cursorMs += (durations[i] ?? 0) * 1000
        return { title: entry.chapterTitle, startMs, endMs: cursorMs }
      })

      const metadata = buildFFMetadata(currentTitle, currentAuthor, chapters)
      await ffmpeg.writeFile('metadata.txt', metadata)

      const concatList = currentFiles.map(f => `file '${f.safeFilename}'`).join('\n')
      await ffmpeg.writeFile('filelist.txt', concatList)

      setProgress(35)
      setProgressLabel('Encoding audiobook...')

      await ffmpeg.exec([
        '-f', 'concat',
        '-safe', '0',
        '-i', 'filelist.txt',
        '-i', 'metadata.txt',
        '-map_metadata', '1',
        '-map_chapters', '1',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-f', 'mp4',
        '-movflags', '+faststart',
        'output.m4b',
      ])

      ffmpeg.off('log', handleLog)

      setProgress(95)
      setProgressLabel('Preparing download...')

      const data = (await ffmpeg.readFile('output.m4b')) as Uint8Array
      const blob = new Blob([data.buffer as ArrayBuffer], { type: 'audio/mp4' })
      const url = URL.createObjectURL(blob)
      outputUrlRef.current = url

      // Clean up virtual FS
      for (const entry of currentFiles) {
        await ffmpeg.deleteFile(entry.safeFilename).catch(() => {})
      }
      await ffmpeg.deleteFile('filelist.txt').catch(() => {})
      await ffmpeg.deleteFile('metadata.txt').catch(() => {})
      await ffmpeg.deleteFile('output.m4b').catch(() => {})

      setProgress(100)
      setProgressLabel('Done!')
      setOutputUrl(url)
      setStatus('done')
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      setStatus('error')
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setProgress(0)
    setProgressLabel('')
    setError(null)
    setOutputUrl(null)
  }, [])

  const clearAll = useCallback(() => {
    if (outputUrlRef.current) {
      URL.revokeObjectURL(outputUrlRef.current)
      outputUrlRef.current = null
    }
    setFiles([])
    setTitle('')
    setAuthor('')
    setStatus('idle')
    setProgress(0)
    setProgressLabel('')
    setError(null)
    setOutputUrl(null)
  }, [])

  return {
    files,
    title,
    author,
    status,
    progress,
    progressLabel,
    outputUrl,
    error,
    addFiles,
    removeFile,
    reorderFiles,
    updateChapterTitle,
    setTitle,
    setAuthor,
    bind,
    reset,
    clearAll,
  }
}

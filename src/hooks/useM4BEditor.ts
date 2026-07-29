import { useState, useCallback, useRef, useEffect } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import { prepareImageForFFmpeg } from '../utils/audioHelpers'
import { buildFFMetadata, parseFFMetadata } from '../utils/ffmetadata'
import type { ChapterMeta } from '../utils/ffmetadata'

export type EditorStatus = 'idle' | 'loading-ffmpeg' | 'reading' | 'ready' | 'saving' | 'done' | 'error'

export function useM4BEditor() {
  const [inputFile, setInputFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [narrator, setNarrator] = useState('')
  const [genre, setGenre] = useState('')
  const [chapters, setChapters] = useState<ChapterMeta[]>([])
  const [coverArt, setCoverArtFile] = useState<File | null>(null)
  const [coverArtPreviewUrl, setCoverArtPreviewUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<EditorStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const [outputFilename, setOutputFilename] = useState('edited.m4b')
  const [error, setError] = useState<string | null>(null)

  const ffmpegRef = useRef<FFmpeg | null>(null)
  const inputLoadedRef = useRef(false)
  const outputUrlRef = useRef<string | null>(null)
  const coverArtPreviewUrlRef = useRef<string | null>(null)

  // Refs for stable save callback
  const titleRef = useRef(title)
  const authorRef = useRef(author)
  const narratorRef = useRef(narrator)
  const genreRef = useRef(genre)
  const chaptersRef = useRef(chapters)
  const coverArtRef = useRef(coverArt)
  const outputFilenameRef = useRef(outputFilename)
  useEffect(() => { titleRef.current = title }, [title])
  useEffect(() => { authorRef.current = author }, [author])
  useEffect(() => { narratorRef.current = narrator }, [narrator])
  useEffect(() => { genreRef.current = genre }, [genre])
  useEffect(() => { chaptersRef.current = chapters }, [chapters])
  useEffect(() => { coverArtRef.current = coverArt }, [coverArt])
  useEffect(() => { outputFilenameRef.current = outputFilename }, [outputFilename])

  const setCoverArt = useCallback((file: File | null) => {
    if (coverArtPreviewUrlRef.current) {
      URL.revokeObjectURL(coverArtPreviewUrlRef.current)
      coverArtPreviewUrlRef.current = null
    }
    setCoverArtFile(file)
    if (file) {
      const url = URL.createObjectURL(file)
      coverArtPreviewUrlRef.current = url
      setCoverArtPreviewUrl(url)
    } else {
      setCoverArtPreviewUrl(null)
    }
  }, [])

  const updateChapterTitle = useCallback((index: number, newTitle: string) => {
    setChapters(prev => prev.map((ch, i) => i === index ? { ...ch, title: newTitle } : ch))
  }, [])

  const loadFile = useCallback(async (file: File) => {
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
          coreURL: await toBlobURL('/ffmpeg/ffmpeg-core.js', 'text/javascript'),
          wasmURL: '/ffmpeg/ffmpeg-core.wasm',
        })
        ffmpegRef.current = ffmpeg
      }

      const ffmpeg = ffmpegRef.current

      // Clean up previous input if any
      if (inputLoadedRef.current) {
        await ffmpeg.deleteFile('input.m4b').catch(() => {})
        inputLoadedRef.current = false
      }

      setStatus('reading')
      setProgress(5)
      setProgressLabel(`Loading ${file.name}...`)

      await ffmpeg.writeFile('input.m4b', await fetchFile(file))
      inputLoadedRef.current = true

      setProgress(40)
      setProgressLabel('Extracting metadata...')

      // Extract FFMETADATA — may exit non-zero but still write the file
      try {
        await ffmpeg.exec(['-y', '-i', 'input.m4b', '-f', 'ffmetadata', 'meta_out.txt'])
      } catch { /* intentional */ }

      let parsed = { title: '', author: '', narrator: '', genre: '', chapters: [] as ChapterMeta[] }
      try {
        const metaBytes = await ffmpeg.readFile('meta_out.txt') as Uint8Array
        parsed = parseFFMetadata(new TextDecoder().decode(metaBytes))
        await ffmpeg.deleteFile('meta_out.txt').catch(() => {})
      } catch { /* no metadata file written */ }

      setProgress(65)
      setProgressLabel('Extracting cover art...')

      // Try to extract cover art (fails silently if none)
      let extractedCover: File | null = null
      try {
        await ffmpeg.exec(['-y', '-i', 'input.m4b', '-an', '-vframes', '1', 'cover_extracted.jpg'])
        const coverBytes = await ffmpeg.readFile('cover_extracted.jpg') as Uint8Array
        if (coverBytes.length > 100) {
          extractedCover = new File([coverBytes.buffer as ArrayBuffer], 'cover.jpg', { type: 'image/jpeg' })
        }
        await ffmpeg.deleteFile('cover_extracted.jpg').catch(() => {})
      } catch { /* no cover art */ }

      setProgress(90)

      setInputFile(file)
      setOutputFilename(file.name)
      setTitle(parsed.title)
      setAuthor(parsed.author)
      setNarrator(parsed.narrator)
      setGenre(parsed.genre || 'Audiobook')
      setChapters(parsed.chapters)
      setCoverArt(extractedCover)

      setProgress(100)
      setProgressLabel('')
      setStatus('ready')
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to load file')
      setStatus('error')
    }
  }, [setCoverArt])

  const save = useCallback(async () => {
    const currentTitle = titleRef.current
    const currentAuthor = authorRef.current
    const currentNarrator = narratorRef.current
    const currentGenre = genreRef.current
    const currentChapters = chaptersRef.current
    const currentCoverArt = coverArtRef.current

    if (outputUrlRef.current) {
      URL.revokeObjectURL(outputUrlRef.current)
      outputUrlRef.current = null
    }

    setError(null)
    setOutputUrl(null)
    setStatus('saving')
    setProgress(0)
    setProgressLabel('Preparing metadata...')
    setStartedAt(Date.now())

    try {
      const ffmpeg = ffmpegRef.current!

      const metadata = buildFFMetadata(
        currentTitle, currentAuthor, currentNarrator, currentGenre, currentChapters,
      )
      await ffmpeg.writeFile('new_meta.txt', metadata)

      if (currentCoverArt) {
        setProgressLabel('Processing cover art...')
        const coverBytes = await prepareImageForFFmpeg(currentCoverArt)
        await ffmpeg.writeFile('cover.jpg', coverBytes)
      }

      setProgress(10)
      setProgressLabel('Saving audiobook...')

      const metaIndex = currentCoverArt ? 2 : 1
      const args: string[] = ['-y', '-i', 'input.m4b']

      if (currentCoverArt) {
        args.push('-i', 'cover.jpg')
      }

      args.push('-i', 'new_meta.txt')
      args.push('-map', '0:a:0')

      if (currentCoverArt) {
        args.push('-map', '1:v:0')
      }

      args.push(
        '-map_metadata', String(metaIndex),
        '-map_chapters', String(metaIndex),
        '-c', 'copy',
      )

      if (currentCoverArt) {
        args.push('-disposition:v:0', 'attached_pic')
      }

      args.push('-f', 'mp4', '-movflags', '+faststart', 'output.m4b')

      await ffmpeg.exec(args)

      setProgress(90)
      setProgressLabel('Preparing download...')

      const data = (await ffmpeg.readFile('output.m4b')) as Uint8Array
      const blob = new Blob([data.buffer as ArrayBuffer], { type: 'audio/mp4' })
      const url = URL.createObjectURL(blob)
      outputUrlRef.current = url

      await ffmpeg.deleteFile('new_meta.txt').catch(() => {})
      await ffmpeg.deleteFile('output.m4b').catch(() => {})
      if (currentCoverArt) await ffmpeg.deleteFile('cover.jpg').catch(() => {})

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
    setStatus('ready')
    setProgress(0)
    setProgressLabel('')
    setStartedAt(null)
    setError(null)
    if (outputUrlRef.current) {
      URL.revokeObjectURL(outputUrlRef.current)
      outputUrlRef.current = null
    }
    setOutputUrl(null)
  }, [])

  const clearAll = useCallback(async () => {
    if (outputUrlRef.current) {
      URL.revokeObjectURL(outputUrlRef.current)
      outputUrlRef.current = null
    }
    if (coverArtPreviewUrlRef.current) {
      URL.revokeObjectURL(coverArtPreviewUrlRef.current)
      coverArtPreviewUrlRef.current = null
    }
    if (ffmpegRef.current && inputLoadedRef.current) {
      await ffmpegRef.current.deleteFile('input.m4b').catch(() => {})
      inputLoadedRef.current = false
    }
    setInputFile(null)
    setTitle('')
    setAuthor('')
    setNarrator('')
    setGenre('')
    setChapters([])
    setCoverArtFile(null)
    setCoverArtPreviewUrl(null)
    setStatus('idle')
    setProgress(0)
    setProgressLabel('')
    setStartedAt(null)
    setError(null)
    setOutputUrl(null)
    setOutputFilename('edited.m4b')
  }, [])

  return {
    inputFile,
    title,
    author,
    narrator,
    genre,
    chapters,
    coverArtPreviewUrl,
    status,
    progress,
    progressLabel,
    startedAt,
    outputUrl,
    outputFilename,
    error,
    setTitle,
    setAuthor,
    setNarrator,
    setGenre,
    setCoverArt,
    updateChapterTitle,
    loadFile,
    save,
    reset,
    clearAll,
  }
}

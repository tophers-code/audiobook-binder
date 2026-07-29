import { useState, useCallback, useRef, useEffect } from 'react'

export interface AudioPlayerState {
  currentFile: File | null
  currentTitle: string
  isPlaying: boolean
  currentTime: number
  duration: number
  play: (file: File, title: string) => void
  pause: () => void
  resume: () => void
  seek: (time: number) => void
  close: () => void
}

export function useAudioPlayer(): AudioPlayerState {
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [currentTitle, setCurrentTitle] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  useEffect(() => {
    const audio = new Audio()
    audioRef.current = audio

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onDurationChange = () => setDuration(isFinite(audio.duration) ? audio.duration : 0)
    const onEnded = () => setIsPlaying(false)
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)

    return () => {
      audio.pause()
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [])

  const play = useCallback((file: File, title: string) => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
    }
    const url = URL.createObjectURL(file)
    objectUrlRef.current = url
    const audio = audioRef.current!
    audio.src = url
    audio.currentTime = 0
    audio.play().catch(console.error)
    setCurrentFile(file)
    setCurrentTitle(title)
    setCurrentTime(0)
    setDuration(0)
  }, [])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const resume = useCallback(() => {
    audioRef.current?.play().catch(console.error)
  }, [])

  const seek = useCallback((time: number) => {
    if (audioRef.current) audioRef.current.currentTime = time
  }, [])

  const close = useCallback(() => {
    const audio = audioRef.current!
    audio.pause()
    audio.src = ''
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setCurrentFile(null)
    setCurrentTitle('')
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
  }, [])

  return { currentFile, currentTitle, isPlaying, currentTime, duration, play, pause, resume, seek, close }
}

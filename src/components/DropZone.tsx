import { useCallback, useRef, useState } from 'react'

interface Props {
  onFiles: (files: File[]) => void
  compact?: boolean
  disabled?: boolean
}

export default function DropZone({ onFiles, compact = false, disabled = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      if (disabled) return
      onFiles(Array.from(e.dataTransfer.files))
    },
    [onFiles, disabled],
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragOver(true)
  }

  const handleDragLeave = () => setIsDragOver(false)

  const handleClick = () => {
    if (!disabled) inputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFiles(Array.from(e.target.files))
      e.target.value = ''
    }
  }

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept=".mp3,audio/mpeg"
      multiple
      onChange={handleChange}
      className="hidden"
    />
  )

  if (compact) {
    return (
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={`border border-dashed rounded-lg py-3 text-center text-sm cursor-pointer transition-colors ${
          isDragOver
            ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
            : 'border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400'
        } ${disabled ? 'pointer-events-none opacity-30' : ''}`}
      >
        {input}
        Drop or click to add more MP3 files
      </div>
    )
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      className={`border-2 border-dashed rounded-xl p-20 text-center cursor-pointer transition-colors ${
        isDragOver
          ? 'border-indigo-500 bg-indigo-500/5'
          : 'border-slate-700 hover:border-slate-500'
      }`}
    >
      {input}
      <div className="mb-3">
        <svg
          className="mx-auto text-slate-600"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
        </svg>
      </div>
      <p className="text-slate-300 font-medium mb-1">Drop MP3 files here</p>
      <p className="text-slate-500 text-sm">or click to browse — each file becomes a chapter</p>
    </div>
  )
}

import { useRef, useState } from 'react'

interface Props {
  previewUrl: string | null
  disabled?: boolean
  onFile: (file: File | null) => void
}

export default function CoverArtPicker({ previewUrl, disabled = false, onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file.type.startsWith('image/')) return
    onFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (!disabled) handleFiles(e.dataTransfer.files)
  }

  const handleClick = () => {
    if (!disabled) inputRef.current?.click()
  }

  if (previewUrl) {
    return (
      <div className="relative w-[88px] h-[88px] flex-shrink-0">
        <img
          src={previewUrl}
          alt="Cover art"
          className="w-full h-full object-cover rounded-lg"
        />
        {!disabled && (
          <button
            onClick={() => onFile(null)}
            aria-label="Remove cover art"
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-600 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1 1l6 6M7 1L1 7" />
            </svg>
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={e => { e.preventDefault(); if (!disabled) setIsDragOver(true) }}
      onDragLeave={() => setIsDragOver(false)}
      onClick={handleClick}
      className={`w-[88px] h-[88px] flex-shrink-0 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
        isDragOver
          ? 'border-indigo-500 bg-indigo-500/5'
          : 'border-slate-700 hover:border-slate-500'
      } ${disabled ? 'pointer-events-none opacity-30' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={e => handleFiles(e.target.files)}
        className="hidden"
      />
      <svg className="text-slate-600" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
      <span className="text-slate-600 text-[10px] text-center leading-tight">Cover<br/>Art</span>
    </div>
  )
}

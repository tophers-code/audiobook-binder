import { useState, useRef, useEffect } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  history: string[]
  placeholder?: string
  disabled?: boolean
  inputClassName?: string
}

export default function AutocompleteInput({
  value,
  onChange,
  history,
  placeholder,
  disabled,
  inputClassName,
}: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = history.filter(
    h => !value.trim() || h.toLowerCase().includes(value.toLowerCase()),
  )
  const showDropdown = open && filtered.length > 0

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClassName}
      />

      {showDropdown && (
        <ul className="absolute z-20 left-0 right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden max-h-52 overflow-y-auto">
          {filtered.map(item => (
            <li
              key={item}
              onMouseDown={e => {
                e.preventDefault() // keep focus on input, allow click to register
                onChange(item)
                setOpen(false)
              }}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                item === value
                  ? 'bg-indigo-600/20 text-indigo-300'
                  : 'text-slate-300 hover:bg-slate-700/70'
              }`}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

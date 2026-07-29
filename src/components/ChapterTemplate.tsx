import { useState } from 'react'

interface Props {
  disabled?: boolean
  onApply: (template: string) => void
}

const TOKENS = [
  { token: '%N', desc: 'number' },
  { token: '%n', desc: 'padded' },
  { token: '%t', desc: 'title' },
  { token: '%a', desc: 'author' },
  { token: '%f', desc: 'filename' },
]

export default function ChapterTemplate({ disabled, onApply }: Props) {
  const [template, setTemplate] = useState('')

  const handleApply = () => onApply(template)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleApply()
  }

  const insertToken = (token: string) => {
    setTemplate(prev => prev + token)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <input
          type="text"
          value={template}
          onChange={e => setTemplate(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Chapter template, e.g. Chapter %N or %n. %f"
          disabled={disabled}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 placeholder-slate-600 disabled:opacity-50 transition-colors"
        />
        <button
          onClick={handleApply}
          disabled={disabled}
          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm text-slate-200 transition-colors shrink-0"
        >
          Apply
        </button>
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-xs text-slate-600 mr-1">Insert:</span>
        {TOKENS.map(({ token, desc }) => (
          <button
            key={token}
            onClick={() => insertToken(token)}
            disabled={disabled}
            title={desc}
            className="px-1.5 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-slate-700"
          >
            {token}
          </button>
        ))}
        <span className="text-xs text-slate-600 ml-1">
          — or leave blank to reset to filenames
        </span>
      </div>
    </div>
  )
}

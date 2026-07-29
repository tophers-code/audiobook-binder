const BITRATES = [32, 48, 64, 96, 128, 192, 256] as const
const SAMPLE_RATES = [22050, 44100, 48000] as const

interface Props {
  bitrate: number
  channels: 1 | 2
  sampleRate: number
  splitEnabled: boolean
  splitHours: number
  disabled: boolean
  onBitrate: (v: number) => void
  onChannels: (v: 1 | 2) => void
  onSampleRate: (v: number) => void
  onSplitEnabled: (v: boolean) => void
  onSplitHours: (v: number) => void
}

export default function EncodingOptions({
  bitrate,
  channels,
  sampleRate,
  splitEnabled,
  splitHours,
  disabled,
  onBitrate,
  onChannels,
  onSampleRate,
  onSplitEnabled,
  onSplitHours,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-xs text-slate-500 mb-1.5 uppercase tracking-wider">
            Channels
          </label>
          <div className="flex rounded-lg overflow-hidden border border-slate-700">
            {([1, 2] as const).map(ch => (
              <button
                key={ch}
                onClick={() => onChannels(ch)}
                disabled={disabled}
                className={`flex-1 py-2 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  channels === ch
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {ch === 1 ? 'Mono' : 'Stereo'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <label className="block text-xs text-slate-500 mb-1.5 uppercase tracking-wider">
            Bitrate
          </label>
          <select
            value={bitrate}
            onChange={e => onBitrate(Number(e.target.value))}
            disabled={disabled}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50 transition-colors appearance-none"
          >
            {BITRATES.map(b => (
              <option key={b} value={b}>
                {b} kbps{b === 64 && channels === 1 ? ' (recommended)' : b === 128 && channels === 2 ? ' (recommended)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-xs text-slate-500 mb-1.5 uppercase tracking-wider">
            Sample Rate
          </label>
          <select
            value={sampleRate}
            onChange={e => onSampleRate(Number(e.target.value))}
            disabled={disabled}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50 transition-colors appearance-none"
          >
            {SAMPLE_RATES.map(r => (
              <option key={r} value={r}>
                {(r / 1000).toFixed(r % 1000 === 0 ? 0 : 3).replace(/\.?0+$/, '')} kHz
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Volume splitting */}
      <div className="flex items-center gap-3 border-t border-slate-800 pt-3">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div
            role="checkbox"
            aria-checked={splitEnabled}
            onClick={() => !disabled && onSplitEnabled(!splitEnabled)}
            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            } ${splitEnabled ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600 bg-transparent hover:border-slate-400'}`}
          >
            {splitEnabled && (
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1.5 4.5L3.5 6.5L7.5 2.5" />
              </svg>
            )}
          </div>
          <span className={`text-sm ${splitEnabled ? 'text-slate-300' : 'text-slate-500'} transition-colors`}>
            Split into volumes
          </span>
        </label>

        {splitEnabled && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={splitHours}
              onChange={e => {
                const v = parseFloat(e.target.value)
                if (!isNaN(v) && v > 0) onSplitHours(v)
              }}
              min="0.5"
              max="24"
              step="0.5"
              disabled={disabled}
              className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50 transition-colors"
            />
            <span className="text-sm text-slate-500">hrs max per volume</span>
          </div>
        )}
      </div>
    </div>
  )
}

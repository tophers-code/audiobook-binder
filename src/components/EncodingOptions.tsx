const BITRATES = [32, 48, 64, 96, 128, 192, 256] as const
const SAMPLE_RATES = [22050, 44100, 48000] as const

interface Props {
  bitrate: number
  channels: 1 | 2
  sampleRate: number
  disabled: boolean
  onBitrate: (v: number) => void
  onChannels: (v: 1 | 2) => void
  onSampleRate: (v: number) => void
}

export default function EncodingOptions({
  bitrate,
  channels,
  sampleRate,
  disabled,
  onBitrate,
  onChannels,
  onSampleRate,
}: Props) {
  return (
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
  )
}

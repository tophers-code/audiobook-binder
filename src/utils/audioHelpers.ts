export function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = document.createElement('audio')
    const url = URL.createObjectURL(file)
    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url)
      resolve(audio.duration)
    })
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Could not read duration for: ${file.name}`))
    })
    audio.src = url
  })
}

export function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '--:--'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

// Resize and convert cover art to JPEG via Canvas before passing to FFmpeg.
// FFmpeg.wasm can't safely handle large RGBA PNGs due to swscale memory limits.
export function prepareImageForFFmpeg(file: File, maxDimension = 800): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight))
      const w = Math.round(img.naturalWidth * scale)
      const h = Math.round(img.naturalHeight * scale)

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
      ctx.drawImage(img, 0, 0, w, h)

      canvas.toBlob(
        blob => {
          if (!blob) { reject(new Error('Failed to convert cover image')); return }
          blob.arrayBuffer().then(buf => resolve(new Uint8Array(buf))).catch(reject)
        },
        'image/jpeg',
        0.92,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load cover image'))
    }

    img.src = url
  })
}

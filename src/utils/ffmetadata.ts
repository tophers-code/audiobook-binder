export interface ChapterMeta {
  title: string
  startMs: number
  endMs: number
}

export interface ParsedFFMetadata {
  title: string
  author: string
  narrator: string
  genre: string
  chapters: ChapterMeta[]
}

export function parseFFMetadata(text: string): ParsedFFMetadata {
  const lines = text.split('\n')
  let inChapter = false
  let chapterTitle = '', chapterStart = 0, chapterEnd = 0, chapterTimescale = 1000
  const chapters: ChapterMeta[] = []
  let title = '', author = '', narrator = '', genre = ''

  const unescape = (s: string) => s.replace(/\\([=;#\\])/g, '$1')

  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith(';')) continue

    if (line.startsWith('[')) {
      if (inChapter) {
        chapters.push({
          title: chapterTitle,
          startMs: Math.round(chapterStart * 1000 / chapterTimescale),
          endMs: Math.round(chapterEnd * 1000 / chapterTimescale),
        })
      }
      inChapter = line.toUpperCase() === '[CHAPTER]'
      chapterTitle = ''
      chapterStart = 0
      chapterEnd = 0
      chapterTimescale = 1000
      continue
    }

    const eqIdx = line.indexOf('=')
    if (eqIdx < 0) continue
    const key = line.substring(0, eqIdx).trim().toLowerCase()
    const value = unescape(line.substring(eqIdx + 1))

    if (inChapter) {
      if (key === 'title') chapterTitle = value
      else if (key === 'start') chapterStart = parseInt(value, 10)
      else if (key === 'end') chapterEnd = parseInt(value, 10)
      else if (key === 'timebase') {
        // e.g. "1/1000" → timescale denominator = 1000 ticks/second
        const parts = value.split('/')
        const den = Number(parts[1])
        if (den > 0) chapterTimescale = den
      }
    } else {
      if (key === 'title') title = value
      else if (key === 'artist') author = value
      else if (key === 'composer') narrator = value
      else if (key === 'genre') genre = value
    }
  }

  if (inChapter) {
    chapters.push({
      title: chapterTitle,
      startMs: Math.round(chapterStart * 1000 / chapterTimescale),
      endMs: Math.round(chapterEnd * 1000 / chapterTimescale),
    })
  }

  return { title, author, narrator, genre, chapters }
}

export function buildFFMetadata(
  title: string,
  author: string,
  narrator: string,
  genre: string,
  chapters: ChapterMeta[],
): string {
  const lines: string[] = [';FFMETADATA1']

  if (title) lines.push(`title=${esc(title)}`)
  if (author) {
    lines.push(`artist=${esc(author)}`)
    lines.push(`album_artist=${esc(author)}`)
    lines.push(`album=${esc(title || 'Audiobook')}`)
  }
  if (narrator) lines.push(`composer=${esc(narrator)}`)
  lines.push(`genre=${esc(genre || 'Audiobook')}`)
  lines.push('')

  for (const ch of chapters) {
    lines.push('[CHAPTER]')
    lines.push('TIMEBASE=1/1000')
    lines.push(`START=${Math.round(ch.startMs)}`)
    lines.push(`END=${Math.round(ch.endMs)}`)
    lines.push(`title=${esc(ch.title)}`)
    lines.push('')
  }

  return lines.join('\n')
}

function esc(str: string): string {
  return str.replace(/([=;#\\])/g, '\\$1')
}

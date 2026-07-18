export interface ChapterMeta {
  title: string
  startMs: number
  endMs: number
}

export function buildFFMetadata(
  title: string,
  author: string,
  chapters: ChapterMeta[],
): string {
  const lines: string[] = [';FFMETADATA1']

  if (title) lines.push(`title=${esc(title)}`)
  if (author) {
    lines.push(`artist=${esc(author)}`)
    lines.push(`album_artist=${esc(author)}`)
    lines.push(`album=${esc(title || 'Audiobook')}`)
  }
  lines.push('genre=Audiobook')
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

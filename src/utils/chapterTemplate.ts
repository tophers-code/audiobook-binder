export function applyChapterTemplate(
  template: string,
  index: number,
  total: number,
  filename: string,
  bookTitle: string,
  author: string,
): string {
  const pad = String(total).length
  return template
    .replace(/%N/g, String(index + 1))
    .replace(/%n/g, String(index + 1).padStart(pad, '0'))
    .replace(/%t/g, bookTitle)
    .replace(/%a/g, author)
    .replace(/%f/g, filename)
}

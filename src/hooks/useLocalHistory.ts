import { useState, useCallback } from 'react'

const MAX = 10

export function useLocalHistory(key: string) {
  const storageKey = `abb:history:${key}`

  const [history, setHistory] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? '[]')
    } catch {
      return []
    }
  })

  const add = useCallback(
    (value: string) => {
      const v = value.trim()
      if (!v) return
      setHistory(prev => {
        const next = [v, ...prev.filter(x => x !== v)].slice(0, MAX)
        try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch {}
        return next
      })
    },
    [storageKey],
  )

  return { history, add }
}

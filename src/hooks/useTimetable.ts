import { useState, useEffect } from 'react'

export interface TimetableBlock {
  id: string
  dayOfWeek: number   // 0=Sun … 6=Sat
  startTime: string   // 'HH:MM'
  endTime: string     // 'HH:MM'
  label: string
  color: string
}

const STORAGE_KEY = 'peer-watch-timetable'

const DEFAULT_COLORS = [
  '#C4B5FD', '#A5F3FC', '#BBF7D0', '#FDE68A', '#FECACA', '#DDD6FE',
]

export function useTimetable() {
  const [blocks, setBlocks] = useState<TimetableBlock[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as TimetableBlock[]) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks))
  }, [blocks])

  function addBlock(block: Omit<TimetableBlock, 'id'>) {
    setBlocks((prev) => [
      ...prev,
      { ...block, id: crypto.randomUUID() },
    ])
  }

  function removeBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id))
  }

  function updateBlock(id: string, updates: Partial<Omit<TimetableBlock, 'id'>>) {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    )
  }

  return { blocks, addBlock, removeBlock, updateBlock, DEFAULT_COLORS }
}

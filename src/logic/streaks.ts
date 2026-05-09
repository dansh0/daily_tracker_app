import { getTodayDate } from '../utils/date'

interface EntryStub {
  date: string  // YYYY-MM-DD
  score: number
}

// Expects entries sorted descending by date.
// Streak = consecutive days ending today (or yesterday if today not yet complete)
// where score >= 0.5 (mandatory completed).
export function calculateStreak(recentEntries: EntryStub[]): number {
  if (recentEntries.length === 0) return 0

  const today = getTodayDate()
  let streak = 0
  let expectedDate = today

  for (const entry of recentEntries) {
    if (entry.date !== expectedDate) break
    if (entry.score < 0.5) break
    streak++
    expectedDate = offsetDate(expectedDate, -1)
  }

  return streak
}

function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00') // noon avoids DST edge cases
  d.setDate(d.getDate() + days)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

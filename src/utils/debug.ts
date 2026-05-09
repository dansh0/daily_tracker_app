import { getDb } from '../repository/db'
import { entries } from '../repository'
import { getTodayDate } from './date'

export async function getDebugSummary(): Promise<string> {
  const today = getTodayDate()
  const entry = await entries.getEntryByDate(today)
  const recent = await entries.getRecentEntries(7)

  const lines: string[] = [`date: ${today}`]

  if (!entry) {
    lines.push('today: no entry')
  } else {
    lines.push(`score: ${entry.score}`)
    lines.push(`streak: ${entry.streak_day}`)
    lines.push(`mandatory: ${JSON.stringify(entry.mandatory_data)}`)
    const optKeys = Object.keys(entry.optional_data)
    lines.push(`optionals: ${optKeys.length > 0 ? optKeys.join(', ') : 'none'}`)
  }

  lines.push(`\nrecent entries (${recent.length}):`)
  for (const e of recent) {
    lines.push(`  ${e.date}  score=${e.score}  streak=${e.streak_day}`)
  }

  return lines.join('\n')
}

export async function resetToday(): Promise<void> {
  const today = getTodayDate()
  const db = getDb()
  await db.runAsync('DELETE FROM daily_entries WHERE date = ?', [today])
}

import { getDb } from './db'
import { DailyEntry, DailyEntryRow } from '../types'
import { generateId, nowIso } from '../utils/date'

function rowToEntry(row: DailyEntryRow): DailyEntry {
  return {
    id: row.id,
    date: row.date,
    mandatory_data: JSON.parse(row.mandatory_data),
    optional_data: JSON.parse(row.optional_data),
    score: row.score,
    streak_day: row.streak_day,
    metadata: JSON.parse(row.metadata),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function getEntryByDate(date: string): Promise<DailyEntry | null> {
  const db = getDb()
  const row = await db.getFirstAsync<DailyEntryRow>(
    'SELECT * FROM daily_entries WHERE date = ?',
    [date]
  )
  return row ? rowToEntry(row) : null
}

export async function getRecentEntries(n: number): Promise<DailyEntry[]> {
  const db = getDb()
  const rows = await db.getAllAsync<DailyEntryRow>(
    'SELECT * FROM daily_entries ORDER BY date DESC LIMIT ?',
    [n]
  )
  return rows.map(rowToEntry)
}

export async function saveEntry(entry: Omit<DailyEntry, 'id' | 'created_at' | 'updated_at'>): Promise<DailyEntry> {
  const db = getDb()
  const now = nowIso()
  const id = generateId()
  const full: DailyEntry = { ...entry, id, created_at: now, updated_at: now }

  await db.runAsync(
    `INSERT INTO daily_entries
       (id, date, mandatory_data, optional_data, score, streak_day, metadata, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      full.id,
      full.date,
      JSON.stringify(full.mandatory_data),
      JSON.stringify(full.optional_data),
      full.score,
      full.streak_day,
      JSON.stringify(full.metadata),
      full.created_at,
      full.updated_at,
    ]
  )
  return full
}

export async function updateEntry(
  id: string,
  patch: Partial<Omit<DailyEntry, 'id' | 'created_at'>>
): Promise<void> {
  const db = getDb()
  const existing = await db.getFirstAsync<DailyEntryRow>(
    'SELECT * FROM daily_entries WHERE id = ?',
    [id]
  )
  if (!existing) throw new Error(`Entry ${id} not found`)

  const merged = rowToEntry(existing)
  const updated: DailyEntry = {
    ...merged,
    ...patch,
    mandatory_data: patch.mandatory_data ?? merged.mandatory_data,
    optional_data: patch.optional_data ?? merged.optional_data,
    metadata: patch.metadata ?? merged.metadata,
    updated_at: nowIso(),
  }

  await db.runAsync(
    `UPDATE daily_entries
     SET mandatory_data=?, optional_data=?, score=?, streak_day=?, metadata=?, updated_at=?
     WHERE id=?`,
    [
      JSON.stringify(updated.mandatory_data),
      JSON.stringify(updated.optional_data),
      updated.score,
      updated.streak_day,
      JSON.stringify(updated.metadata),
      updated.updated_at,
      id,
    ]
  )
}

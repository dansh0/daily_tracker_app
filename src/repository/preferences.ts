import { getDb } from './db'
import { nowIso } from '../utils/date'

export async function getPreference(key: string): Promise<string | null> {
  const db = getDb()
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM user_preferences WHERE key = ?',
    [key]
  )
  return row?.value ?? null
}

export async function setPreference(key: string, value: string): Promise<void> {
  const db = getDb()
  await db.runAsync(
    `INSERT INTO user_preferences (key, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`,
    [key, value, nowIso()]
  )
}

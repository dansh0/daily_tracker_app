import { getDb } from './db'
import { UsageLogEntry, PageUsageRecord } from '../types'

const MAX_LOG_ENTRIES = 10

interface PageUsageRow {
  module_id: string
  usage_log: string
}

export async function getPageUsage(moduleId: string): Promise<PageUsageRecord> {
  const db = getDb()
  const row = await db.getFirstAsync<PageUsageRow>(
    'SELECT * FROM page_usage WHERE module_id = ?',
    [moduleId]
  )
  return {
    module_id: moduleId,
    usage_log: row ? (JSON.parse(row.usage_log) as UsageLogEntry[]) : [],
  }
}

export async function appendPageUsage(
  moduleId: string,
  entry: UsageLogEntry
): Promise<void> {
  const db = getDb()
  const current = await getPageUsage(moduleId)
  const updated = [entry, ...current.usage_log].slice(0, MAX_LOG_ENTRIES)

  await db.runAsync(
    `INSERT INTO page_usage (module_id, usage_log)
     VALUES (?, ?)
     ON CONFLICT(module_id) DO UPDATE SET usage_log=excluded.usage_log`,
    [moduleId, JSON.stringify(updated)]
  )
}

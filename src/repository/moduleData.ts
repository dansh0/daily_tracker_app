import { getDb } from './db'
import { DynamicButtonItem } from '../types'
import { nowIso } from '../utils/date'

interface ModuleDataRow {
  module_id: string
  data_key: string
  data: string
  updated_at: string
}

export async function getModuleData<T>(moduleId: string, key: string): Promise<T | null> {
  const db = getDb()
  const row = await db.getFirstAsync<ModuleDataRow>(
    'SELECT * FROM user_module_data WHERE module_id = ? AND data_key = ?',
    [moduleId, key]
  )
  return row ? (JSON.parse(row.data) as T) : null
}

export async function setModuleData<T>(moduleId: string, key: string, data: T): Promise<void> {
  const db = getDb()
  await db.runAsync(
    `INSERT INTO user_module_data (module_id, data_key, data, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(module_id, data_key) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at`,
    [moduleId, key, JSON.stringify(data), nowIso()]
  )
}

// Increments use_count and updates last_used for a specific item in a dynamic button grid.
export async function updateItemUsage(
  moduleId: string,
  key: string,
  itemId: string
): Promise<void> {
  const existing = await getModuleData<{ items: DynamicButtonItem[] }>(moduleId, key)
  if (!existing) return

  const today = new Date()
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const items = existing.items.map((item) =>
    item.id === itemId
      ? { ...item, use_count: item.use_count + 1, last_used: dateStr }
      : item
  )
  await setModuleData(moduleId, key, { items })
}

// Adds a new item to a dynamic button grid's persisted list.
export async function addDynamicItem(
  moduleId: string,
  key: string,
  label: string
): Promise<DynamicButtonItem> {
  const existing = await getModuleData<{ items: DynamicButtonItem[] }>(moduleId, key)
  const id = label.toLowerCase().replace(/\s+/g, '_')
  const newItem: DynamicButtonItem = { id, label, use_count: 0, last_used: null }
  const items = [...(existing?.items ?? []), newItem]
  await setModuleData(moduleId, key, { items })
  return newItem
}

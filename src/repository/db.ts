import { openDatabaseSync, SQLiteDatabase } from 'expo-sqlite'

let _db: SQLiteDatabase | null = null

export function getDb(): SQLiteDatabase {
  if (!_db) {
    throw new Error('Database not initialised — call initDb() first')
  }
  return _db
}

export function initDb(): void {
  if (_db) return
  _db = openDatabaseSync('tracker.db')
  _db.execSync(`
    CREATE TABLE IF NOT EXISTS daily_entries (
      id             TEXT PRIMARY KEY,
      date           TEXT UNIQUE NOT NULL,
      mandatory_data TEXT NOT NULL,
      optional_data  TEXT NOT NULL DEFAULT '{}',
      score          REAL NOT NULL DEFAULT 0,
      streak_day     INTEGER NOT NULL DEFAULT 0,
      metadata       TEXT NOT NULL DEFAULT '{}',
      created_at     TEXT NOT NULL,
      updated_at     TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_module_data (
      module_id   TEXT NOT NULL,
      data_key    TEXT NOT NULL,
      data        TEXT NOT NULL DEFAULT '{}',
      updated_at  TEXT NOT NULL,
      PRIMARY KEY (module_id, data_key)
    );

    CREATE TABLE IF NOT EXISTS page_usage (
      module_id    TEXT PRIMARY KEY,
      usage_log    TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)
}

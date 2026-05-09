// ─── Field types ──────────────────────────────────────────────────────────────

export type FieldType =
  | 'SLIDER'
  | 'BUTTON_GRID'
  | 'SINGLE_SELECT'
  | 'TEXT_INPUT'
  | 'TIME_PICKER'
  | 'NUMBER_INPUT'

export type ModuleTier = 'mandatory' | 'preferred' | 'optional'

export interface SliderConfig {
  min: number
  max: number
  step: number
  defaultValue: number
  showValue: boolean
  unit?: string
  labels?: string[]  // evenly-bucketed labels shown instead of the raw number
}

export interface ButtonItem {
  id: string
  label: string
}

export interface DynamicButtonItem extends ButtonItem {
  use_count: number
  last_used: string | null // YYYY-MM-DD
}

export interface ButtonGridConfig {
  multiSelect: boolean
  dynamicItems?: boolean
  staticItems?: ButtonItem[]
  itemsKey?: string
  sortStrategy?: 'recent_first' | 'common_first' | 'alpha'
  allowAdd?: boolean
  columns?: number
}

export interface SelectOption {
  id: string
  label: string
  numericValue?: number
}

export interface SingleSelectConfig {
  options: SelectOption[]
  defaultValue: string | number | null
}

export interface TextInputConfig {
  placeholder?: string
  maxLength?: number
}

export interface NumberInputConfig {
  min: number
  max: number
  unit?: string
}

export type FieldConfig =
  | SliderConfig
  | ButtonGridConfig
  | SingleSelectConfig
  | TextInputConfig
  | NumberInputConfig

export interface ModuleField {
  id: string
  type: FieldType
  label: string
  config: FieldConfig
}

export interface ModuleDefinition {
  id: string
  label: string
  tier: ModuleTier
  icon: string
  fields: ModuleField[]
  scoring: {
    basePoints: number
    bonusPoints?: { condition: string; points: number } | null
  }
}

// ─── Daily entry ──────────────────────────────────────────────────────────────

export interface MandatoryData {
  satisfaction: number | null
  mood: number | null
  stress: number | null
}

export interface OptionalData {
  [moduleId: string]: Record<string, unknown> & { completed_at?: string }
}

export interface EntryMetadata {
  app_version: string
  pages_viewed: string[]
  session_started_at?: string
  session_completed_at?: string
}

export interface DailyEntry {
  id: string
  date: string // YYYY-MM-DD
  mandatory_data: MandatoryData
  optional_data: OptionalData
  score: number
  streak_day: number
  metadata: EntryMetadata
  created_at: string // ISO8601
  updated_at: string // ISO8601
}

// Raw SQLite row shape before JSON parsing
export interface DailyEntryRow {
  id: string
  date: string
  mandatory_data: string
  optional_data: string
  score: number
  streak_day: number
  metadata: string
  created_at: string
  updated_at: string
}

// ─── Module data ──────────────────────────────────────────────────────────────

export interface UsageLogEntry {
  date: string // YYYY-MM-DD
  completed: boolean
}

export interface PageUsageRecord {
  module_id: string
  usage_log: UsageLogEntry[]
}

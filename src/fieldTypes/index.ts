import { FieldType } from '../types'

export const FIELD_TYPES: Record<FieldType, { valueType: 'number' | 'string' | 'array' }> = {
  SLIDER:        { valueType: 'number' },
  BUTTON_GRID:   { valueType: 'array' },
  SINGLE_SELECT: { valueType: 'string' },
  TEXT_INPUT:    { valueType: 'string' },
  TIME_PICKER:   { valueType: 'string' },
  NUMBER_INPUT:  { valueType: 'number' },
} as const

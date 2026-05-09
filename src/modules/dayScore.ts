import { ModuleDefinition } from '../types'

export const dayScoreModule: ModuleDefinition = {
  id: 'day_score',
  label: 'How was today?',
  tier: 'mandatory',
  icon: '',
  fields: [
    {
      id: 'satisfaction',
      type: 'SLIDER',
      label: 'Overall satisfaction',
      config: { min: 0, max: 100, step: 1, defaultValue: 50, showValue: true },
    },
  ],
  scoring: { basePoints: 0 }, // mandatory score is handled by calculateScore base
}

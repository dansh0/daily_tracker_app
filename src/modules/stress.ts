import { ModuleDefinition } from '../types'

export const stressModule: ModuleDefinition = {
  id: 'stress',
  label: 'Stress',
  tier: 'mandatory',
  icon: '',
  fields: [
    {
      id: 'stress',
      type: 'SLIDER',
      label: 'Stress',
      config: {
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 50,
        showValue: false,
        labels: ['Very Stressed', 'Stressed', 'Busy', 'Chill', 'Relaxed'],
      },
    },
  ],
  scoring: { basePoints: 0 },
}

import { ModuleDefinition } from '../types'

export const moodModule: ModuleDefinition = {
  id: 'mood',
  label: 'Mood',
  tier: 'mandatory',
  icon: '',
  fields: [
    {
      id: 'mood',
      type: 'SLIDER',
      label: 'Mood',
      config: {
        min: 0,
        max: 100,
        step: 5,
        defaultValue: 50,
        showValue: false,
        labels: ['Horrible', 'Bad', 'Neutral', 'Good', 'Excellent'],
      },
    },
  ],
  scoring: { basePoints: 0 },
}

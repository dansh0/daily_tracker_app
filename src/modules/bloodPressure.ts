import { ModuleDefinition } from '../types'

export const bloodPressureModule: ModuleDefinition = {
  id: 'blood_pressure',
  label: 'Blood Pressure',
  tier: 'optional',
  icon: '',
  fields: [
    {
      id: 'systolic',
      type: 'SLIDER',
      label: 'Systolic',
      config: { min: 70, max: 200, step: 5, defaultValue: 120, showValue: true, unit: 'mmHg' },
    },
    {
      id: 'diastolic',
      type: 'SLIDER',
      label: 'Diastolic',
      config: { min: 40, max: 130, step: 5, defaultValue: 80, showValue: true, unit: 'mmHg' },
    },
    {
      id: 'when_taken',
      type: 'SINGLE_SELECT',
      label: 'When taken',
      config: {
        options: [
          { id: 'morning', label: 'Morning' },
          { id: 'midday',  label: 'Midday'  },
          { id: 'evening', label: 'Evening' },
        ],
        defaultValue: null,
      },
    },
  ],
  scoring: { basePoints: 0.25 },
}

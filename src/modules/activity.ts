import { ModuleDefinition } from '../types'

export const activityModule: ModuleDefinition = {
  id: 'activity',
  label: 'Activity',
  tier: 'optional',
  icon: '',
  fields: [
    {
      id: 'activities_done',
      type: 'BUTTON_GRID',
      label: 'What did you do today?',
      config: {
        multiSelect: true,
        dynamicItems: true,
        itemsKey: 'user_activities',
        sortStrategy: 'recent_first',
        allowAdd: true,
        columns: 3,
      },
    },
  ],
  scoring: { basePoints: 0.25 },
}

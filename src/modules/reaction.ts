import { ModuleDefinition } from '../types'
import { FODMAP_CATEGORIES } from '../constants/defaults'

export const reactionModule: ModuleDefinition = {
  id: 'reaction',
  label: 'IBS / Reaction',
  tier: 'optional',
  icon: '',
  fields: [
    {
      id: 'had_reaction',
      type: 'SINGLE_SELECT',
      label: 'Did you have a reaction today?',
      config: {
        options: [
          { id: 'yes', label: 'Yes' },
          { id: 'no',  label: 'No'  },
        ],
        defaultValue: null,
      },
    },
    {
      id: 'fodmap_categories',
      type: 'BUTTON_GRID',
      label: 'FODMAP categories eaten (last 24 hrs)',
      config: {
        multiSelect: true,
        dynamicItems: false,
        staticItems: FODMAP_CATEGORIES,
        columns: 3,
      },
    },
  ],
  scoring: { basePoints: 0.25 },
}

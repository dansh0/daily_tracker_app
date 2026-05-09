import { DynamicButtonItem, ButtonItem } from '../types'

export const DEFAULT_ACTIVITIES: DynamicButtonItem[] = [
  { id: 'gym',   label: 'Gym',   use_count: 0, last_used: null },
  { id: 'run',   label: 'Run',   use_count: 0, last_used: null },
  { id: 'craft', label: 'Craft', use_count: 0, last_used: null },
  { id: 'read',  label: 'Read',  use_count: 0, last_used: null },
]

export const FODMAP_CATEGORIES: ButtonItem[] = [
  { id: 'fructans',               label: 'Fructans'    }, // wheat, onion, garlic
  { id: 'gos',                    label: 'GOS'         }, // legumes, beans
  { id: 'lactose',                label: 'Lactose'     }, // dairy
  { id: 'excess_fructose',        label: 'Fructose'    }, // apples, honey, HFCS
  { id: 'sorbitol',               label: 'Sorbitol'    }, // stone fruits
  { id: 'mannitol',               label: 'Mannitol'    }, // mushrooms, cauliflower
  { id: 'polyols_other',          label: 'Polyols'     },
  { id: 'fos',                    label: 'FOS'         },
  { id: 'galos',                  label: 'GalOS'       },
]

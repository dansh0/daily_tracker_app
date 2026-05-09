import { dayScoreModule } from './dayScore'
import { moodModule } from './mood'
import { stressModule } from './stress'
import { activityModule } from './activity'
import { reactionModule } from './reaction'
import { bloodPressureModule } from './bloodPressure'
import { ModuleDefinition } from '../types'

export const MODULE_REGISTRY: Record<string, ModuleDefinition> = {
  // Mandatory — rendered in this order
  day_score:      dayScoreModule,
  mood:           moodModule,
  stress:         stressModule,

  // Optional — Alpha set
  activity:       activityModule,
  reaction:       reactionModule,
  blood_pressure: bloodPressureModule,
}

export const MANDATORY_MODULES = Object.values(MODULE_REGISTRY).filter(
  (m) => m.tier === 'mandatory'
)

export const OPTIONAL_MODULES = Object.values(MODULE_REGISTRY).filter(
  (m) => m.tier === 'optional' || m.tier === 'preferred'
)

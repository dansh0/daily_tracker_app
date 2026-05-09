import { PageUsageRecord } from '../types'

const PROMOTION_THRESHOLD = 3
const PROMOTION_WINDOW = 5
const DEMOTION_CONSECUTIVE_SKIPS = 3

// Returns module ids that should be promoted to 'preferred' for this session.
export function getPromotedModules(
  usageLogs: Record<string, PageUsageRecord>
): string[] {
  const promoted: Array<{ id: string; rate: number }> = []

  for (const [moduleId, record] of Object.entries(usageLogs)) {
    const window = record.usage_log.slice(0, PROMOTION_WINDOW)
    const completions = window.filter((e) => e.completed).length
    if (completions >= PROMOTION_THRESHOLD) {
      promoted.push({ id: moduleId, rate: completions / PROMOTION_WINDOW })
    }
  }

  return promoted.sort((a, b) => b.rate - a.rate).map((p) => p.id)
}

// Returns true if a currently-promoted module should be demoted.
// Demotion: skipped in last 3 consecutive sessions where it was shown as preferred.
export function shouldDemote(usageLog: PageUsageRecord): boolean {
  const recent = usageLog.usage_log.slice(0, DEMOTION_CONSECUTIVE_SKIPS)
  if (recent.length < DEMOTION_CONSECUTIVE_SKIPS) return false
  return recent.every((e) => !e.completed)
}

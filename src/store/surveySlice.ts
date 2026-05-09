import { create } from 'zustand'
import { MANDATORY_MODULES, OPTIONAL_MODULES } from '../modules'
import { DynamicButtonItem, ButtonGridConfig, MandatoryData, PageUsageRecord } from '../types'
import { entries, moduleData, pageUsage } from '../repository'
import { calculateScore } from '../logic/scoring'
import { calculateStreak } from '../logic/streaks'
import { getPromotedModules } from '../logic/adaptive'
import { getTodayDate, nowIso } from '../utils/date'
import { DEFAULT_ACTIVITIES } from '../constants/defaults'
import { scheduleNightlyNotification } from '../notifications/scheduler'

type SurveyPhase = 'loading' | 'mandatory' | 'preferred' | 'optional' | 'complete'

interface SurveyStore {
  phase: SurveyPhase
  mandatoryIndex: number
  preferredIndex: number
  promotedModuleIds: string[]
  expandedOptionalId: string | null
  fieldValues: Record<string, Record<string, unknown>>
  completedModuleIds: string[]
  dynamicItems: Record<string, DynamicButtonItem[]>
  todayEntryId: string | null

  initSurvey: () => Promise<void>
  setField: (moduleId: string, fieldId: string, value: unknown) => void
  completeModule: (moduleId: string) => void
  completeMandatoryPhase: () => void
  skipPreferred: () => void
  setExpandedOptional: (id: string | null) => void
  addItem: (moduleId: string, itemsKey: string, label: string) => Promise<void>
  submitSession: () => Promise<void>
  reset: () => void
}

const blank: Omit<SurveyStore, keyof Pick<SurveyStore, 'initSurvey' | 'setField' | 'completeModule' | 'completeMandatoryPhase' | 'skipPreferred' | 'setExpandedOptional' | 'addItem' | 'submitSession' | 'reset'>> = {
  phase: 'loading',
  mandatoryIndex: 0,
  preferredIndex: 0,
  promotedModuleIds: [],
  expandedOptionalId: null,
  fieldValues: {},
  completedModuleIds: [],
  dynamicItems: {},
  todayEntryId: null,
}

export const useSurveyStore = create<SurveyStore>((set, get) => ({
  ...blank,

  async initSurvey() {
    set({ phase: 'loading' })

    // Load dynamic items for any optional module that uses them
    const dynamicItems: Record<string, DynamicButtonItem[]> = {}
    for (const mod of OPTIONAL_MODULES) {
      for (const field of mod.fields) {
        if (field.type === 'BUTTON_GRID') {
          const cfg = field.config as ButtonGridConfig
          if (cfg.dynamicItems && cfg.itemsKey) {
            let stored = await moduleData.getModuleData<{ items: DynamicButtonItem[] }>(mod.id, cfg.itemsKey)
            if (!stored) {
              stored = { items: mod.id === 'activity' ? DEFAULT_ACTIVITIES : [] }
              await moduleData.setModuleData(mod.id, cfg.itemsKey, stored)
            }
            dynamicItems[cfg.itemsKey] = stored.items
          }
        }
      }
    }

    // Compute adaptive promotions
    const usageLogs: Record<string, PageUsageRecord> = {}
    for (const mod of OPTIONAL_MODULES) {
      usageLogs[mod.id] = await pageUsage.getPageUsage(mod.id)
    }
    const promotedModuleIds = getPromotedModules(usageLogs)

    // Pre-fill from existing entry if today is already logged
    const today = getTodayDate()
    const existing = await entries.getEntryByDate(today)

    let fieldValues: Record<string, Record<string, unknown>> = {}
    let completedModuleIds: string[] = []
    let todayEntryId: string | null = null

    if (existing) {
      todayEntryId = existing.id
      fieldValues = {
        day_score: { satisfaction: existing.mandatory_data.satisfaction },
        mood: { mood: existing.mandatory_data.mood },
        stress: { stress: existing.mandatory_data.stress },
        ...Object.fromEntries(
          Object.entries(existing.optional_data).map(([id, data]) => [id, data as Record<string, unknown>])
        ),
      }
      completedModuleIds = [
        ...MANDATORY_MODULES.map((m) => m.id),
        ...Object.keys(existing.optional_data),
      ]
    }

    set({
      phase: 'mandatory',
      mandatoryIndex: 0,
      preferredIndex: 0,
      promotedModuleIds,
      expandedOptionalId: null,
      fieldValues,
      completedModuleIds,
      dynamicItems,
      todayEntryId,
    })
  },

  setField(moduleId, fieldId, value) {
    const { fieldValues } = get()
    set({
      fieldValues: {
        ...fieldValues,
        [moduleId]: { ...(fieldValues[moduleId] ?? {}), [fieldId]: value },
      },
    })
  },

  completeModule(moduleId) {
    const { completedModuleIds, mandatoryIndex, preferredIndex, promotedModuleIds, phase } = get()
    const next = completedModuleIds.includes(moduleId)
      ? completedModuleIds
      : [...completedModuleIds, moduleId]

    if (phase === 'mandatory') {
      const nextIdx = mandatoryIndex + 1
      if (nextIdx >= MANDATORY_MODULES.length) {
        set({
          completedModuleIds: next,
          phase: promotedModuleIds.length > 0 ? 'preferred' : 'optional',
          preferredIndex: 0,
        })
      } else {
        set({ completedModuleIds: next, mandatoryIndex: nextIdx })
      }
    } else if (phase === 'preferred') {
      const nextIdx = preferredIndex + 1
      set({
        completedModuleIds: next,
        phase: nextIdx >= promotedModuleIds.length ? 'optional' : 'preferred',
        preferredIndex: nextIdx,
      })
    } else {
      set({ completedModuleIds: next, expandedOptionalId: null })
    }
  },

  completeMandatoryPhase() {
    const { promotedModuleIds } = get()
    set({
      completedModuleIds: MANDATORY_MODULES.map((m) => m.id),
      phase: promotedModuleIds.length > 0 ? 'preferred' : 'optional',
      preferredIndex: 0,
    })
  },

  skipPreferred() {
    const { preferredIndex, promotedModuleIds } = get()
    const nextIdx = preferredIndex + 1
    set({
      phase: nextIdx >= promotedModuleIds.length ? 'optional' : 'preferred',
      preferredIndex: nextIdx,
    })
  },

  setExpandedOptional(id) {
    set({ expandedOptionalId: id })
  },

  async addItem(moduleId, itemsKey, label) {
    const newItem = await moduleData.addDynamicItem(moduleId, itemsKey, label)
    const { dynamicItems } = get()
    set({ dynamicItems: { ...dynamicItems, [itemsKey]: [...(dynamicItems[itemsKey] ?? []), newItem] } })
  },

  async submitSession() {
    const { fieldValues, completedModuleIds, dynamicItems, todayEntryId } = get()
    const today = getTodayDate()
    const mandatoryIds = new Set(MANDATORY_MODULES.map((m) => m.id))

    const mandatoryData: MandatoryData = {
      satisfaction: (fieldValues['day_score']?.satisfaction as number) ?? null,
      mood: (fieldValues['mood']?.mood as number) ?? null,
      stress: (fieldValues['stress']?.stress as number) ?? null,
    }

    const completedOptionalIds = completedModuleIds.filter((id) => !mandatoryIds.has(id))
    const optionalData: Record<string, Record<string, unknown>> = {}
    for (const id of completedOptionalIds) {
      optionalData[id] = { ...(fieldValues[id] ?? {}), completed_at: nowIso() }
    }

    const score = calculateScore(mandatoryData, completedOptionalIds)
    const recent = await entries.getRecentEntries(30)
    const streak = calculateStreak([
      { date: today, score },
      ...recent.map((e) => ({ date: e.date, score: e.score })),
    ])

    const meta = {
      app_version: '0.1.0-alpha',
      pages_viewed: completedModuleIds,
      session_completed_at: nowIso(),
    }

    if (todayEntryId) {
      await entries.updateEntry(todayEntryId, {
        mandatory_data: mandatoryData,
        optional_data: optionalData,
        score,
        streak_day: streak,
        metadata: meta,
      })
    } else {
      const saved = await entries.saveEntry({
        date: today,
        mandatory_data: mandatoryData,
        optional_data: optionalData,
        score,
        streak_day: streak,
        metadata: meta,
      })
      set({ todayEntryId: saved.id })
    }

    // Log page usage for all optionals
    for (const mod of OPTIONAL_MODULES) {
      await pageUsage.appendPageUsage(mod.id, {
        date: today,
        completed: completedOptionalIds.includes(mod.id),
      })
    }

    // Update activity item usage counts
    const selected = (fieldValues['activity']?.activities_done as string[]) ?? []
    for (const itemId of selected) {
      await moduleData.updateItemUsage('activity', 'user_activities', itemId)
    }
    if (selected.length > 0) {
      const refreshed = await moduleData.getModuleData<{ items: DynamicButtonItem[] }>('activity', 'user_activities')
      if (refreshed) {
        set({ dynamicItems: { ...dynamicItems, user_activities: refreshed.items } })
      }
    }

    set({ phase: 'complete' })
    scheduleNightlyNotification()
  },

  reset() {
    set({ ...blank })
  },
}))

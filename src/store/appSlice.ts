import { create } from 'zustand'
import { entries } from '../repository'
import { calculateStreak } from '../logic/streaks'
import { getTodayDate } from '../utils/date'

interface AppStore {
  streak: number
  lastEntryDate: string | null
  todayComplete: boolean

  loadAppState: () => Promise<void>
  refreshStreak: () => Promise<void>
}

export const useAppStore = create<AppStore>((set) => ({
  streak: 0,
  lastEntryDate: null,
  todayComplete: false,

  async loadAppState() {
    const recent = await entries.getRecentEntries(30)
    const today = getTodayDate()
    const streak = calculateStreak(recent.map((e) => ({ date: e.date, score: e.score })))
    const todayComplete = recent.length > 0 && recent[0].date === today && recent[0].score >= 0.5

    set({
      streak,
      lastEntryDate: recent[0]?.date ?? null,
      todayComplete,
    })
  },

  async refreshStreak() {
    const recent = await entries.getRecentEntries(30)
    const today = getTodayDate()
    const streak = calculateStreak(recent.map((e) => ({ date: e.date, score: e.score })))
    const todayComplete = recent.length > 0 && recent[0].date === today && recent[0].score >= 0.5
    set({ streak, todayComplete })
  },
}))

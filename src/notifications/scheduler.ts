import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import Constants from 'expo-constants'
import { entries } from '@/src/repository'
import { getTodayDate } from '@/src/utils/date'

// expo-notifications local scheduling was removed from Expo Go in SDK 53
const IN_EXPO_GO = Constants.appOwnership === 'expo'

const CHANNEL_ID = 'daily-checkin'
const DAYS_AHEAD = 30

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
})

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Daily check-in',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: null,
    vibrationPattern: [0, 250],
  })
}

async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync()
  if (existing === 'granted') return true
  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

// Schedules one non-repeating 9pm notification for each of the next DAYS_AHEAD days,
// skipping today if today's entry is already complete.
// Safe to call on every app open and after survey submit — cancels and rebuilds the queue.
export async function scheduleNightlyNotification(): Promise<void> {
  if (IN_EXPO_GO) return

  await ensureAndroidChannel()
  const granted = await requestPermissions()
  if (!granted) return

  await Notifications.cancelAllScheduledNotificationsAsync()

  const today = getTodayDate()
  const entry = await entries.getEntryByDate(today)
  const todayComplete = entry !== null && entry.score >= 0.5

  const now = new Date()

  for (let i = 0; i < DAYS_AHEAD; i++) {
    const target = new Date(now)
    target.setDate(now.getDate() + i)
    target.setHours(21, 0, 0, 0)

    if (target <= now) continue
    if (i === 0 && todayComplete) continue

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Daily check-in',
        body: "Time to log today's entry.",
        sound: undefined,
        ...(Platform.OS === 'android' && { channelId: CHANNEL_ID }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: target,
      },
    })
  }
}

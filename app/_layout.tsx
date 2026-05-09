import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { initDb } from '@/src/repository/db'
import { scheduleNightlyNotification } from '@/src/notifications/scheduler'

// Synchronous — must run before any component mounts so the DB is ready
initDb()

export default function RootLayout() {
  useEffect(() => {
    scheduleNightlyNotification()
  }, [])

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  )
}

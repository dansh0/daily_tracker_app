import { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { useSurveyStore } from '../../store'
import { MandatoryCard } from './MandatoryCard'
import { ModuleCard } from './ModuleCard'
import { OptionalList } from './OptionalList'
import { COLORS } from '../../constants/theme'
import { getDebugSummary, resetToday } from '../../utils/debug'

function CompleteScreen({ reset }: { reset: () => void }) {
  const [summary, setSummary] = useState<string | null>(null)

  const loadSummary = useCallback(async () => {
    if (!__DEV__) return
    const s = await getDebugSummary()
    setSummary(s)
  }, [])

  useEffect(() => { loadSummary() }, [loadSummary])

  const handleReset = useCallback(async () => {
    if (__DEV__) await resetToday()
    reset()
  }, [reset])

  return (
    <ScrollView contentContainerStyle={styles.center}>
      <Text style={styles.completeHeading}>Done</Text>
      <Text style={styles.completeSub}>Today's entry saved.</Text>
      <TouchableOpacity onPress={handleReset} activeOpacity={0.7} style={styles.restartButton}>
        <Text style={styles.restartText}>{__DEV__ ? 'Reset day + start over' : 'Start over'}</Text>
      </TouchableOpacity>
      {__DEV__ && summary && (
        <View style={styles.debugBox}>
          <Text style={styles.debugText}>{summary}</Text>
        </View>
      )}
    </ScrollView>
  )
}

export function SurveyShell() {
  const {
    phase,
    preferredIndex,
    promotedModuleIds,
    initSurvey,
    submitSession,
    reset,
  } = useSurveyStore()

  useEffect(() => {
    if (phase === 'loading') initSurvey()
  }, [phase])

  if (phase === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  if (phase === 'complete') {
    return <CompleteScreen reset={reset} />
  }

  if (phase === 'mandatory') {
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.cardContent}
        showsVerticalScrollIndicator={false}
      >
        <MandatoryCard />
      </ScrollView>
    )
  }

  if (phase === 'preferred') {
    const modId = promotedModuleIds[preferredIndex]
    if (!modId) return null
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.cardContent}
        showsVerticalScrollIndicator={false}
      >
        <ModuleCard moduleId={modId} isSkippable />
      </ScrollView>
    )
  }

  if (phase === 'optional') {
    return <OptionalList onComplete={submitSession} />
  }

  return null
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  cardContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    gap: 12,
    padding: 32,
  },
  completeHeading: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
  },
  completeSub: {
    fontSize: 16,
    color: COLORS.subtext,
  },
  restartButton: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  restartText: {
    color: COLORS.subtext,
    fontSize: 15,
  },
  debugBox: {
    marginTop: 24,
    padding: 14,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    alignSelf: 'stretch',
  },
  debugText: {
    color: '#c8ffa0',
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
})

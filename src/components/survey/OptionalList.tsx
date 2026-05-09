import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { OPTIONAL_MODULES } from '../../modules'
import { useSurveyStore } from '../../store'
import { ModuleCard } from './ModuleCard'
import { COLORS, RADIUS, SHADOW } from '../../constants/theme'

interface Props {
  onComplete: () => void
}

export function OptionalList({ onComplete }: Props) {
  const { expandedOptionalId, completedModuleIds, setExpandedOptional } = useSurveyStore()

  function toggleOptional(id: string) {
    setExpandedOptional(expandedOptionalId === id ? null : id)
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.heading}>Optional</Text>
      <Text style={styles.subheading}>Add more detail to today's entry</Text>

      <View style={styles.list}>
        {OPTIONAL_MODULES.map((mod) => {
          const completed = completedModuleIds.includes(mod.id)
          const expanded = expandedOptionalId === mod.id

          return (
            <View key={mod.id}>
              <TouchableOpacity
                onPress={() => toggleOptional(mod.id)}
                activeOpacity={0.7}
                style={[styles.optionButton, completed && styles.optionButtonDone, SHADOW.card]}
              >
                <Text style={[styles.optionLabel, completed && styles.optionLabelDone]}>
                  {mod.label}
                </Text>
                {completed ? (
                  <View style={styles.checkBadge}>
                    <Text style={styles.checkText}>Done</Text>
                  </View>
                ) : (
                  <Text style={styles.chevron}>{expanded ? '−' : '+'}</Text>
                )}
              </TouchableOpacity>

              {expanded && !completed && (
                <View style={styles.inlineCard}>
                  <ModuleCard moduleId={mod.id} />
                </View>
              )}
            </View>
          )
        })}
      </View>

      <TouchableOpacity
        onPress={onComplete}
        activeOpacity={0.7}
        style={styles.continueButton}
      >
        <Text style={styles.continueText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  subheading: {
    fontSize: 15,
    color: COLORS.subtext,
    marginTop: -12,
  },
  list: {
    gap: 10,
  },
  optionButton: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.card,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionButtonDone: {
    opacity: 0.7,
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '500',
    color: COLORS.text,
  },
  optionLabelDone: {
    color: COLORS.subtext,
  },
  chevron: {
    fontSize: 22,
    color: COLORS.subtext,
    fontWeight: '300',
  },
  checkBadge: {
    backgroundColor: COLORS.success + '22',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  checkText: {
    fontSize: 13,
    color: COLORS.success,
    fontWeight: '600',
  },
  inlineCard: {
    marginTop: 4,
    marginBottom: 4,
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.button,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
})

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { MODULE_REGISTRY } from '../../modules'
import { useSurveyStore } from '../../store'
import { FieldRenderer } from '../fields/FieldRenderer'
import { COLORS, RADIUS, SHADOW } from '../../constants/theme'

interface Props {
  moduleId: string
  isSkippable?: boolean
}

export function ModuleCard({ moduleId, isSkippable = false }: Props) {
  const mod = MODULE_REGISTRY[moduleId]
  const { fieldValues, dynamicItems, setField, completeModule, skipPreferred, addItem } =
    useSurveyStore()
  const values = fieldValues[moduleId] ?? {}

  function handleComplete() {
    completeModule(moduleId)
  }

  function handleSkip() {
    skipPreferred()
  }

  return (
    <View style={[styles.card, SHADOW.card]}>
      <Text style={styles.title}>{mod.label}</Text>

      <View style={styles.fields}>
        {mod.fields.map((field) => (
          <View key={field.id} style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <FieldRenderer
              field={field}
              value={values[field.id]}
              onChange={(val) => setField(moduleId, field.id, val)}
              dynamicItems={dynamicItems}
              onAddItem={(itemsKey, label) => addItem(moduleId, itemsKey, label)}
            />
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        {isSkippable && (
          <TouchableOpacity onPress={handleSkip} activeOpacity={0.7} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={handleComplete} activeOpacity={0.7} style={styles.doneButton}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.card,
    padding: 20,
    gap: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  fields: {
    gap: 20,
  },
  fieldBlock: {
    gap: 10,
  },
  fieldLabel: {
    fontSize: 15,
    color: COLORS.subtext,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  doneButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.button,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    color: COLORS.subtext,
    fontSize: 15,
    fontWeight: '500',
  },
})

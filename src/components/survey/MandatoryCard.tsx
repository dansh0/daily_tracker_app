import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { MANDATORY_MODULES } from '../../modules'
import { useSurveyStore } from '../../store'
import { FieldRenderer } from '../fields/FieldRenderer'
import { COLORS, RADIUS, SHADOW } from '../../constants/theme'

export function MandatoryCard() {
  const { fieldValues, dynamicItems, setField, completeMandatoryPhase } = useSurveyStore()

  return (
    <View style={[styles.card, SHADOW.card]}>
      <Text style={styles.heading}>How was today?</Text>

      <View style={styles.fields}>
        {MANDATORY_MODULES.map((mod) =>
          mod.fields.map((field) => (
            <View key={`${mod.id}-${field.id}`} style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <FieldRenderer
                field={field}
                value={fieldValues[mod.id]?.[field.id]}
                onChange={(val) => setField(mod.id, field.id, val)}
                dynamicItems={dynamicItems}
              />
            </View>
          ))
        )}
      </View>

      <TouchableOpacity
        onPress={completeMandatoryPhase}
        activeOpacity={0.7}
        style={styles.nextButton}
      >
        <Text style={styles.nextText}>Next</Text>
      </TouchableOpacity>
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
  heading: {
    fontSize: 22,
    fontWeight: '700',
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
  nextButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.button,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
})

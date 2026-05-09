import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { SingleSelectConfig } from '../../types'
import { COLORS } from '../../constants/theme'

interface Props {
  config: SingleSelectConfig
  value: string | number | null
  onChange: (value: string | number) => void
}

export function SingleSelect({ config, value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {config.options.map((option) => {
        const emittedValue = option.numericValue !== undefined ? option.numericValue : option.id
        const selected = value === emittedValue
        return (
          <TouchableOpacity
            key={option.id}
            onPress={() => onChange(emittedValue)}
            activeOpacity={0.7}
            style={[styles.option, selected && styles.optionSelected]}
          >
            <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  option: {
    flex: 1,
    minWidth: 72,
    backgroundColor: COLORS.buttonBg,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  optionSelected: {
    backgroundColor: COLORS.primary,
  },
  optionText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
})

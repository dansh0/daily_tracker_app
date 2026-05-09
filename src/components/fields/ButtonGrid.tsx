import { useState } from 'react'
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native'
import { ButtonGridConfig, ButtonItem, DynamicButtonItem } from '../../types'
import { COLORS } from '../../constants/theme'

interface Props {
  config: ButtonGridConfig
  value: string[]
  items: (ButtonItem | DynamicButtonItem)[]
  onChange: (ids: string[]) => void
  onAddItem?: (label: string) => void
}

export function ButtonGrid({ config, value, items, onChange, onAddItem }: Props) {
  const [addText, setAddText] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const columns = config.columns ?? 3

  function toggle(id: string) {
    if (config.multiSelect) {
      const next = value.includes(id) ? value.filter((v) => v !== id) : [...value, id]
      onChange(next)
    } else {
      onChange(value.includes(id) ? [] : [id])
    }
  }

  function confirmAdd() {
    const label = addText.trim()
    if (label && onAddItem) {
      onAddItem(label)
      setAddText('')
      setShowAdd(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.grid, { gap: 8 }]}>
        {items.map((item) => {
          const selected = value.includes(item.id)
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => toggle(item.id)}
              activeOpacity={0.7}
              style={[
                styles.button,
                { width: `${Math.floor(100 / columns) - 2}%` },
                selected && styles.buttonSelected,
              ]}
            >
              <Text style={[styles.buttonText, selected && styles.buttonTextSelected]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )
        })}
        {config.allowAdd && !showAdd && (
          <TouchableOpacity
            onPress={() => setShowAdd(true)}
            activeOpacity={0.7}
            style={[styles.button, styles.addButton, { width: `${Math.floor(100 / columns) - 2}%` }]}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {showAdd && (
        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            value={addText}
            onChangeText={setAddText}
            placeholder="New item..."
            placeholderTextColor={COLORS.subtext}
            autoFocus
            onSubmitEditing={confirmAdd}
            returnKeyType="done"
          />
          <TouchableOpacity onPress={confirmAdd} style={styles.addConfirm} activeOpacity={0.7}>
            <Text style={styles.addConfirmText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setShowAdd(false); setAddText('') }} activeOpacity={0.7}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  button: {
    backgroundColor: COLORS.buttonBg,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonSelected: {
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  buttonTextSelected: {
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 14,
    color: COLORS.subtext,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addInput: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  addConfirm: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 44,
    justifyContent: 'center',
  },
  addConfirmText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  cancelText: {
    color: COLORS.subtext,
    fontSize: 14,
  },
})

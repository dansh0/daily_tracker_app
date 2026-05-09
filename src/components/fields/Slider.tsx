import { useCallback, useRef, useState } from 'react'
import { LayoutChangeEvent, PanResponder, StyleSheet, Text, View } from 'react-native'
import { COLORS } from '../../constants/theme'
import { SliderConfig } from '../../types'

const THUMB_W = 34
const THUMB_H = 28
const TRACK_H = 10

interface Props {
  config: SliderConfig
  value: number | null
  onChange: (value: number) => void
}

function snap(raw: number, min: number, max: number, step: number): number {
  return Math.max(min, Math.min(max, Math.round((raw - min) / step) * step + min))
}

function getLabel(labels: string[], pct: number): string {
  const index = Math.min(Math.floor(pct * labels.length), labels.length - 1)
  return labels[index]
}

export function Slider({ config, value, onChange }: Props) {
  // null = not yet measured; hides thumb until layout fires to prevent 0-flash
  const [containerW, setContainerW] = useState<number | null>(null)
  const containerWRef = useRef(0)
  const configRef = useRef(config)
  configRef.current = config

  // Local drag percentage drives visuals during drag; null = use committed value
  const [dragPct, setDragPct] = useState<number | null>(null)

  const committedPct = ((value ?? config.defaultValue) - config.min) / (config.max - config.min)
  const displayPct = dragPct ?? committedPct

  const xToPct = useCallback((x: number): number => {
    const usable = containerWRef.current - THUMB_W
    return Math.max(0, Math.min(1, (x - THUMB_W / 2) / usable))
  }, [])

  const pctToValue = useCallback((p: number): number => {
    const { min, max, step } = configRef.current
    return snap(min + p * (max - min), min, max, step)
  }, [])

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const p = xToPct(e.nativeEvent.locationX)
        setDragPct(p)
      },
      onPanResponderMove: (e) => {
        const p = xToPct(e.nativeEvent.locationX)
        setDragPct(p)
      },
      onPanResponderRelease: (e) => {
        const p = xToPct(e.nativeEvent.locationX)
        setDragPct(null)
        onChange(pctToValue(p))
      },
      onPanResponderTerminate: () => {
        setDragPct(null)
      },
    })
  ).current

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width
    containerWRef.current = w
    setContainerW(w)
  }, [])

  const usableW = (containerW ?? 0) - THUMB_W
  const thumbLeft = displayPct * Math.max(0, usableW)
  const fillWidth = thumbLeft + THUMB_W / 2

  const displayLabel = config.labels
    ? getLabel(config.labels, displayPct)
    : config.showValue
    ? `${Math.round(pctToValue(displayPct))}${config.unit ? ` ${config.unit}` : ''}`
    : null

  return (
    <View style={styles.wrapper}>
      <View
        style={styles.container}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
        <View style={styles.track}>
          <View style={[styles.fill, { width: fillWidth }]} />
        </View>

        {containerW !== null && (
          <View style={[styles.thumb, { left: thumbLeft }]}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={styles.groove} />
            ))}
          </View>
        )}
      </View>

      {displayLabel && (
        <Text style={styles.label}>{displayLabel}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  container: {
    height: THUMB_H,
    justifyContent: 'center',
  },
  track: {
    position: 'absolute',
    left: THUMB_W / 2,
    right: THUMB_W / 2,
    height: TRACK_H,
    backgroundColor: COLORS.sliderTrack,
    borderRadius: TRACK_H / 2,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_W,
    height: THUMB_H,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },
  groove: {
    width: 1.5,
    height: THUMB_H * 0.45,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  label: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.primary,
  },
})

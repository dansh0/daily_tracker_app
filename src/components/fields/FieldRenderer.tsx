import { ModuleField, SliderConfig, ButtonGridConfig, SingleSelectConfig, DynamicButtonItem, ButtonItem } from '../../types'
import { Slider } from './Slider'
import { ButtonGrid } from './ButtonGrid'
import { SingleSelect } from './SingleSelect'

interface Props {
  field: ModuleField
  value: unknown
  onChange: (value: unknown) => void
  dynamicItems?: Record<string, DynamicButtonItem[]>
  onAddItem?: (itemsKey: string, label: string) => void
}

export function FieldRenderer({ field, value, onChange, dynamicItems, onAddItem }: Props) {
  switch (field.type) {
    case 'SLIDER': {
      return (
        <Slider
          config={field.config as SliderConfig}
          value={value as number | null}
          onChange={onChange}
        />
      )
    }

    case 'BUTTON_GRID': {
      const cfg = field.config as ButtonGridConfig
      const items: (ButtonItem | DynamicButtonItem)[] =
        cfg.dynamicItems && cfg.itemsKey
          ? (dynamicItems?.[cfg.itemsKey] ?? [])
          : (cfg.staticItems ?? [])

      return (
        <ButtonGrid
          config={cfg}
          value={(value as string[]) ?? []}
          items={items}
          onChange={onChange}
          onAddItem={cfg.allowAdd && cfg.itemsKey ? (label) => onAddItem?.(cfg.itemsKey!, label) : undefined}
        />
      )
    }

    case 'SINGLE_SELECT': {
      return (
        <SingleSelect
          config={field.config as SingleSelectConfig}
          value={value as string | number | null}
          onChange={onChange}
        />
      )
    }

    default:
      return null
  }
}

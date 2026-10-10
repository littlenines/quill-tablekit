import type { ResolvedTableKitOptions, TableKitLabels } from '../config/options'
import type { CellProperties, TableAlign, TableProperties, TextAlign, VerticalAlign } from '../model/properties'
import type { PanelField } from './PropertiesPanel'

type PanelSettings = Pick<ResolvedTableKitOptions, 'labels' | 'colors'>

const colorField = (
  label: string,
  value: string | null,
  { labels, colors }: PanelSettings,
  onChange: (color: string | null) => void,
): PanelField => ({
  kind: 'colors',
  label,
  value,
  options: [{ value: null, label: labels.noColor }, ...colors.map((color) => ({ value: color, label: color, color }))],
  customColor: { pickerLabel: labels.customColor, codeLabel: labels.colorCode },
  onChange,
})

const choiceField = <Choice extends string>(
  label: string,
  value: Choice,
  choices: [Choice, string][],
  onChange: (choice: Choice) => void,
): PanelField => ({
  kind: 'choices',
  label,
  value,
  options: choices.map(([choice, choiceLabel]) => ({ value: choice, label: choiceLabel })),
  onChange: (choice) => onChange(choice as Choice),
})

const horizontalChoices = (labels: TableKitLabels): [TableAlign, string][] => [
  ['left', labels.alignLeft],
  ['center', labels.alignCenter],
  ['right', labels.alignRight],
]

export const cellPropertyFields = (
  current: CellProperties,
  settings: PanelSettings,
  applyChanges: (changes: Partial<CellProperties>) => void,
): PanelField[] => {
  const { labels } = settings
  const verticalChoices: [VerticalAlign, string][] = [
    ['top', labels.alignTop],
    ['middle', labels.alignMiddle],
    ['bottom', labels.alignBottom],
  ]
  const textChoices: [TextAlign, string][] = [...horizontalChoices(labels), ['justify', labels.alignJustify]]

  return [
    colorField(labels.background, current.background, settings, (background) => applyChanges({ background })),
    choiceField(labels.verticalAlign, current.verticalAlign, verticalChoices, (verticalAlign) =>
      applyChanges({ verticalAlign }),
    ),
    choiceField(labels.textAlign, current.textAlign, textChoices, (textAlign) => applyChanges({ textAlign })),
  ]
}

export const tablePropertyFields = (
  current: TableProperties,
  settings: PanelSettings,
  applyChanges: (changes: Partial<TableProperties>) => void,
): PanelField[] => {
  const { labels } = settings

  return [
    choiceField(labels.tableAlign, current.align, horizontalChoices(labels), (align) => applyChanges({ align })),
    colorField(labels.borderColor, current.borderColor, settings, (borderColor) => applyChanges({ borderColor })),
    colorField(labels.background, current.background, settings, (background) => applyChanges({ background })),
  ]
}

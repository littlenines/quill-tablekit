import { BORDER_COLOR, STRIPE_BACKGROUND } from '../config/constants'
import type { ResolvedTableKitOptions, TableKitLabels } from '../config/options'
import type {
  BorderStyle,
  CellPadding,
  CaptionSide,
  CellProperties,
  TableAlign,
  TableProperties,
  TextAlign,
  VerticalAlign,
} from '../model/properties'
import type { ColorChoice, PanelField } from './PropertiesPanel'

type PanelSettings = Pick<ResolvedTableKitOptions, 'labels' | 'colors'>

const colorChoice = (
  label: string,
  value: string | null,
  { labels, colors }: PanelSettings,
  onChange: (color: string | null) => void,
  emptyPreview?: string,
): ColorChoice => ({
  label,
  value,
  options: [
    { value: null, label: emptyPreview ? labels.defaultColor : labels.noColor },
    ...colors.map((color) => ({ value: color, label: color, color })),
  ],
  customColor: { pickerLabel: labels.customColor, codeLabel: labels.colorCode },
  emptyPreview,
  onChange,
})

const choiceField = <Choice extends string>(
  label: string,
  value: Choice,
  choices: [Choice, string][],
  onChange: (choice: Choice) => void,
  color?: ColorChoice,
): PanelField => ({
  kind: 'choices',
  label,
  value,
  options: choices.map(([choice, choiceLabel]) => ({ value: choice, label: choiceLabel })),
  color,
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
    {
      kind: 'colors',
      ...colorChoice(labels.background, current.background, settings, (background) => applyChanges({ background })),
    },
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
  const borderChoices: [BorderStyle, string][] = [
    ['solid', labels.borderSolid],
    ['dashed', labels.borderDashed],
    ['none', labels.borderNone],
  ]
  const paddingChoices: [CellPadding, string][] = [
    ['compact', labels.paddingCompact],
    ['normal', labels.paddingNormal],
    ['wide', labels.paddingWide],
  ]
  const borderColor = colorChoice(
    labels.borderColor,
    current.borderColor,
    settings,
    (color) => applyChanges({ borderColor: color }),
    BORDER_COLOR,
  )
  const stripeColor = colorChoice(
    labels.stripeColor,
    current.stripeColor,
    settings,
    (color) => applyChanges({ striped: true, stripeColor: color }),
    STRIPE_BACKGROUND,
  )

  return [
    choiceField(labels.tableAlign, current.align, horizontalChoices(labels), (align) => applyChanges({ align })),
    choiceField(
      labels.borderStyle,
      current.borderStyle,
      borderChoices,
      (borderStyle) => applyChanges({ borderStyle }),
      borderColor,
    ),
    choiceField(labels.cellPadding, current.cellPadding, paddingChoices, (cellPadding) =>
      applyChanges({ cellPadding }),
    ),
    {
      kind: 'colors',
      ...colorChoice(labels.background, current.background, settings, (background) => applyChanges({ background })),
    },
    {
      kind: 'toggle',
      label: labels.stripedRows,
      value: current.striped,
      color: stripeColor,
      onChange: (striped) => applyChanges({ striped }),
    },
    {
      kind: 'text',
      label: labels.caption,
      value: current.caption,
      choices: {
        label: labels.captionSide,
        value: current.captionSide,
        options: [
          { value: 'top', label: labels.alignTop },
          { value: 'bottom', label: labels.alignBottom },
        ],
        onChange: (captionSide) => applyChanges({ captionSide: captionSide as CaptionSide }),
      },
      onChange: (caption) => applyChanges({ caption }),
    },
  ]
}

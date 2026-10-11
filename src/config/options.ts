import { normalizeColor } from '../model/properties'
import { ICONS } from '../ui/icons'

export interface TableKitLabels {
  insertTable: string
  customSize: string
  rowsInput: string
  columnsInput: string
  insertButton: string
  insertRowAbove: string
  insertRowBelow: string
  insertColumnLeft: string
  insertColumnRight: string
  moveRowUp: string
  moveRowDown: string
  moveColumnLeft: string
  moveColumnRight: string
  duplicateRow: string
  duplicateColumn: string
  equalColumnWidths: string
  fitToContent: string
  fitToWidth: string
  equalRowHeights: string
  insertParagraphAbove: string
  insertParagraphBelow: string
  selectRow: string
  selectColumn: string
  copyTable: string
  mergeCells: string
  splitCell: string
  headerRow: string
  headerColumn: string
  cellProperties: string
  tableProperties: string
  deleteRow: string
  deleteColumn: string
  deleteTable: string
  background: string
  borderColor: string
  borderStyle: string
  borderSolid: string
  borderDashed: string
  borderNone: string
  cellPadding: string
  paddingCompact: string
  paddingNormal: string
  paddingWide: string
  stripedRows: string
  stripeColor: string
  defaultColor: string
  caption: string
  captionSide: string
  noColor: string
  customColor: string
  colorCode: string
  textAlign: string
  verticalAlign: string
  tableAlign: string
  alignLeft: string
  alignCenter: string
  alignRight: string
  alignJustify: string
  alignTop: string
  alignMiddle: string
  alignBottom: string
  actionBar: string
  rowsGroup: string
  columnsGroup: string
  moreGroup: string
}

export type TableKitIcons = Record<keyof typeof ICONS, string>

export const MENU_GROUPS = [
  ['insertRowAbove', 'insertRowBelow', 'insertColumnLeft', 'insertColumnRight'],
  ['moveRowUp', 'moveRowDown', 'moveColumnLeft', 'moveColumnRight', 'duplicateRow', 'duplicateColumn'],
  ['insertParagraphAbove', 'insertParagraphBelow'],
  ['equalColumnWidths', 'fitToContent', 'fitToWidth', 'equalRowHeights'],
  ['selectRow', 'selectColumn', 'copyTable'],
  ['mergeCells', 'splitCell'],
  ['headerRow', 'headerColumn', 'cellProperties', 'tableProperties'],
  ['deleteRow', 'deleteColumn', 'deleteTable'],
] as const

export type TableMenuItemName = (typeof MENU_GROUPS)[number][number]

export const MENU_ITEM_NAMES: readonly TableMenuItemName[] = MENU_GROUPS.flat()

export interface TableKitOptions {
  pickerRows?: number
  pickerColumns?: number
  maxRows?: number
  maxColumns?: number
  contextMenu?: boolean
  resizable?: boolean
  responsiveWidths?: boolean
  actionBar?: boolean
  minColumnWidth?: number
  menu?: TableMenuItemName[]
  colors?: string[]
  icons?: Partial<TableKitIcons>
  labels?: Partial<TableKitLabels>
}

export type ResolvedTableKitOptions = Required<Omit<TableKitOptions, 'labels' | 'icons'>> & {
  icons: TableKitIcons
  labels: TableKitLabels
}

export const DEFAULT_LABELS = {
  insertTable: 'Insert table',
  customSize: 'Custom size',
  rowsInput: 'Rows',
  columnsInput: 'Columns',
  insertButton: 'Insert',
  insertRowAbove: 'Insert row above',
  insertRowBelow: 'Insert row below',
  insertColumnLeft: 'Insert column left',
  insertColumnRight: 'Insert column right',
  moveRowUp: 'Move row up',
  moveRowDown: 'Move row down',
  moveColumnLeft: 'Move column left',
  moveColumnRight: 'Move column right',
  duplicateRow: 'Duplicate row',
  duplicateColumn: 'Duplicate column',
  equalColumnWidths: 'Equal column widths',
  fitToContent: 'Fit columns to content',
  fitToWidth: 'Fit table to width',
  equalRowHeights: 'Equal row heights',
  insertParagraphAbove: 'Insert paragraph above table',
  insertParagraphBelow: 'Insert paragraph below table',
  selectRow: 'Select row',
  selectColumn: 'Select column',
  copyTable: 'Copy table',
  mergeCells: 'Merge cells',
  splitCell: 'Split cell',
  headerRow: 'Header row',
  headerColumn: 'Header column',
  cellProperties: 'Cell properties',
  tableProperties: 'Table properties',
  deleteRow: 'Delete row',
  deleteColumn: 'Delete column',
  deleteTable: 'Delete table',
  background: 'Background',
  borderColor: 'Border color',
  borderStyle: 'Borders',
  borderSolid: 'Solid',
  borderDashed: 'Dashed',
  borderNone: 'None',
  cellPadding: 'Cell spacing',
  paddingCompact: 'Compact',
  paddingNormal: 'Normal',
  paddingWide: 'Wide',
  stripedRows: 'Striped rows',
  stripeColor: 'Stripe color',
  defaultColor: 'Default',
  caption: 'Caption',
  captionSide: 'Caption position',
  noColor: 'No color',
  customColor: 'Custom color',
  colorCode: 'Color code',
  textAlign: 'Text alignment',
  verticalAlign: 'Vertical alignment',
  tableAlign: 'Table alignment',
  alignLeft: 'Left',
  alignCenter: 'Center',
  alignRight: 'Right',
  alignJustify: 'Justify',
  alignTop: 'Top',
  alignMiddle: 'Middle',
  alignBottom: 'Bottom',
  actionBar: 'Table actions',
  rowsGroup: 'Rows',
  columnsGroup: 'Columns',
  moreGroup: 'More',
} satisfies TableKitLabels

export const DEFAULT_COLORS = [
  '#000000',
  '#666666',
  '#b7b7b7',
  '#e06666',
  '#f6b26b',
  '#ffd966',
  '#93c47d',
  '#6fa8dc',
  '#f3f3f3',
  '#f4cccc',
  '#fce5cd',
  '#fff2cc',
  '#d9ead3',
  '#cfe2f3',
  '#d9d2e9',
]

export const DEFAULT_OPTIONS = {
  pickerRows: 8,
  pickerColumns: 10,
  maxRows: 100,
  maxColumns: 30,
  contextMenu: false,
  resizable: true,
  responsiveWidths: true,
  actionBar: true,
  minColumnWidth: 40,
  menu: [...MENU_ITEM_NAMES],
  colors: DEFAULT_COLORS,
  icons: ICONS,
  labels: DEFAULT_LABELS,
} satisfies ResolvedTableKitOptions

const positiveWholeNumberOr = (input: unknown, fallback: number) =>
  typeof input === 'number' && Number.isFinite(input) && input >= 1 ? Math.floor(input) : fallback

const menuItemsOr = (input: unknown, fallback: TableMenuItemName[]): TableMenuItemName[] =>
  Array.isArray(input) ? MENU_ITEM_NAMES.filter((menuItemName) => input.includes(menuItemName)) : fallback

const colorsOr = (input: unknown, fallback: string[]): string[] => {
  const validColors = Array.isArray(input) ? input.flatMap((color) => normalizeColor(color) ?? []) : []

  return validColors.length > 0 ? validColors : fallback
}

const iconsOr = (input: unknown, fallback: TableKitIcons): TableKitIcons => {
  const userIcons = input != null && typeof input === 'object' ? Object.entries(input) : []
  const knownIcons = userIcons.filter(([iconName, markup]) => iconName in fallback && typeof markup === 'string')

  return { ...fallback, ...Object.fromEntries(knownIcons) }
}

export const resolveOptions = (userOptions: TableKitOptions = {}): ResolvedTableKitOptions => ({
  pickerRows: positiveWholeNumberOr(userOptions.pickerRows, DEFAULT_OPTIONS.pickerRows),
  pickerColumns: positiveWholeNumberOr(userOptions.pickerColumns, DEFAULT_OPTIONS.pickerColumns),
  maxRows: positiveWholeNumberOr(userOptions.maxRows, DEFAULT_OPTIONS.maxRows),
  maxColumns: positiveWholeNumberOr(userOptions.maxColumns, DEFAULT_OPTIONS.maxColumns),
  contextMenu: userOptions.contextMenu ?? DEFAULT_OPTIONS.contextMenu,
  resizable: userOptions.resizable ?? DEFAULT_OPTIONS.resizable,
  responsiveWidths: userOptions.responsiveWidths ?? DEFAULT_OPTIONS.responsiveWidths,
  actionBar: userOptions.actionBar ?? DEFAULT_OPTIONS.actionBar,
  minColumnWidth: positiveWholeNumberOr(userOptions.minColumnWidth, DEFAULT_OPTIONS.minColumnWidth),
  menu: menuItemsOr(userOptions.menu, DEFAULT_OPTIONS.menu),
  colors: colorsOr(userOptions.colors, DEFAULT_OPTIONS.colors),
  icons: iconsOr(userOptions.icons, DEFAULT_OPTIONS.icons),
  labels: { ...DEFAULT_LABELS, ...userOptions.labels },
})

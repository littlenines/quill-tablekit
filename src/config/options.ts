import { normalizeColor } from '../model/properties'
import { ICONS } from '../ui/icons'
import { DEFAULT_LABELS, type TableKitLabels } from './labels'

export type TableKitIcons = Record<keyof typeof ICONS, string>

export const MENU_GROUPS = [
  ['insertRowAbove', 'insertRowBelow', 'insertColumnLeft', 'insertColumnRight'],
  ['moveRowUp', 'moveRowDown', 'moveColumnLeft', 'moveColumnRight', 'duplicateRow', 'duplicateColumn'],
  ['sortAscending', 'sortDescending'],
  ['insertParagraphAbove', 'insertParagraphBelow'],
  ['equalColumnWidths', 'fitToContent', 'fitToWidth', 'equalRowHeights'],
  ['selectRow', 'selectColumn', 'copyTable', 'copyAsMarkdown'],
  ['mergeCells', 'splitCell'],
  ['headerRow', 'headerColumn', 'cellProperties', 'tableProperties'],
  ['deleteRow', 'deleteColumn', 'deleteTable'],
] as const

export type TableMenuItemName = (typeof MENU_GROUPS)[number][number]

export const MENU_ITEM_NAMES: readonly TableMenuItemName[] = MENU_GROUPS.flat()

const SORT_ITEMS: readonly TableMenuItemName[] = ['sortAscending', 'sortDescending']

export interface TableKitOptions {
  pickerRows?: number
  pickerColumns?: number
  maxRows?: number
  maxColumns?: number
  contextMenu?: boolean
  resizable?: boolean
  sortable?: boolean
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
  sortable: false,
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

const withSorting = (menu: TableMenuItemName[], sortable: boolean): TableMenuItemName[] =>
  sortable ? menu : menu.filter((menuItemName) => !SORT_ITEMS.includes(menuItemName))

export const resolveOptions = (userOptions: TableKitOptions = {}): ResolvedTableKitOptions => {
  const sortable = userOptions.sortable ?? DEFAULT_OPTIONS.sortable

  return {
    pickerRows: positiveWholeNumberOr(userOptions.pickerRows, DEFAULT_OPTIONS.pickerRows),
    pickerColumns: positiveWholeNumberOr(userOptions.pickerColumns, DEFAULT_OPTIONS.pickerColumns),
    maxRows: positiveWholeNumberOr(userOptions.maxRows, DEFAULT_OPTIONS.maxRows),
    maxColumns: positiveWholeNumberOr(userOptions.maxColumns, DEFAULT_OPTIONS.maxColumns),
    contextMenu: userOptions.contextMenu ?? DEFAULT_OPTIONS.contextMenu,
    resizable: userOptions.resizable ?? DEFAULT_OPTIONS.resizable,
    sortable,
    responsiveWidths: userOptions.responsiveWidths ?? DEFAULT_OPTIONS.responsiveWidths,
    actionBar: userOptions.actionBar ?? DEFAULT_OPTIONS.actionBar,
    minColumnWidth: positiveWholeNumberOr(userOptions.minColumnWidth, DEFAULT_OPTIONS.minColumnWidth),
    menu: withSorting(menuItemsOr(userOptions.menu, DEFAULT_OPTIONS.menu), sortable),
    colors: colorsOr(userOptions.colors, DEFAULT_OPTIONS.colors),
    icons: iconsOr(userOptions.icons, DEFAULT_OPTIONS.icons),
    labels: { ...DEFAULT_LABELS, ...userOptions.labels },
  }
}

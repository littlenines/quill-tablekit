import type { TableKitLabels } from '../../config/labels'
import type { TableKitIcons, TableMenuItemName } from '../../config/options'

export type ButtonSpec =
  | { kind: 'items'; label: keyof TableKitLabels; icon: keyof TableKitIcons; items: TableMenuItemName[] }
  | { kind: 'item'; item: TableMenuItemName; icon: keyof TableKitIcons; danger?: boolean }
  | { kind: 'merge' }
  | { kind: 'separator' }

const BUTTON_SPECS: ButtonSpec[] = [
  {
    kind: 'items',
    label: 'rowsGroup',
    icon: 'rows',
    items: [
      'insertRowAbove',
      'insertRowBelow',
      'moveRowUp',
      'moveRowDown',
      'duplicateRow',
      'equalRowHeights',
      'selectRow',
      'deleteRow',
    ],
  },
  {
    kind: 'items',
    label: 'columnsGroup',
    icon: 'columns',
    items: [
      'insertColumnLeft',
      'insertColumnRight',
      'moveColumnLeft',
      'moveColumnRight',
      'duplicateColumn',
      'sortAscending',
      'sortDescending',
      'equalColumnWidths',
      'fitToContent',
      'selectColumn',
      'deleteColumn',
    ],
  },
  { kind: 'merge' },
  { kind: 'separator' },
  { kind: 'item', item: 'headerRow', icon: 'headerRow' },
  { kind: 'item', item: 'headerColumn', icon: 'headerColumn' },
  { kind: 'item', item: 'cellProperties', icon: 'cellProperties' },
  { kind: 'item', item: 'tableProperties', icon: 'tableProperties' },
  { kind: 'separator' },
  {
    kind: 'items',
    label: 'moreGroup',
    icon: 'more',
    items: ['insertParagraphAbove', 'insertParagraphBelow', 'fitToWidth', 'copyTable'],
  },
  { kind: 'item', item: 'deleteTable', icon: 'deleteTable', danger: true },
]

// Buttons that stay pressed while the table has this attribute
export const TOGGLE_ATTRIBUTES: Partial<Record<TableMenuItemName, string>> = {
  headerRow: 'data-header',
  headerColumn: 'data-header-column',
}

const isAllowed = (spec: ButtonSpec, menu: TableMenuItemName[]): boolean => {
  if (spec.kind === 'items') return spec.items.some((item) => menu.includes(item))
  if (spec.kind === 'item') return menu.includes(spec.item)
  if (spec.kind === 'merge') return menu.includes('mergeCells') || menu.includes('splitCell')

  return true
}

const withoutLooseSeparators = (specs: ButtonSpec[]): ButtonSpec[] => {
  const keptSpecs: ButtonSpec[] = []

  for (const spec of specs) {
    const previous = keptSpecs.at(-1)

    if (spec.kind === 'separator' && (!previous || previous.kind === 'separator')) continue

    keptSpecs.push(spec)
  }

  if (keptSpecs.at(-1)?.kind === 'separator') keptSpecs.pop()

  return keptSpecs
}

export const allowedButtonSpecs = (menu: TableMenuItemName[]): ButtonSpec[] =>
  withoutLooseSeparators(BUTTON_SPECS.filter((spec) => isAllowed(spec, menu)))

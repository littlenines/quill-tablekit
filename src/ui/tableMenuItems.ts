import type { TableKitLabels } from '../config/options'
import { canMerge, canSplit, type TableContext } from '../editing/context'
import type { MenuItem } from './TableMenu'

export interface TableActions {
  insertRowAbove(): void
  insertRowBelow(): void
  insertColumnLeft(): void
  insertColumnRight(): void
  mergeCells(): void
  splitCell(): void
  deleteRow(): void
  deleteColumn(): void
  deleteTable(): void
}

const menuItem = (label: string, run: () => void, enabled = true): MenuItem => ({ label, run, enabled })

export const tableMenuItems = (
  tableContext: TableContext,
  labels: TableKitLabels,
  actions: TableActions,
): MenuItem[][] => [
  [
    menuItem(labels.insertRowAbove, () => actions.insertRowAbove()),
    menuItem(labels.insertRowBelow, () => actions.insertRowBelow()),
    menuItem(labels.insertColumnLeft, () => actions.insertColumnLeft()),
    menuItem(labels.insertColumnRight, () => actions.insertColumnRight()),
  ],
  [
    menuItem(labels.mergeCells, () => actions.mergeCells(), canMerge(tableContext)),
    menuItem(labels.splitCell, () => actions.splitCell(), canSplit(tableContext)),
  ],
  [
    menuItem(labels.deleteRow, () => actions.deleteRow()),
    menuItem(labels.deleteColumn, () => actions.deleteColumn()),
    menuItem(labels.deleteTable, () => actions.deleteTable()),
  ],
]

import * as arrange from '../model/operations/arrange'
import type { CellData } from '../model/cell'
import * as merging from '../model/operations/merging'
import * as rowsAndColumns from '../model/operations/rowsAndColumns'
import type { TableContext } from './context'

export type TableEdit = (tableContext: TableContext) => CellData | null | undefined

const keepingCursorCell =
  (applyChange: (tableContext: TableContext) => void): TableEdit =>
  (tableContext) => {
    applyChange(tableContext)
    return tableContext.startCell
  }

export const insertRow = (side: 'above' | 'below'): TableEdit =>
  keepingCursorCell(({ model, selectedArea }) =>
    rowsAndColumns.insertRow(model, side === 'above' ? selectedArea.top : selectedArea.bottom),
  )

export const insertColumn = (side: 'left' | 'right', minWidth: number): TableEdit =>
  keepingCursorCell(({ model, selectedArea }) =>
    rowsAndColumns.insertColumn(model, side === 'left' ? selectedArea.left : selectedArea.right, minWidth),
  )

export const moveRows =
  (direction: -1 | 1): TableEdit =>
  ({ model, selectedArea, startCell }) =>
    arrange.moveRows(model, selectedArea, direction) ? startCell : undefined

export const moveColumns =
  (direction: -1 | 1): TableEdit =>
  ({ model, selectedArea, startCell }) =>
    arrange.moveColumns(model, selectedArea, direction) ? startCell : undefined

export const duplicateRows: TableEdit = keepingCursorCell(({ model, selectedArea }) =>
  arrange.duplicateRows(model, selectedArea),
)

export const duplicateColumns = (minWidth: number): TableEdit =>
  keepingCursorCell(({ model, selectedArea }) => arrange.duplicateColumns(model, selectedArea, minWidth))

export const deleteRows: TableEdit = ({ model, selectedArea }) => {
  rowsAndColumns.deleteRows(model, selectedArea.top, selectedArea.bottom)

  if (model.isEmpty) return null

  return model.grid[Math.min(selectedArea.top, model.rowCount - 1)][selectedArea.left]
}

export const deleteColumns: TableEdit = ({ model, selectedArea }) => {
  rowsAndColumns.deleteColumns(model, selectedArea.left, selectedArea.right)

  if (model.isEmpty) return null

  return model.grid[selectedArea.top][Math.min(selectedArea.left, model.columnCount - 1)]
}

export const deleteTable: TableEdit = ({ model }) => {
  model.grid = []
  model.rowIds = []

  return null
}

export const mergeCells: TableEdit = ({ model, selectedArea }) => merging.mergeCells(model, selectedArea)

export const splitCell: TableEdit = ({ model, startCell }) =>
  merging.splitCell(model, startCell) ? startCell : undefined

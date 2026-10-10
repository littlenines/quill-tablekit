import type { CellData } from '../model/TableModel'
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
    model.insertRow(side === 'above' ? selectedArea.top : selectedArea.bottom),
  )

export const insertColumn = (side: 'left' | 'right', minWidth: number): TableEdit =>
  keepingCursorCell(({ model, selectedArea }) =>
    model.insertColumn(side === 'left' ? selectedArea.left : selectedArea.right, minWidth),
  )

export const deleteRows: TableEdit = ({ model, selectedArea }) => {
  model.deleteRows(selectedArea.top, selectedArea.bottom)

  if (model.isEmpty) return null

  return model.grid[Math.min(selectedArea.top, model.rowCount - 1)][selectedArea.left]
}

export const deleteColumns: TableEdit = ({ model, selectedArea }) => {
  model.deleteColumns(selectedArea.left, selectedArea.right)

  if (model.isEmpty) return null

  return model.grid[selectedArea.top][Math.min(selectedArea.left, model.columnCount - 1)]
}

export const deleteTable: TableEdit = ({ model }) => {
  model.grid = []
  model.rowIds = []

  return null
}

export const mergeCells: TableEdit = ({ model, selectedArea }) => model.merge(selectedArea)

export const splitCell: TableEdit = ({ model, startCell }) => (model.split(startCell) ? startCell : undefined)

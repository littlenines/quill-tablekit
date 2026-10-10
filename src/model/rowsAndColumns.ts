import { indexes } from '../utils/array'
import { emptyCell, type CellData } from './cell'
import { makeId } from './cellValue'
import { sumOf } from './layout'
import type { TableModel } from './TableModel'

export const insertRow = (model: TableModel, rowIndex: number): CellData[] => {
  const newRow = indexes(model.columnCount).map((columnIndex) => {
    const cellAbove = model.grid[rowIndex - 1]?.[columnIndex]
    const cellBelow = model.grid[rowIndex]?.[columnIndex]

    if (cellAbove && cellAbove === cellBelow) return cellAbove

    return emptyCell((cellAbove ?? cellBelow)?.style)
  })

  model.grid.splice(rowIndex, 0, newRow)
  model.rowIds.splice(rowIndex, 0, makeId('row'))
  model.rowHeights.splice(rowIndex, 0, undefined)

  return newRow
}

export const insertColumn = (model: TableModel, columnIndex: number, minWidth = 1): void => {
  for (const row of model.grid) {
    const cellOnLeft = row[columnIndex - 1]
    const cellOnRight = row[columnIndex]
    const isInsideMergedCell = cellOnLeft && cellOnLeft === cellOnRight

    row.splice(columnIndex, 0, isInsideMergedCell ? cellOnLeft : emptyCell((cellOnLeft ?? cellOnRight)?.style))
  }

  if (!model.columnWidths) return

  const totalWidth = sumOf(model.columnWidths)
  const newWidth = model.columnWidths[columnIndex - 1] ?? model.columnWidths[columnIndex] ?? minWidth
  const scale = totalWidth / (totalWidth + newWidth)

  model.columnWidths.splice(columnIndex, 0, newWidth)
  model.columnWidths = model.columnWidths.map((width) => Math.max(minWidth, Math.round(width * scale)))
}

export const deleteRows = (model: TableModel, firstRow: number, endRow: number): void => {
  model.grid.splice(firstRow, endRow - firstRow)
  model.rowIds.splice(firstRow, endRow - firstRow)
  model.rowHeights.splice(firstRow, endRow - firstRow)
  model.normalize()
}

export const deleteColumns = (model: TableModel, firstColumn: number, endColumn: number): void => {
  for (const row of model.grid) row.splice(firstColumn, endColumn - firstColumn)

  model.columnWidths?.splice(firstColumn, endColumn - firstColumn)

  if (model.columnCount === 0) model.grid = []

  model.normalize()
}

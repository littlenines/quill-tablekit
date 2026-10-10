import { cellCopier } from './cell'
import { makeId } from './cellValue'
import type { CellArea } from './grid'
import { scaleColumnWidths, sumOf, swapNeighbors } from './layout'
import type { TableModel } from './TableModel'

type Direction = -1 | 1

// Grown until no merged cell crosses its edges, so it can be swapped with its neighbour as one block
const wholeRows = (model: TableModel, top: number, bottom: number): CellArea =>
  model.expandToWholeCells({ top, bottom, left: 0, right: model.columnCount })

const wholeColumns = (model: TableModel, left: number, right: number): CellArea =>
  model.expandToWholeCells({ top: 0, bottom: model.rowCount, left, right })

export const canMoveRows = (model: TableModel, area: CellArea, direction: Direction): boolean => {
  const rows = wholeRows(model, area.top, area.bottom)

  return direction < 0 ? rows.top > 0 : rows.bottom < model.rowCount
}

export const canMoveColumns = (model: TableModel, area: CellArea, direction: Direction): boolean => {
  const columns = wholeColumns(model, area.left, area.right)

  return direction < 0 ? columns.left > 0 : columns.right < model.columnCount
}

export const moveRows = (model: TableModel, area: CellArea, direction: Direction): boolean => {
  if (!canMoveRows(model, area, direction)) return false

  const rows = wholeRows(model, area.top, area.bottom)
  const neighborRow = direction < 0 ? rows.top - 1 : rows.bottom
  const neighbor = wholeRows(model, neighborRow, neighborRow + 1)
  const [upper, lower] = direction < 0 ? [neighbor, rows] : [rows, neighbor]

  swapNeighbors(model.grid, upper.top, lower.top, lower.bottom)
  swapNeighbors(model.rowIds, upper.top, lower.top, lower.bottom)
  swapNeighbors(model.rowHeights, upper.top, lower.top, lower.bottom)

  return true
}

export const moveColumns = (model: TableModel, area: CellArea, direction: Direction): boolean => {
  if (!canMoveColumns(model, area, direction)) return false

  const columns = wholeColumns(model, area.left, area.right)
  const neighborColumn = direction < 0 ? columns.left - 1 : columns.right
  const neighbor = wholeColumns(model, neighborColumn, neighborColumn + 1)
  const [leftBlock, rightBlock] = direction < 0 ? [neighbor, columns] : [columns, neighbor]

  for (const row of model.grid) swapNeighbors(row, leftBlock.left, rightBlock.left, rightBlock.right)

  if (model.columnWidths) swapNeighbors(model.columnWidths, leftBlock.left, rightBlock.left, rightBlock.right)

  return true
}

export const duplicateRows = (model: TableModel, area: CellArea): void => {
  const rows = wholeRows(model, area.top, area.bottom)
  const copyOf = cellCopier()
  const copiedRows = model.grid.slice(rows.top, rows.bottom).map((row) => row.map(copyOf))

  model.grid.splice(rows.bottom, 0, ...copiedRows)
  model.rowIds.splice(rows.bottom, 0, ...copiedRows.map(() => makeId('row')))
  model.rowHeights.splice(rows.bottom, 0, ...model.rowHeights.slice(rows.top, rows.bottom))
}

export const duplicateColumns = (model: TableModel, area: CellArea, minWidth = 1): void => {
  const columns = wholeColumns(model, area.left, area.right)
  const copyOf = cellCopier()

  for (const row of model.grid) row.splice(columns.right, 0, ...row.slice(columns.left, columns.right).map(copyOf))

  if (!model.columnWidths) return

  const totalWidth = sumOf(model.columnWidths)

  model.columnWidths.splice(columns.right, 0, ...model.columnWidths.slice(columns.left, columns.right))
  model.columnWidths = scaleColumnWidths(model.columnWidths, totalWidth - sumOf(model.columnWidths), minWidth)
}

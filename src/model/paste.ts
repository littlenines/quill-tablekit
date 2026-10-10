import { emptyContentKeepingLineFormat } from './cell'
import { cellAreas, type CellArea } from './grid'
import { insertColumn, insertRow } from './rowsAndColumns'
import type { TableModel } from './TableModel'

export interface PasteLimits {
  maxRows: number
  maxColumns: number
  minColumnWidth: number
}

const startsAt = (area: CellArea | undefined, rowIndex: number, columnIndex: number) =>
  area?.top === rowIndex && area.left === columnIndex

export const pasteTable = (
  target: TableModel,
  source: TableModel,
  top: number,
  left: number,
  limits: PasteLimits,
): CellArea => {
  const neededRows = Math.min(limits.maxRows, top + source.rowCount)
  const neededColumns = Math.min(limits.maxColumns, left + source.columnCount)

  while (target.rowCount < neededRows) insertRow(target, target.rowCount)

  while (target.columnCount < neededColumns) insertColumn(target, target.columnCount, limits.minColumnWidth)

  const targetAreas = cellAreas(target.grid)
  const sourceAreas = cellAreas(source.grid)

  for (const [sourceRow, sourceCells] of source.grid.entries()) {
    for (const [sourceColumn, sourceCell] of sourceCells.entries()) {
      const targetRow = top + sourceRow
      const targetColumn = left + sourceColumn
      const targetCell = target.grid[targetRow]?.[targetColumn]

      if (!targetCell || !startsAt(targetAreas.get(targetCell), targetRow, targetColumn)) continue

      const isSourceCellStart = startsAt(sourceAreas.get(sourceCell), sourceRow, sourceColumn)

      targetCell.content = isSourceCellStart ? sourceCell.content : emptyContentKeepingLineFormat(targetCell.content)
      targetCell.style = { ...sourceCell.style }
    }
  }

  return {
    top,
    left,
    bottom: Math.min(target.rowCount, top + source.rowCount),
    right: Math.min(target.columnCount, left + source.columnCount),
  }
}

import type { TableModel } from './TableModel'

const foldRowHeightIntoRowAbove = (model: TableModel, rowIndex: number): void => {
  const [removedHeight] = model.rowHeights.splice(rowIndex, 1)
  const heightAbove = model.rowHeights[rowIndex - 1]

  model.rowHeights[rowIndex - 1] = heightAbove && removedHeight ? heightAbove + removedHeight : undefined
}

// Rows and columns where no cell starts can't be written as lines,
// so they'd disappear the next time the table is read and leave the spans wrong
export const removeEmptyRowsAndColumns = (model: TableModel): void => {
  for (let rowIndex = model.rowCount - 1; rowIndex > 0; rowIndex--) {
    const rowAbove = model.grid[rowIndex - 1]
    const isCoveredFromAbove = model.grid[rowIndex].every((cell, columnIndex) => cell === rowAbove[columnIndex])

    if (isCoveredFromAbove) {
      model.grid.splice(rowIndex, 1)
      model.rowIds.splice(rowIndex, 1)
      foldRowHeightIntoRowAbove(model, rowIndex)
    }
  }

  for (let columnIndex = model.columnCount - 1; columnIndex > 0; columnIndex--) {
    const isCoveredFromLeft = model.grid.every((row) => row[columnIndex] === row[columnIndex - 1])

    if (!isCoveredFromLeft) continue

    for (const row of model.grid) row.splice(columnIndex, 1)

    if (model.columnWidths) {
      model.columnWidths[columnIndex - 1] += model.columnWidths[columnIndex]
      model.columnWidths.splice(columnIndex, 1)
    }
  }
}

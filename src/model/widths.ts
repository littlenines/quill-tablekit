import { equalColumnWidths, scaleColumnWidths, sumOf } from './layout'
import type { TableModel } from './TableModel'

// A table without saved widths is full width with equal columns
export const hasEqualColumns = ({ columnWidths }: TableModel): boolean => {
  const widths = columnWidths ?? []

  return widths.every((width) => Math.abs(width - widths[0]) <= 1)
}

export const equalizeColumnWidths = (model: TableModel): void => {
  if (model.columnWidths) model.columnWidths = equalColumnWidths(model.columnWidths)
}

export const fitToWidth = (model: TableModel, tableWidth: number, minWidth: number): void => {
  if (!model.columnWidths || !Number.isFinite(tableWidth) || tableWidth <= 0) return

  const widthChange = tableWidth - sumOf(model.columnWidths)

  model.columnWidths = scaleColumnWidths(model.columnWidths, widthChange, minWidth, tableWidth)
}

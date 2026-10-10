import { Delta } from '../utils/quill'
import { emptyCell, isEmptyContent, type CellData } from './cell'
import type { CellArea } from './grid'
import type { TableModel } from './TableModel'

export const mergeCells = (model: TableModel, selectedArea: CellArea): CellData | null => {
  const area = model.expandToWholeCells(selectedArea)
  const cellsToMerge = model.cellsInArea(area)

  if (cellsToMerge.length < 2) return null

  const mergedCell = model.grid[area.top][area.left]
  const cellsWithText = cellsToMerge.filter(({ content }) => !isEmptyContent(content))

  if (cellsWithText.length > 0) {
    mergedCell.content = cellsWithText.reduce((content, cell) => content.concat(cell.content), new Delta())
  }

  for (let rowIndex = area.top; rowIndex < area.bottom; rowIndex++) {
    model.grid[rowIndex].fill(mergedCell, area.left, area.right)
  }

  model.normalize()
  return mergedCell
}

export const splitCell = (model: TableModel, mergedCell: CellData): boolean => {
  const area = model.areaOf(mergedCell)

  if (!area || (area.bottom - area.top === 1 && area.right - area.left === 1)) return false

  for (let rowIndex = area.top; rowIndex < area.bottom; rowIndex++) {
    for (let columnIndex = area.left; columnIndex < area.right; columnIndex++) {
      const isTopLeft = rowIndex === area.top && columnIndex === area.left

      if (!isTopLeft) model.grid[rowIndex][columnIndex] = emptyCell(mergedCell.style)
    }
  }

  return true
}

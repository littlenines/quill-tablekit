import type Quill from 'quill'
import type { Range } from 'quill'
import type { TableContainer } from '../blots'
import { combineAreas, type CellArea } from '../model/grid'
import type { CellData } from '../model/cell'
import { TableModel } from '../model/TableModel'
import type { Delta } from '../utils/quill'
import { lastSelectedLine, lineAt, tableOf } from './selection'
import { percentBasis, useLayoutPixels } from './widthUnits'

export interface TableContext {
  tableBlot: TableContainer
  tableStart: number
  originalContents: Delta
  model: TableModel
  startCell: CellData
  selectedArea: CellArea
  caretOffset: number
}

export const readTable = (quill: Quill, tableBlot: TableContainer): TableContext => {
  const tableStart = quill.getIndex(tableBlot)
  const originalContents = quill.getContents(tableStart, tableBlot.length())
  const model = TableModel.fromDelta(originalContents)

  useLayoutPixels(model, percentBasis(quill))

  return {
    tableBlot,
    tableStart,
    originalContents,
    model,
    startCell: model.grid[0][0],
    selectedArea: { top: 0, left: 0, bottom: 1, right: 1 },
    caretOffset: 0,
  }
}

export const getTableContext = (quill: Quill, range: Range | null): TableContext | null => {
  if (!range) return null

  const startLine = lineAt(quill, range.index)
  const tableBlot = startLine && tableOf(startLine)

  if (!startLine || !tableBlot) return null

  const tableContext = readTable(quill, tableBlot)
  const { model } = tableContext
  const startCell = model.findCell(startLine.cellValue.cell)

  if (!startCell) return null

  const endLine = lastSelectedLine(quill, range)
  const isEndInSameTable = endLine && tableOf(endLine) === tableBlot
  const endCell = (isEndInSameTable && model.findCell(endLine.cellValue.cell)) || startCell
  const startArea = model.areaOf(startCell)
  const endArea = model.areaOf(endCell)

  if (!startArea || !endArea) return null

  const startCellIndex = tableContext.tableStart + model.cellOffset(startCell.id)
  const caretOffset = Math.max(0, range.index - startCellIndex)

  return {
    ...tableContext,
    startCell,
    selectedArea: model.expandToWholeCells(combineAreas(startArea, endArea)),
    caretOffset: Math.min(caretOffset, startCell.content.length() - 1),
  }
}

export const canMerge = ({ model, selectedArea }: TableContext) => model.cellsInArea(selectedArea).length > 1

export const canSplit = ({ model, startCell }: TableContext): boolean => {
  const cellArea = model.areaOf(startCell)

  return cellArea != null && (cellArea.bottom - cellArea.top > 1 || cellArea.right - cellArea.left > 1)
}

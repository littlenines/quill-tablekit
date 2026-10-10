import Quill from 'quill'
import type { Range } from 'quill'
import { TableContainer } from '../blots'
import type { CellData } from '../model/cell'
import { clearContent } from '../model/cellChanges'
import { pasteTable, type PasteLimits } from '../model/paste'
import { insertRow } from '../model/rowsAndColumns'
import { TableModel } from '../model/TableModel'
import { Delta } from '../utils/quill'
import { getTableContext, readTable, type TableContext } from './context'
import type { TableEdit } from './edits'
import type { TableChange } from './properties'
import { deleteSelection, lastSelectedLine, lineAt, needsTableAwareDelete, tableOf } from './selection'

export const updateWithHistory = (quill: Quill, documentChange: Delta): void => {
  quill.history.cutoff()
  quill.updateContents(documentChange, 'user')
  quill.history.cutoff()
}

export const commitTable = (
  quill: Quill,
  { model, originalContents, tableStart }: TableContext,
  cellToFocus: CellData | null,
  caretOffset = 0,
): void => {
  const updatedContents = model.isEmpty ? new Delta() : model.toDelta()
  const contentChange = originalContents.diff(updatedContents)

  if (contentChange.ops.length > 0) updateWithHistory(quill, new Delta().retain(tableStart).concat(contentChange))

  if (cellToFocus) {
    const cellOffset = model.cellOffset(cellToFocus.id)

    if (cellOffset >= 0) quill.setSelection(tableStart + cellOffset + caretOffset, 0, 'user')
  } else if (model.isEmpty) {
    quill.setSelection(Math.min(tableStart, quill.getLength() - 1), 0, 'user')
  }
}

export const runEdit = (quill: Quill, range: Range | null, edit: TableEdit): void => {
  if (!quill.isEnabled()) return

  const tableContext = getTableContext(quill, range)

  if (!tableContext) return

  const cellBeforeEdit = tableContext.startCell
  const cellToFocus = edit(tableContext)

  if (cellToFocus === undefined) return

  const caretOffset = cellToFocus === cellBeforeEdit ? tableContext.caretOffset : 0

  commitTable(quill, tableContext, cellToFocus, caretOffset)
}

export const insertTable = (quill: Quill, range: Range, rowCount: number, columnCount: number): void => {
  if (lineAt(quill, range.index)) return

  const [currentLine] = quill.getLine(range.index)

  if (!currentLine) return

  const isEmptyLine = currentLine.length() <= 1
  const insertIndex = quill.getIndex(currentLine) + (isEmptyLine ? 0 : currentLine.length())
  const isAtDocumentEnd = insertIndex >= quill.getLength()
  let tableContents = TableModel.create(rowCount, columnCount).toDelta()

  if (!isEmptyLine && isAtDocumentEnd) tableContents = tableContents.insert('\n')

  updateWithHistory(quill, new Delta().retain(insertIndex).concat(tableContents))
  quill.setSelection(insertIndex, 0, 'user')
}

export interface TableLayout {
  columnWidths?: number[] | null
  rowHeights?: (number | null | undefined)[] | null
}

export const setTableLayout = (
  quill: Quill,
  table: HTMLTableElement | TableContainer,
  { columnWidths, rowHeights }: TableLayout,
): void => {
  const tableBlot = table instanceof TableContainer ? table : Quill.find(table)

  if (!(tableBlot instanceof TableContainer)) return

  const tableContext = readTable(quill, tableBlot)

  if (columnWidths !== undefined) tableContext.model.setColumnWidths(columnWidths)
  if (rowHeights !== undefined) tableContext.model.setRowHeights(rowHeights)

  commitTable(quill, tableContext, null)
}

export const moveToCell = (quill: Quill, range: Range | null, direction: 1 | -1): boolean => {
  const tableContext = getTableContext(quill, range)

  if (!tableContext) return false

  const { model, startCell, tableStart } = tableContext
  const cellsInOrder = model.orderedCells().map(({ cell }) => cell)
  const targetPosition = cellsInOrder.indexOf(startCell) + direction
  let targetCell = targetPosition >= 0 ? cellsInOrder[targetPosition] : undefined

  if (!targetCell && direction === 1) {
    ;[targetCell] = insertRow(model, model.rowCount)
    commitTable(quill, tableContext, null)
  }

  if (!targetCell) return true

  const targetOffset = model.cellOffset(targetCell.id)
  const targetTextLength = Math.max(0, targetCell.content.length() - 1)

  quill.setSelection(tableStart + targetOffset, targetTextLength, 'user')
  return true
}

export const changeTable = (quill: Quill, range: Range | null, change: TableChange): void => {
  if (!quill.isEnabled()) return

  const tableContext = getTableContext(quill, range)

  if (!tableContext) return

  change(tableContext)
  commitTable(quill, tableContext, null)
}

export const selectCells = (quill: Quill, range: Range | null, wholeLines: 'rows' | 'columns'): void => {
  const tableContext = getTableContext(quill, range)

  if (!tableContext) return

  const { model, selectedArea, tableStart } = tableContext
  const area =
    wholeLines === 'rows'
      ? { ...selectedArea, left: 0, right: model.columnCount }
      : { ...selectedArea, top: 0, bottom: model.rowCount }
  const cellPositions = model
    .cellsInArea(model.expandToWholeCells(area))
    .map((cell) => ({ start: model.cellOffset(cell.id), textLength: cell.content.length() - 1 }))
    .sort((first, second) => first.start - second.start)
  const firstCell = cellPositions[0]
  const lastCell = cellPositions.at(-1)

  if (!firstCell || !lastCell) return

  const selectionLength = lastCell.start + lastCell.textLength - firstCell.start

  quill.setSelection(tableStart + firstCell.start, selectionLength, 'user')
}

export const insertParagraph = (quill: Quill, range: Range | null, side: 'above' | 'below'): void => {
  if (!quill.isEnabled()) return

  const tableContext = getTableContext(quill, range)

  if (!tableContext) return

  const { tableStart, tableBlot } = tableContext
  const paragraphIndex = side === 'above' ? tableStart : tableStart + tableBlot.length()

  updateWithHistory(quill, new Delta().retain(paragraphIndex).insert('\n'))
  quill.setSelection(paragraphIndex, 0, 'user')
}

export const selectedCellsContext = (quill: Quill, range: Range): TableContext | null => {
  if (range.length === 0) return null

  const startLine = lineAt(quill, range.index)
  const endLine = lastSelectedLine(quill, range)

  if (!startLine || !endLine || tableOf(startLine) !== tableOf(endLine)) return null
  if (startLine.cellValue.cell === endLine.cellValue.cell) return null

  return getTableContext(quill, range)
}

export const deleteSelectedContent = (quill: Quill, range: Range): boolean => {
  const tableContext = selectedCellsContext(quill, range)

  if (tableContext) {
    const { model, selectedArea, startCell } = tableContext

    clearContent(model.cellsInArea(selectedArea))
    commitTable(quill, tableContext, startCell)

    return true
  }

  if (!needsTableAwareDelete(quill, range)) return false

  deleteSelection(quill, range)
  return true
}

export const pasteTableIntoCells = (
  quill: Quill,
  tableContext: TableContext,
  pastedContent: Delta,
  limits: PasteLimits,
): void => {
  const { model, selectedArea } = tableContext
  const pastedTable = TableModel.fromDelta(pastedContent)
  const pastedArea = pasteTable(model, pastedTable, selectedArea.top, selectedArea.left, limits)

  commitTable(quill, tableContext, model.grid[pastedArea.top][pastedArea.left])
}

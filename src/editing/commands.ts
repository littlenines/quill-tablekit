import Quill from 'quill'
import type { Range } from 'quill'
import { TableContainer } from '../blots'
import { TableModel, type CellData } from '../model/TableModel'
import { Delta } from '../utils/quill'
import { getTableContext, readTable, type TableContext } from './context'
import type { TableEdit } from './edits'
import { lineAt } from './selection'

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

export const setColumnWidths = (
  quill: Quill,
  table: HTMLTableElement | TableContainer,
  columnWidths: number[] | null,
): void => {
  const tableBlot = table instanceof TableContainer ? table : Quill.find(table)

  if (!(tableBlot instanceof TableContainer)) return

  const tableContext = readTable(quill, tableBlot)

  tableContext.model.setColumnWidths(columnWidths)
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
    ;[targetCell] = model.insertRow(model.rowCount)
    commitTable(quill, tableContext, null)
  }

  if (!targetCell) return true

  const targetOffset = model.cellOffset(targetCell.id)
  const targetTextLength = Math.max(0, targetCell.content.length() - 1)

  quill.setSelection(tableStart + targetOffset, targetTextLength, 'user')
  return true
}

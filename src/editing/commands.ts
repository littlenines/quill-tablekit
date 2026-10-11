import Quill from 'quill'
import type { Range } from 'quill'
import { TableContainer } from '../blots'
import { withLinesKeptInPlace } from '../blots/lengthCache'
import { CELL_FORMAT } from '../config/constants'
import type { TableCellValue } from '../model/cellValue'
import type { CellData } from '../model/cell'
import type { WidthUnit } from '../model/properties'
import { TableModel } from '../model/TableModel'
import { Delta } from '../utils/quill'
import { getTableContext, readTable, type TableContext } from './context'
import type { TableEdit } from './edits'
import type { TableChange } from './properties'
import { lineAt, tableOf } from './selection'
import { percentBasis, widthsToSave } from './widthUnits'

export const updateWithHistory = (quill: Quill, documentChange: Delta): void => {
  quill.history.cutoff()
  quill.updateContents(documentChange, 'user')
  quill.history.cutoff()
}

const lineIdsOf = (contents: Delta) =>
  contents.ops.flatMap(({ attributes }) => {
    const cellValue = attributes?.[CELL_FORMAT] as TableCellValue | undefined

    return cellValue ? [`${cellValue.table} ${cellValue.row} ${cellValue.cell}`] : []
  })

const onlyFormatsLines = (contentChange: Delta, originalContents: Delta, updatedContents: Delta): boolean => {
  if (contentChange.ops.some((operation) => operation.retain == null)) return false

  const originalIds = lineIdsOf(originalContents)
  const updatedIds = lineIdsOf(updatedContents)

  return originalIds.length === updatedIds.length && originalIds.every((lineId, index) => lineId === updatedIds[index])
}

export const commitTable = (
  quill: Quill,
  { model, originalContents, tableStart }: TableContext,
  cellToFocus: CellData | null,
  caretOffset = 0,
): void => {
  const updatedContents = model.isEmpty ? new Delta() : model.toDelta(widthsToSave(model, percentBasis(quill)))
  const contentChange = originalContents.diff(updatedContents)

  if (contentChange.ops.length > 0) {
    const documentChange = new Delta().retain(tableStart).concat(contentChange)

    if (onlyFormatsLines(contentChange, originalContents, updatedContents)) {
      withLinesKeptInPlace(() => updateWithHistory(quill, documentChange))
    } else {
      updateWithHistory(quill, documentChange)
    }
  }

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

const insertBelowTable = (quill: Quill, tableBlot: TableContainer, tableContents: Delta): void => {
  const tableEnd = quill.getIndex(tableBlot) + tableBlot.length()
  const isAtDocumentEnd = tableEnd >= quill.getLength()
  const contents = new Delta().insert('\n').concat(tableContents)

  updateWithHistory(quill, new Delta().retain(tableEnd).concat(isAtDocumentEnd ? contents.insert('\n') : contents))
  quill.setSelection(tableEnd + 1, 0, 'user')
}

export const insertTable = (quill: Quill, range: Range, rowCount: number, columnCount: number): void => {
  const cellLine = lineAt(quill, range.index)
  const currentTable = cellLine && tableOf(cellLine)
  let tableContents = TableModel.create(rowCount, columnCount).toDelta()

  if (currentTable) {
    insertBelowTable(quill, currentTable, tableContents)
    return
  }

  const [currentLine] = quill.getLine(range.index)

  if (!currentLine) return

  const isEmptyLine = currentLine.length() <= 1
  const insertIndex = quill.getIndex(currentLine) + (isEmptyLine ? 0 : currentLine.length())
  const isAtDocumentEnd = insertIndex >= quill.getLength()

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
  widthUnit?: WidthUnit,
): void => {
  const tableBlot = table instanceof TableContainer ? table : Quill.find(table)

  if (!(tableBlot instanceof TableContainer)) return

  const tableContext = readTable(quill, tableBlot)

  if (columnWidths !== undefined) tableContext.model.setColumnWidths(columnWidths)
  if (columnWidths !== undefined && widthUnit) tableContext.model.widthUnit = widthUnit
  if (rowHeights !== undefined) tableContext.model.setRowHeights(rowHeights)

  commitTable(quill, tableContext, null)
}

export const changeTable = (quill: Quill, range: Range | null, change: TableChange): void => {
  if (!quill.isEnabled()) return

  const tableContext = getTableContext(quill, range)

  if (!tableContext) return

  change(tableContext)
  commitTable(quill, tableContext, null)
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

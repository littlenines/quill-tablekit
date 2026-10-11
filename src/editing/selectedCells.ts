import type Quill from 'quill'
import type { Range } from 'quill'
import { clearContent } from '../model/operations/cellChanges'
import { commitTable } from './commands'
import { getTableContext, type TableContext } from './context'
import { deleteSelection, lastSelectedLine, lineAt, needsTableAwareDelete, tableOf } from './selection'

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

import type Quill from 'quill'
import type { Range } from 'quill'
import { TableCell, TableRow } from '../../blots'
import { insertRow } from '../../model/operations/rowsAndColumns'
import { commitTable } from '../commands'
import { getTableContext } from '../context'
import { lineAt } from '../selection'

// Moving one cell over doesn't need to read the whole table
const adjacentCell = (cell: TableCell, direction: 1 | -1): TableCell | null => {
  const sibling = direction > 0 ? cell.next : cell.prev

  if (sibling instanceof TableCell) return sibling

  const row = direction > 0 ? cell.parent.next : cell.parent.prev
  const edgeCell = row instanceof TableRow ? (direction > 0 ? row.children.head : row.children.tail) : null

  return edgeCell instanceof TableCell ? edgeCell : null
}

const selectCellText = (quill: Quill, cellStart: number, cellLength: number) => {
  quill.setSelection(cellStart, Math.max(0, cellLength - 1), 'user')
}

const addRowAndMoveThere = (quill: Quill, range: Range): void => {
  const tableContext = getTableContext(quill, range)

  if (!tableContext) return

  const { model, tableStart } = tableContext
  const [newCell] = insertRow(model, model.rowCount)

  commitTable(quill, tableContext, null)
  selectCellText(quill, tableStart + model.cellOffset(newCell.id), newCell.content.length())
}

export const moveToCell = (quill: Quill, range: Range | null, direction: 1 | -1): boolean => {
  const cell = range ? lineAt(quill, range.index)?.parent : null

  if (!range || !(cell instanceof TableCell)) return false

  const targetCell = adjacentCell(cell, direction)

  if (targetCell) selectCellText(quill, quill.getIndex(targetCell), targetCell.length())
  else if (direction > 0) addRowAndMoveThere(quill, range)

  return true
}

import Quill from 'quill'
import type { Range } from 'quill'
import type { CellData } from '../model/cell'
import { Parchment } from '../utils/quill'
import { getTableContext } from './context'

interface CaretPoint {
  node: Node
  offset: number
}

type DocumentWithCaretPosition = Document & {
  caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null
}

const caretPointAt = (clientX: number, clientY: number): CaretPoint | null => {
  const { caretPositionFromPoint } = document as DocumentWithCaretPosition

  if (caretPositionFromPoint) {
    const position = caretPositionFromPoint.call(document, clientX, clientY)

    return position && { node: position.offsetNode, offset: position.offset }
  }

  const caretRange = document.caretRangeFromPoint?.(clientX, clientY)

  return caretRange && { node: caretRange.startContainer, offset: caretRange.startOffset }
}

const isOnSameVisualLine = (quill: Quill, firstIndex: number, secondIndex: number): boolean => {
  const firstBounds = quill.getBounds(firstIndex)
  const secondBounds = quill.getBounds(secondIndex)

  if (!firstBounds || !secondBounds) return true

  return Math.abs(firstBounds.top - secondBounds.top) < Math.max(4, firstBounds.height / 2)
}

const caretClientX = (quill: Quill, index: number): number | null => {
  const caretBounds = quill.getBounds(index)

  return caretBounds ? quill.container.getBoundingClientRect().left + caretBounds.left : null
}

const indexAtPoint = (quill: Quill, cellElement: HTMLElement, clientX: number, clientY: number): number | null => {
  const caretPoint = caretPointAt(clientX, clientY)

  if (!caretPoint || !cellElement.contains(caretPoint.node)) return null

  const blot = Quill.find(caretPoint.node, true)

  if (!(blot instanceof Parchment.LeafBlot) && !(blot instanceof Parchment.ParentBlot)) return null

  const isTextPoint = caretPoint.node.nodeType === Node.TEXT_NODE

  return quill.getIndex(blot) + (isTextPoint ? caretPoint.offset : 0)
}

const cellElementOf = (tableElement: HTMLElement, cell: CellData) =>
  [...tableElement.querySelectorAll<HTMLElement>('td')].find((cellElement) => cellElement.dataset.cell === cell.id)

const lineEdge = (quill: Quill, index: number, direction: -1 | 1): number => {
  const [line, offsetInLine] = quill.getLine(index)
  const lineStart = index - offsetInLine

  return direction < 0 || !line ? lineStart : lineStart + line.length() - 1
}

const leaveTable = (quill: Quill, index: number, tableStart: number, tableEnd: number, direction: -1 | 1) => {
  const indexOutside = direction < 0 ? tableStart - 1 : tableEnd
  const hasLineOutside = indexOutside >= 0 && indexOutside < quill.getLength()

  quill.setSelection(hasLineOutside ? indexOutside : lineEdge(quill, index, direction), 0, 'user')
  return true
}

export const moveVertically = (quill: Quill, range: Range | null, direction: -1 | 1): boolean => {
  const tableContext = range?.length === 0 ? getTableContext(quill, range) : null

  if (!range || !tableContext) return false

  const { model, startCell, tableStart, tableBlot } = tableContext
  const cellStart = tableStart + model.cellOffset(startCell.id)
  const cellEnd = cellStart + startCell.content.length() - 1
  const cellArea = model.areaOf(startCell)

  if (!cellArea || !isOnSameVisualLine(quill, range.index, direction < 0 ? cellStart : cellEnd)) return false

  const targetRow = direction < 0 ? cellArea.top - 1 : cellArea.bottom
  const rowCells = model.grid[targetRow]?.slice(cellArea.left, cellArea.right)

  if (!rowCells?.length) return leaveTable(quill, range.index, tableStart, tableStart + tableBlot.length(), direction)

  const tableElement = tableBlot.domNode as HTMLElement
  const clientX = caretClientX(quill, range.index)
  const cellUnderCaret = rowCells.find((cell) => {
    const cellBox = cellElementOf(tableElement, cell)?.getBoundingClientRect()

    return clientX != null && cellBox != null && clientX >= cellBox.left && clientX < cellBox.right
  })
  const targetCell = cellUnderCaret ?? rowCells[0]
  const targetStart = tableStart + model.cellOffset(targetCell.id)
  const targetEnd = targetStart + targetCell.content.length() - 1
  const targetElement = cellElementOf(tableElement, targetCell)
  const lineElements = targetElement ? [...targetElement.children] : []
  const lineElement = direction < 0 ? lineElements.at(-1) : lineElements[0]
  const lineBoxes = lineElement ? [...lineElement.getClientRects()] : []
  const lineBox = direction < 0 ? lineBoxes.at(-1) : lineBoxes[0]
  const pointIndex =
    targetElement && lineBox && clientX != null
      ? indexAtPoint(quill, targetElement, clientX, lineBox.top + lineBox.height / 2)
      : null
  const isInsideTarget = pointIndex != null && pointIndex >= targetStart && pointIndex <= targetEnd

  quill.setSelection(isInsideTarget ? pointIndex : direction < 0 ? targetEnd : targetStart, 0, 'user')
  return true
}

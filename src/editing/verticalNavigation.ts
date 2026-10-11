import Quill from 'quill'
import type { Range } from 'quill'
import { cellAreas } from '../model/grid'
import { tableGrid } from '../ui/domGrid'
import { Parchment } from '../utils/quill'
import { lineAt, tableOf } from './selection'

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

const cellRange = (quill: Quill, cellElement: HTMLElement): { start: number; end: number } | null => {
  const cellBlot = Quill.find(cellElement)

  if (!(cellBlot instanceof Parchment.ParentBlot)) return null

  const start = quill.getIndex(cellBlot)

  return { start, end: start + cellBlot.length() - 1 }
}

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

// Reads the grid from the <td> elements on the page, so moving one row doesn't need to read the whole table
export const moveVertically = (quill: Quill, range: Range | null, direction: -1 | 1): boolean => {
  const line = range?.length === 0 ? lineAt(quill, range.index) : null
  const tableBlot = line && tableOf(line)
  const cellElement = (line?.domNode as HTMLElement | undefined)?.closest('td')

  if (!range || !tableBlot || !cellElement) return false

  const tableElement = tableBlot.domNode as HTMLTableElement
  const grid = tableGrid(tableElement)
  const cellArea = cellAreas(grid).get(cellElement)
  const currentCell = cellRange(quill, cellElement)

  if (!cellArea || !currentCell) return false
  if (!isOnSameVisualLine(quill, range.index, direction < 0 ? currentCell.start : currentCell.end)) return false

  const targetRow = direction < 0 ? cellArea.top - 1 : cellArea.bottom
  const rowCells = [...new Set(grid[targetRow]?.slice(cellArea.left, cellArea.right))].filter(
    (rowCell): rowCell is HTMLTableCellElement => rowCell != null,
  )

  if (rowCells.length === 0) {
    const tableStart = quill.getIndex(tableBlot)

    return leaveTable(quill, range.index, tableStart, tableStart + tableBlot.length(), direction)
  }

  const clientX = caretClientX(quill, range.index)
  const cellUnderCaret = rowCells.find((rowCell) => {
    const cellBox = rowCell.getBoundingClientRect()

    return clientX != null && clientX >= cellBox.left && clientX < cellBox.right
  })
  const targetElement = cellUnderCaret ?? rowCells[0]
  const targetCell = cellRange(quill, targetElement)

  if (!targetCell) return false

  const { start: targetStart, end: targetEnd } = targetCell
  const lineElements = [...targetElement.children]
  const lineElement = direction < 0 ? lineElements.at(-1) : lineElements[0]
  const lineBoxes = lineElement ? [...lineElement.getClientRects()] : []
  const lineBox = direction < 0 ? lineBoxes.at(-1) : lineBoxes[0]
  const pointIndex =
    lineBox && clientX != null ? indexAtPoint(quill, targetElement, clientX, lineBox.top + lineBox.height / 2) : null
  const isInsideTarget = pointIndex != null && pointIndex >= targetStart && pointIndex <= targetEnd

  quill.setSelection(isInsideTarget ? pointIndex : direction < 0 ? targetEnd : targetStart, 0, 'user')
  return true
}

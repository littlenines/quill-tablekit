import { MIN_ROW_HEIGHT } from '../../config/constants'
import { sumOf } from '../../model/layout'
import type { TableAlign } from '../../model/properties'

// The table handle stays while the mouse is this close to the table
const KEEP_VISIBLE_DISTANCE = 24

export const canDragEdge = (edgeIndex: number, columnCount: number, alignment: TableAlign): boolean => {
  if (edgeIndex === 0) return alignment !== 'left'
  if (edgeIndex === columnCount) return alignment !== 'right'

  return true
}

export const tableLeftAfterResize = (startTableBox: DOMRect, alignment: TableAlign, newTotalWidth: number): number => {
  if (alignment === 'center') return startTableBox.left + (startTableBox.width - newTotalWidth) / 2
  if (alignment === 'right') return startTableBox.right - newTotalWidth

  return startTableBox.left
}

export const resizeColumns = (
  startWidths: number[],
  edgeIndex: number,
  dragDistance: number,
  minWidth: number,
  maxTableWidth = Infinity,
): number[] => {
  const newWidths = [...startWidths]
  const leftColumn = edgeIndex - 1
  const rightColumn = edgeIndex
  const roomToGrow = Math.max(0, maxTableWidth - sumOf(startWidths))

  if (edgeIndex === 0 && newWidths.length > 0) {
    const draggedWidth = Math.round(startWidths[0] - dragDistance)

    newWidths[0] = Math.max(minWidth, Math.min(draggedWidth, startWidths[0] + roomToGrow))
    return newWidths
  }

  if (leftColumn < 0 || leftColumn >= newWidths.length) return newWidths

  if (rightColumn === newWidths.length) {
    const draggedWidth = Math.round(startWidths[leftColumn] + dragDistance)

    newWidths[leftColumn] = Math.max(minWidth, Math.min(draggedWidth, startWidths[leftColumn] + roomToGrow))
    return newWidths
  }

  const pairWidth = startWidths[leftColumn] + startWidths[rightColumn]

  if (pairWidth < minWidth * 2) return newWidths

  const draggedWidth = Math.round(startWidths[leftColumn] + dragDistance)

  newWidths[leftColumn] = Math.min(pairWidth - minWidth, Math.max(minWidth, draggedWidth))
  newWidths[rightColumn] = pairWidth - newWidths[leftColumn]

  return newWidths
}

export const rowHeightAfterDrag = (startHeight: number, dragDistance: number, minHeight: number): number =>
  Math.max(minHeight, Math.round(startHeight + dragDistance))

export const savedHeightAfterDrag = (newHeight: number, minHeight: number): number | null =>
  newHeight <= minHeight + 1 ? null : newHeight

export const growRowHeights = (startHeights: number[], heightChange: number, minHeights: number[]): number[] => {
  const changePerRow = heightChange / startHeights.length

  return startHeights.map((height, rowIndex) =>
    Math.max(minHeights[rowIndex] ?? MIN_ROW_HEIGHT, Math.round(height + changePerRow)),
  )
}

export const hasChanged = (startSizes: number[], currentSizes: number[]) =>
  currentSizes.some((size, index) => size !== startSizes[index])

export const isNear = ({ left, top, right, bottom }: DOMRect, { clientX, clientY }: MouseEvent) =>
  clientX >= left - KEEP_VISIBLE_DISTANCE &&
  clientX <= right + KEEP_VISIBLE_DISTANCE &&
  clientY >= top - KEEP_VISIBLE_DISTANCE &&
  clientY <= bottom + KEEP_VISIBLE_DISTANCE

import type Quill from 'quill'
import { cellAreas } from '../model/grid'
import { sumOf } from '../model/layout'
import type { TableAlign } from '../model/properties'
import { editorContentWidth, editorInnerWidth } from '../utils/editorWidth'
import { createElement } from './dom'
import { followMouseUntilRelease, isPastWidthLimit, showPastLimit } from './dragging'
import { rowsBoxOf, startColumnWidths, scaleOf, tableAlignmentOf, tableGrid, toContainerPosition } from './domGrid'

const EDGE_GRAB_DISTANCE = 6

interface HoveredEdge {
  tableElement: HTMLTableElement
  edgeIndex: number
}

interface ActiveDrag extends HoveredEdge {
  alignment: TableAlign
  scale: number
  startTableBox: DOMRect
  startClientX: number
  startWidths: number[]
  currentWidths: number[]
}

const canDragEdge = (edgeIndex: number, columnCount: number, alignment: TableAlign): boolean => {
  if (edgeIndex === 0) return alignment !== 'left'
  if (edgeIndex === columnCount) return alignment !== 'right'

  return true
}

export const tableLeftAfterResize = (startTableBox: DOMRect, alignment: TableAlign, newTotalWidth: number): number => {
  if (alignment === 'center') return startTableBox.left + (startTableBox.width - newTotalWidth) / 2
  if (alignment === 'right') return startTableBox.right - newTotalWidth

  return startTableBox.left
}

export class ColumnResizer {
  #quill: Quill
  #container: HTMLElement
  #minWidth: number
  #saveWidths: (tableElement: HTMLTableElement, columnWidths: number[]) => void
  #handle = createElement('div', { className: 'qlt-col-handle' })
  #listeners = new AbortController()
  #dragListeners: AbortController | null = null
  #hoveredEdge: HoveredEdge | null = null
  #activeDrag: ActiveDrag | null = null

  constructor(
    quill: Quill,
    container: HTMLElement,
    minWidth: number,
    saveWidths: (tableElement: HTMLTableElement, columnWidths: number[]) => void,
  ) {
    this.#quill = quill
    this.#container = container
    this.#minWidth = minWidth
    this.#saveWidths = saveWidths

    const { signal } = this.#listeners

    this.#handle.addEventListener('mousedown', this.#startDrag, { signal })
    container.addEventListener('mousemove', this.#showHandleNearEdge, { signal })
    container.addEventListener('mouseleave', this.#hideHandle, { signal })
    container.append(this.#handle)
  }

  destroy(): void {
    this.#dragListeners?.abort()
    this.#listeners.abort()
    this.#handle.remove()
  }

  #showHandleNearEdge = (event: MouseEvent): void => {
    if (this.#activeDrag || event.target === this.#handle) return

    const hoveredEdge = this.#quill.isEnabled() ? this.#findEdgeUnderMouse(event) : null

    this.#hoveredEdge = hoveredEdge?.edge ?? null

    if (hoveredEdge) this.#placeHandle(hoveredEdge.edge.tableElement, hoveredEdge.edgeClientX)
    else this.#handle.style.display = 'none'
  }

  #hideHandle = (): void => {
    if (this.#activeDrag) return

    this.#hoveredEdge = null
    this.#handle.style.display = 'none'
  }

  #findEdgeUnderMouse(event: MouseEvent): { edge: HoveredEdge; edgeClientX: number } | null {
    const hoveredElement = event.target instanceof Element ? event.target : null
    const cellElement = hoveredElement?.closest<HTMLTableCellElement>('td.qlt-cell')

    if (!cellElement || !this.#quill.root.contains(cellElement)) return null

    const cellBox = cellElement.getBoundingClientRect()
    const isNearRightEdge = Math.abs(event.clientX - cellBox.right) <= EDGE_GRAB_DISTANCE
    const isNearLeftEdge = Math.abs(event.clientX - cellBox.left) <= EDGE_GRAB_DISTANCE

    if (!isNearRightEdge && !isNearLeftEdge) return null

    const tableElement = cellElement.closest('table')
    const grid = tableElement && tableGrid(tableElement)
    const cellArea = grid && cellAreas(grid).get(cellElement)

    if (!tableElement || !grid || !cellArea) return null

    const columnCount = grid[0]?.length ?? 0
    const alignment = tableAlignmentOf(tableElement)

    if (isNearRightEdge && canDragEdge(cellArea.right, columnCount, alignment)) {
      return { edge: { tableElement, edgeIndex: cellArea.right }, edgeClientX: cellBox.right }
    }

    if (isNearLeftEdge && canDragEdge(cellArea.left, columnCount, alignment)) {
      return { edge: { tableElement, edgeIndex: cellArea.left }, edgeClientX: cellBox.left }
    }

    return null
  }

  #placeHandle(tableElement: HTMLTableElement, edgeClientX: number): void {
    const tableBox = rowsBoxOf(tableElement)
    const { left, top } = toContainerPosition(this.#container, edgeClientX, tableBox.top)

    Object.assign(this.#handle.style, {
      display: 'block',
      left: `${left - 5}px`,
      top: `${top}px`,
      height: `${tableBox.height / scaleOf(tableElement)}px`,
    })
  }

  #startDrag = (event: MouseEvent): void => {
    if (!this.#hoveredEdge || event.button !== 0) return

    event.preventDefault()

    const { tableElement } = this.#hoveredEdge
    const startWidths = startColumnWidths(tableElement, editorInnerWidth(this.#quill))

    this.#activeDrag = {
      ...this.#hoveredEdge,
      alignment: tableAlignmentOf(tableElement),
      scale: scaleOf(tableElement),
      startTableBox: rowsBoxOf(tableElement),
      startClientX: event.clientX,
      startWidths,
      currentWidths: startWidths,
    }
    this.#handle.classList.add('is-dragging')
    this.#dragListeners = followMouseUntilRelease('qlt-resizing', this.#followMouse, this.#finishDrag)
  }

  #followMouse = (event: MouseEvent): void => {
    const drag = this.#activeDrag

    if (!drag) return

    const isOuterEdge = drag.edgeIndex === 0 || drag.edgeIndex === drag.startWidths.length
    const growsOnBothSides = isOuterEdge && drag.alignment === 'center'
    const dragDistance = ((event.clientX - drag.startClientX) / drag.scale) * (growsOnBothSides ? 2 : 1)
    const widthGrowth = drag.edgeIndex === 0 ? -dragDistance : dragDistance

    const maxTableWidth = editorContentWidth(this.#quill)

    drag.currentWidths = resizeColumns(drag.startWidths, drag.edgeIndex, dragDistance, this.#minWidth, maxTableWidth)
    showPastLimit(isOuterEdge && isPastWidthLimit(drag.startWidths, widthGrowth, maxTableWidth), this.#handle)

    const toScreen = (width: number) => width * drag.scale
    const tableLeft = tableLeftAfterResize(drag.startTableBox, drag.alignment, toScreen(sumOf(drag.currentWidths)))

    this.#placeHandle(drag.tableElement, tableLeft + toScreen(sumOf(drag.currentWidths.slice(0, drag.edgeIndex))))
  }

  #finishDrag = (): void => {
    const drag = this.#activeDrag

    this.#activeDrag = null
    this.#hoveredEdge = null
    this.#handle.classList.remove('is-dragging', 'is-past-limit')
    this.#handle.style.display = 'none'

    if (!drag) return

    const widthsChanged = drag.currentWidths.some((width, columnIndex) => width !== drag.startWidths[columnIndex])

    if (widthsChanged) this.#saveWidths(drag.tableElement, drag.currentWidths)
  }
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

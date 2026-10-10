import Quill from 'quill'
import { TableContainer } from '../blots'
import { cellAreas } from '../model/grid'
import { createElement } from './dom'
import { measureColumnWidths, tableGrid, toContainerPosition } from './domGrid'

const EDGE_GRAB_DISTANCE = 5

interface HoveredEdge {
  tableElement: HTMLTableElement
  edgeIndex: number
}

interface ActiveDrag extends HoveredEdge {
  startClientX: number
  startWidths: number[]
  currentWidths: number[]
}

const sumOf = (numbers: number[]) => numbers.reduce((total, number) => total + number, 0)

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
    this.#stopDrag()
    this.#listeners.abort()
    this.#handle.remove()
  }

  #showHandleNearEdge = (event: MouseEvent): void => {
    if (this.#activeDrag || event.target === this.#handle) return

    this.#hoveredEdge = this.#quill.isEnabled() ? this.#findEdgeUnderMouse(event) : null

    if (this.#hoveredEdge) this.#placeHandle(this.#hoveredEdge.tableElement, this.#edgeClientX(this.#hoveredEdge))
    else this.#handle.style.display = 'none'
  }

  #hideHandle = (): void => {
    if (this.#activeDrag) return

    this.#hoveredEdge = null
    this.#handle.style.display = 'none'
  }

  #findEdgeUnderMouse(event: MouseEvent): HoveredEdge | null {
    const hoveredElement = event.target instanceof Element ? event.target : null
    const cellElement = hoveredElement?.closest<HTMLTableCellElement>('td.qlt-cell')
    const tableElement = cellElement?.closest('table')

    if (!cellElement || !tableElement || !this.#quill.root.contains(cellElement)) return null

    const cellArea = cellAreas(tableGrid(tableElement)).get(cellElement)

    if (!cellArea) return null

    const cellBox = cellElement.getBoundingClientRect()
    const isNearRightEdge = Math.abs(event.clientX - cellBox.right) <= EDGE_GRAB_DISTANCE
    const isNearLeftEdge = cellArea.left > 0 && Math.abs(event.clientX - cellBox.left) <= EDGE_GRAB_DISTANCE

    if (isNearRightEdge) return { tableElement, edgeIndex: cellArea.right }
    if (isNearLeftEdge) return { tableElement, edgeIndex: cellArea.left }

    return null
  }

  #edgeClientX({ tableElement, edgeIndex }: HoveredEdge, columnWidths = measureColumnWidths(tableGrid(tableElement))) {
    return tableElement.getBoundingClientRect().left + sumOf(columnWidths.slice(0, edgeIndex))
  }

  #placeHandle(tableElement: HTMLTableElement, edgeClientX: number): void {
    const tableBox = tableElement.getBoundingClientRect()
    const { left, top } = toContainerPosition(this.#container, edgeClientX, tableBox.top)

    Object.assign(this.#handle.style, {
      display: 'block',
      left: `${left - 3}px`,
      top: `${top}px`,
      height: `${tableBox.height}px`,
    })
  }

  #startDrag = (event: MouseEvent): void => {
    if (!this.#hoveredEdge || event.button !== 0) return

    event.preventDefault()

    const startWidths = measureColumnWidths(tableGrid(this.#hoveredEdge.tableElement))

    this.#activeDrag = { ...this.#hoveredEdge, startClientX: event.clientX, startWidths, currentWidths: startWidths }
    this.#handle.classList.add('is-dragging')
    document.body.classList.add('qlt-resizing')

    this.#dragListeners = new AbortController()

    const { signal } = this.#dragListeners

    document.addEventListener('mousemove', this.#followMouse, { signal })
    document.addEventListener('mouseup', this.#finishDrag, { signal })
  }

  #followMouse = (event: MouseEvent): void => {
    const drag = this.#activeDrag

    if (!drag) return

    const dragDistance = event.clientX - drag.startClientX

    drag.currentWidths = resizeColumns(drag.startWidths, drag.edgeIndex, dragDistance, this.#minWidth)

    const tableBlot = Quill.find(drag.tableElement)

    if (tableBlot instanceof TableContainer) tableBlot.preview(drag.currentWidths)

    this.#placeHandle(drag.tableElement, this.#edgeClientX(drag, drag.currentWidths))
  }

  #finishDrag = (): void => {
    const drag = this.#activeDrag

    this.#stopDrag()

    if (!drag) return

    const tableBlot = Quill.find(drag.tableElement)
    const widthsChanged = drag.currentWidths.some((width, columnIndex) => width !== drag.startWidths[columnIndex])

    if (tableBlot instanceof TableContainer) tableBlot.preview(null)
    if (widthsChanged) this.#saveWidths(drag.tableElement, drag.currentWidths)
  }

  #stopDrag(): void {
    this.#activeDrag = null
    this.#dragListeners?.abort()
    this.#dragListeners = null
    this.#handle.classList.remove('is-dragging')
    document.body.classList.remove('qlt-resizing')
  }
}

export const resizeColumns = (
  startWidths: number[],
  edgeIndex: number,
  dragDistance: number,
  minWidth: number,
): number[] => {
  const newWidths = [...startWidths]
  const leftColumn = edgeIndex - 1
  const rightColumn = edgeIndex

  if (leftColumn < 0 || leftColumn >= newWidths.length) return newWidths

  if (rightColumn === newWidths.length) {
    newWidths[leftColumn] = Math.max(minWidth, Math.round(startWidths[leftColumn] + dragDistance))
    return newWidths
  }

  const pairWidth = startWidths[leftColumn] + startWidths[rightColumn]

  if (pairWidth < minWidth * 2) return newWidths

  const draggedWidth = Math.round(startWidths[leftColumn] + dragDistance)

  newWidths[leftColumn] = Math.min(pairWidth - minWidth, Math.max(minWidth, draggedWidth))
  newWidths[rightColumn] = pairWidth - newWidths[leftColumn]

  return newWidths
}

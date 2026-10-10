import type Quill from 'quill'
import { MIN_ROW_HEIGHT } from '../config/constants'
import { createElement } from './dom'
import { followMouseUntilRelease } from './dragging'
import { naturalRowHeight, savedRowHeights, scaleOf, toContainerPosition } from './domGrid'

const EDGE_GRAB_DISTANCE = 6

interface HoveredRowEdge {
  tableElement: HTMLTableElement
  rowIndex: number
}

interface RowDrag extends HoveredRowEdge {
  scale: number
  startClientY: number
  startEdgeClientY: number
  startHeight: number
  minHeight: number
  newHeight: number
}

export const rowHeightAfterDrag = (startHeight: number, dragDistance: number, minHeight: number): number =>
  Math.max(minHeight, Math.round(startHeight + dragDistance))

export const savedHeightAfterDrag = (newHeight: number, minHeight: number): number | null =>
  newHeight <= minHeight + 1 ? null : newHeight

export class RowResizer {
  #quill: Quill
  #container: HTMLElement
  #saveRowHeights: (tableElement: HTMLTableElement, rowHeights: (number | null)[]) => void
  #handle = createElement('div', { className: 'qlt-row-handle' })
  #listeners = new AbortController()
  #dragListeners: AbortController | null = null
  #hoveredEdge: HoveredRowEdge | null = null
  #activeDrag: RowDrag | null = null

  constructor(
    quill: Quill,
    container: HTMLElement,
    saveRowHeights: (tableElement: HTMLTableElement, rowHeights: (number | null)[]) => void,
  ) {
    this.#quill = quill
    this.#container = container
    this.#saveRowHeights = saveRowHeights

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

    this.#hoveredEdge = this.#quill.isEnabled() ? this.#findEdgeUnderMouse(event) : null

    if (this.#hoveredEdge) this.#placeHandle(this.#hoveredEdge.tableElement, this.#rowBottom(this.#hoveredEdge))
    else this.#handle.style.display = 'none'
  }

  #hideHandle = (): void => {
    if (this.#activeDrag) return

    this.#hoveredEdge = null
    this.#handle.style.display = 'none'
  }

  #findEdgeUnderMouse({ target, clientX, clientY }: MouseEvent): HoveredRowEdge | null {
    const hoveredElement = target instanceof Element ? target : null
    const tableElement = hoveredElement?.closest<HTMLTableElement>('table.qlt-table')

    if (!tableElement || !this.#quill.root.contains(tableElement)) return null

    const tableBox = tableElement.getBoundingClientRect()

    if (clientX < tableBox.left || clientX > tableBox.right) return null

    const rowIndex = Array.from(tableElement.rows).findIndex(
      (rowElement) => Math.abs(clientY - rowElement.getBoundingClientRect().bottom) <= EDGE_GRAB_DISTANCE,
    )

    return rowIndex >= 0 ? { tableElement, rowIndex } : null
  }

  #rowBottom({ tableElement, rowIndex }: HoveredRowEdge): number {
    return tableElement.rows[rowIndex]?.getBoundingClientRect().bottom ?? tableElement.getBoundingClientRect().bottom
  }

  #placeHandle(tableElement: HTMLTableElement, edgeClientY: number): void {
    const tableBox = tableElement.getBoundingClientRect()
    const { left, top } = toContainerPosition(this.#container, tableBox.left, edgeClientY)

    Object.assign(this.#handle.style, {
      display: 'block',
      left: `${left}px`,
      top: `${top - 5}px`,
      width: `${tableBox.width / scaleOf(tableElement)}px`,
    })
  }

  #startDrag = (event: MouseEvent): void => {
    if (!this.#hoveredEdge || event.button !== 0) return

    event.preventDefault()

    const { tableElement, rowIndex } = this.#hoveredEdge
    const rowElement = tableElement.rows[rowIndex]
    const rowBox = rowElement.getBoundingClientRect()
    const scale = scaleOf(tableElement)
    const startHeight = Math.round(rowBox.height / scale)

    this.#activeDrag = {
      ...this.#hoveredEdge,
      scale,
      startClientY: event.clientY,
      startEdgeClientY: rowBox.bottom,
      startHeight,
      minHeight: naturalRowHeight(rowElement, MIN_ROW_HEIGHT),
      newHeight: startHeight,
    }
    this.#handle.classList.add('is-dragging')
    this.#dragListeners = followMouseUntilRelease('qlt-resizing-rows', this.#followMouse, this.#finishDrag)
  }

  #followMouse = (event: MouseEvent): void => {
    const drag = this.#activeDrag

    if (!drag) return

    const dragDistance = (event.clientY - drag.startClientY) / drag.scale

    drag.newHeight = rowHeightAfterDrag(drag.startHeight, dragDistance, drag.minHeight)
    this.#placeHandle(drag.tableElement, drag.startEdgeClientY + (drag.newHeight - drag.startHeight) * drag.scale)
  }

  #finishDrag = (): void => {
    const drag = this.#activeDrag

    this.#activeDrag = null
    this.#hoveredEdge = null
    this.#handle.classList.remove('is-dragging')
    this.#handle.style.display = 'none'

    if (!drag) return

    const savedHeights = savedRowHeights(drag.tableElement)
    const newSavedHeight = savedHeightAfterDrag(drag.newHeight, drag.minHeight)

    if (newSavedHeight === (savedHeights[drag.rowIndex] ?? null)) return

    const rowHeights = savedHeights.map((savedHeight, rowIndex) =>
      rowIndex === drag.rowIndex ? newSavedHeight : (savedHeight ?? null),
    )

    this.#saveRowHeights(drag.tableElement, rowHeights)
  }
}

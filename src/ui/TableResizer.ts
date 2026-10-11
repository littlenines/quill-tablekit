import type Quill from 'quill'
import { MIN_ROW_HEIGHT } from '../config/constants'
import type { TableLayout } from '../editing/commands'
import { scaleColumnWidths, sumOf } from '../model/layout'
import type { TableAlign } from '../model/properties'
import { tableLeftAfterResize } from './ColumnResizer'
import { editorContentWidth, editorInnerWidth } from '../utils/editorWidth'
import { createElement } from './dom'
import { followMouseUntilRelease, isPastWidthLimit, showPastLimit } from './dragging'
import {
  measureRowHeights,
  naturalRowHeight,
  rowsBoxOf,
  scaleOf,
  startColumnWidths,
  tableAlignmentOf,
  toContainerPosition,
} from './domGrid'
import { savedHeightAfterDrag } from './RowResizer'

const HANDLE_SIZE = 12
const KEEP_VISIBLE_DISTANCE = 24

interface TableDrag {
  tableElement: HTMLTableElement
  alignment: TableAlign
  scale: number
  startTableBox: DOMRect
  startClientX: number
  startClientY: number
  startWidths: number[]
  startHeights: number[]
  minHeights: number[]
  currentWidths: number[]
  currentHeights: number[]
}

export const growRowHeights = (startHeights: number[], heightChange: number, minHeights: number[]): number[] => {
  const changePerRow = heightChange / startHeights.length

  return startHeights.map((height, rowIndex) =>
    Math.max(minHeights[rowIndex] ?? MIN_ROW_HEIGHT, Math.round(height + changePerRow)),
  )
}

const isNear = ({ left, top, right, bottom }: DOMRect, { clientX, clientY }: MouseEvent) =>
  clientX >= left - KEEP_VISIBLE_DISTANCE &&
  clientX <= right + KEEP_VISIBLE_DISTANCE &&
  clientY >= top - KEEP_VISIBLE_DISTANCE &&
  clientY <= bottom + KEEP_VISIBLE_DISTANCE

const hasChanged = (startSizes: number[], currentSizes: number[]) =>
  currentSizes.some((size, index) => size !== startSizes[index])

export class TableResizer {
  #quill: Quill
  #container: HTMLElement
  #minColumnWidth: number
  #saveLayout: (tableElement: HTMLTableElement, layout: TableLayout) => void
  #handle = createElement('div', { className: 'qlt-table-handle' })
  #outline = createElement('div', { className: 'qlt-table-outline' })
  #listeners = new AbortController()
  #dragListeners: AbortController | null = null
  #hoveredTable: HTMLTableElement | null = null
  #activeDrag: TableDrag | null = null

  constructor(
    quill: Quill,
    container: HTMLElement,
    minColumnWidth: number,
    saveLayout: (tableElement: HTMLTableElement, layout: TableLayout) => void,
  ) {
    this.#quill = quill
    this.#container = container
    this.#minColumnWidth = minColumnWidth
    this.#saveLayout = saveLayout

    const { signal } = this.#listeners

    this.#handle.addEventListener('mousedown', this.#startDrag, { signal })
    container.addEventListener('mousemove', this.#showHandleOnTable, { signal })
    container.addEventListener('mouseleave', this.#hideHandle, { signal })
    container.append(this.#outline, this.#handle)
  }

  destroy(): void {
    this.#dragListeners?.abort()
    this.#listeners.abort()
    this.#handle.remove()
    this.#outline.remove()
  }

  #showHandleOnTable = (event: MouseEvent): void => {
    if (this.#activeDrag || event.target === this.#handle) return

    const hoveredElement = event.target instanceof Element ? event.target : null
    const tableUnderMouse = hoveredElement?.closest<HTMLTableElement>('table.qlt-table') ?? null
    const lastTable = this.#hoveredTable?.isConnected ? this.#hoveredTable : null
    const tableElement =
      tableUnderMouse ?? (lastTable && isNear(lastTable.getBoundingClientRect(), event) ? lastTable : null)
    const isEditableTable = tableElement != null && this.#quill.isEnabled() && this.#quill.root.contains(tableElement)

    this.#hoveredTable = isEditableTable ? tableElement : null

    if (!this.#hoveredTable) {
      this.#handle.style.display = 'none'
      return
    }

    const tableBox = rowsBoxOf(this.#hoveredTable)
    const handleOnLeft = tableAlignmentOf(this.#hoveredTable) === 'right'

    this.#handle.classList.toggle('is-bottom-left', handleOnLeft)
    this.#placeHandle(handleOnLeft ? tableBox.left : tableBox.right, tableBox.bottom)
  }

  #hideHandle = (): void => {
    if (this.#activeDrag) return

    this.#hoveredTable = null
    this.#handle.style.display = 'none'
  }

  #placeHandle(clientX: number, clientY: number): void {
    const { left, top } = toContainerPosition(this.#container, clientX, clientY)

    Object.assign(this.#handle.style, {
      display: 'block',
      left: `${left - HANDLE_SIZE / 2}px`,
      top: `${top - HANDLE_SIZE / 2}px`,
    })
  }

  #startDrag = (event: MouseEvent): void => {
    if (!this.#hoveredTable || event.button !== 0) return

    event.preventDefault()

    const tableElement = this.#hoveredTable
    const startWidths = startColumnWidths(tableElement, editorInnerWidth(this.#quill))
    const startHeights = measureRowHeights(tableElement)
    const minHeights = Array.from(tableElement.rows, (rowElement) => naturalRowHeight(rowElement, MIN_ROW_HEIGHT))

    this.#activeDrag = {
      tableElement,
      alignment: tableAlignmentOf(tableElement),
      scale: scaleOf(tableElement),
      startTableBox: rowsBoxOf(tableElement),
      startClientX: event.clientX,
      startClientY: event.clientY,
      startWidths,
      startHeights,
      minHeights,
      currentWidths: startWidths,
      currentHeights: startHeights,
    }
    this.#handle.classList.add('is-dragging')
    this.#dragListeners = followMouseUntilRelease(
      this.#activeDrag.alignment === 'right' ? 'qlt-resizing-table-mirrored' : 'qlt-resizing-table',
      this.#followMouse,
      this.#finishDrag,
    )
  }

  #followMouse = (event: MouseEvent): void => {
    const drag = this.#activeDrag

    if (!drag) return

    const mouseDistance = (event.clientX - drag.startClientX) / drag.scale
    const widthChange =
      drag.alignment === 'center' ? mouseDistance * 2 : drag.alignment === 'right' ? -mouseDistance : mouseDistance

    const maxTableWidth = editorContentWidth(this.#quill)

    drag.currentWidths = scaleColumnWidths(drag.startWidths, widthChange, this.#minColumnWidth, maxTableWidth)
    showPastLimit(isPastWidthLimit(drag.startWidths, widthChange, maxTableWidth), this.#handle, this.#outline)

    const heightChange = (event.clientY - drag.startClientY) / drag.scale

    drag.currentHeights = growRowHeights(drag.startHeights, heightChange, drag.minHeights)

    const outlineWidth = sumOf(drag.currentWidths)
    const outlineHeight = sumOf(drag.currentHeights)
    const outlineLeft = tableLeftAfterResize(drag.startTableBox, drag.alignment, outlineWidth * drag.scale)
    const outlineTop = drag.startTableBox.top
    const { left, top } = toContainerPosition(this.#container, outlineLeft, outlineTop)

    Object.assign(this.#outline.style, {
      display: 'block',
      left: `${left}px`,
      top: `${top}px`,
      width: `${outlineWidth}px`,
      height: `${outlineHeight}px`,
    })

    const outlineRight = outlineLeft + outlineWidth * drag.scale

    this.#placeHandle(drag.alignment === 'right' ? outlineLeft : outlineRight, outlineTop + outlineHeight * drag.scale)
  }

  #finishDrag = (): void => {
    const drag = this.#activeDrag

    this.#activeDrag = null
    this.#hoveredTable = null
    this.#handle.classList.remove('is-dragging', 'is-past-limit')
    this.#outline.classList.remove('is-past-limit')
    this.#handle.style.display = 'none'
    this.#outline.style.display = 'none'

    if (!drag) return

    const layout: TableLayout = {
      ...(hasChanged(drag.startWidths, drag.currentWidths) && { columnWidths: drag.currentWidths }),
      ...(hasChanged(drag.startHeights, drag.currentHeights) && {
        rowHeights: drag.currentHeights.map((height, rowIndex) =>
          savedHeightAfterDrag(height, drag.minHeights[rowIndex]),
        ),
      }),
    }

    if (Object.keys(layout).length > 0) this.#saveLayout(drag.tableElement, layout)
  }
}

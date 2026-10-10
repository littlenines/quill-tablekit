import type Quill from 'quill'
import type { Range } from 'quill'
import type { TableCellLine } from '../blots'
import { lastSelectedLine, lineAt } from '../editing/selection'
import { cellsInArea } from '../model/grid'
import { createElement } from './dom'
import { areaBetweenCells, boundingBoxOf, scaleOf, tableGrid, toContainerPosition } from './domGrid'

const SELECTING_CLASS = 'qlt-cells-selected'

const cellElementOf = (line: TableCellLine | null) => (line?.domNode as HTMLElement | undefined)?.closest('td') ?? null

export class CellSelection {
  #quill: Quill
  #container: HTMLElement
  #highlight = createElement('div', { className: 'qlt-selection' })
  #activeCell = createElement('div', { className: 'qlt-active-cell' })

  constructor(quill: Quill, container: HTMLElement) {
    this.#quill = quill
    this.#container = container
    container.append(this.#activeCell, this.#highlight)
  }

  update(range: Range | null): void {
    const selectedCells = range ? this.#selectedCells(range) : null
    const highlightBox = selectedCells ? boundingBoxOf(selectedCells) : null
    const activeCell = range && !highlightBox && this.#quill.isEnabled() ? this.#cellAt(range) : null

    this.#cover(this.#highlight, highlightBox)
    this.#cover(this.#activeCell, activeCell?.getBoundingClientRect() ?? null)
    this.#container.classList.toggle(SELECTING_CLASS, highlightBox != null)
  }

  hide(): void {
    this.update(null)
  }

  destroy(): void {
    this.hide()
    this.#highlight.remove()
    this.#activeCell.remove()
  }

  #cover(overlay: HTMLElement, clientBox: DOMRect | null): void {
    if (!clientBox) {
      overlay.style.display = 'none'
      return
    }

    const { left, top } = toContainerPosition(this.#container, clientBox.left, clientBox.top)
    const scale = scaleOf(this.#container)

    Object.assign(overlay.style, {
      display: 'block',
      left: `${left}px`,
      top: `${top}px`,
      width: `${clientBox.width / scale}px`,
      height: `${clientBox.height / scale}px`,
    })
  }

  #cellAt(range: Range): HTMLTableCellElement | null {
    const startCell = cellElementOf(lineAt(this.#quill, range.index))

    return startCell && startCell === cellElementOf(lastSelectedLine(this.#quill, range)) ? startCell : null
  }

  #selectedCells(range: Range): (HTMLTableCellElement | null)[] | null {
    if (range.length === 0) return null

    const startCell = cellElementOf(lineAt(this.#quill, range.index))
    const endCell = cellElementOf(lastSelectedLine(this.#quill, range))

    if (!startCell || !endCell || startCell === endCell) return null

    const tableElement = startCell.closest('table')

    if (!tableElement || tableElement !== endCell.closest('table')) return null

    const grid = tableGrid(tableElement)
    const selectedArea = areaBetweenCells(grid, startCell, endCell)

    return selectedArea ? cellsInArea(grid, selectedArea) : null
  }
}

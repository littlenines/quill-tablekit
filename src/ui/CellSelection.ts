import type Quill from 'quill'
import type { Range } from 'quill'
import type { TableCellLine } from '../blots'
import { lastSelectedLine, lineAt } from '../editing/selection'
import { cellsInArea } from '../model/grid'
import { createElement } from './dom'
import { areaBetweenCells, boundingBoxOf, tableGrid, toContainerPosition } from './domGrid'

const SELECTING_CLASS = 'qlt-cells-selected'

const cellElementOf = (line: TableCellLine | null) => (line?.domNode as HTMLElement | undefined)?.closest('td') ?? null

export class CellSelection {
  #quill: Quill
  #container: HTMLElement
  #highlight = createElement('div', { className: 'qlt-selection' })

  constructor(quill: Quill, container: HTMLElement) {
    this.#quill = quill
    this.#container = container
    container.append(this.#highlight)
  }

  update(range: Range | null): void {
    const selectedCells = range ? this.#selectedCells(range) : null
    const highlightBox = selectedCells ? boundingBoxOf(selectedCells) : null

    if (!highlightBox) {
      this.hide()
      return
    }

    const { left, top } = toContainerPosition(this.#container, highlightBox.left, highlightBox.top)

    Object.assign(this.#highlight.style, {
      display: 'block',
      left: `${left}px`,
      top: `${top}px`,
      width: `${highlightBox.width}px`,
      height: `${highlightBox.height}px`,
    })
    this.#container.classList.add(SELECTING_CLASS)
  }

  hide(): void {
    this.#highlight.style.display = 'none'
    this.#container.classList.remove(SELECTING_CLASS)
  }

  destroy(): void {
    this.hide()
    this.#highlight.remove()
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

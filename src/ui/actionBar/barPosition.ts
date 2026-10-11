import { scaleOf, toContainerPosition } from '../domGrid'

const GAP = 6

export interface BarPosition {
  left: number
  top: number
  isTableVisible: boolean
}

const fitsOnScreen = (top: number, height: number, visibleTop: number, visibleBottom: number) =>
  top >= visibleTop && top + height <= visibleBottom

// In the first row the caption sits above the cells, and the bar shouldn't cover it
const activeRowBox = (activeCell: HTMLTableCellElement, tableElement: HTMLTableElement) => {
  const rowElement = activeCell.parentElement
  const cellBox = activeCell.getBoundingClientRect()
  const rowBox = rowElement?.getBoundingClientRect() ?? cellBox
  const isFirstRow = rowElement?.previousElementSibling == null
  const captionTop = isFirstRow ? tableElement.getBoundingClientRect().top : Infinity

  return { top: Math.min(cellBox.top, rowBox.top, captionTop), bottom: Math.max(cellBox.bottom, rowBox.bottom) }
}

// Above the active row, or below it when there's no room above, lined up with the cell's left edge
export const barPosition = (
  container: HTMLElement,
  bar: HTMLElement,
  tableElement: HTMLTableElement,
  activeCell: HTMLTableCellElement | null,
): BarPosition => {
  const containerBox = container.getBoundingClientRect()
  const tableBox = tableElement.getBoundingClientRect()
  const clipsOverflow = getComputedStyle(container).overflowY !== 'visible'
  const visibleTop = Math.max(containerBox.top, 0)
  const visibleBottom = Math.min(clipsOverflow ? containerBox.bottom : Infinity, window.innerHeight)
  const scale = scaleOf(container)
  const barWidth = bar.offsetWidth * scale
  const barHeight = bar.offsetHeight * scale
  const gap = GAP * scale

  const fits = (top: number) => fitsOnScreen(top, barHeight, visibleTop, visibleBottom)
  const rowBox = activeCell ? activeRowBox(activeCell, tableElement) : tableBox
  const aboveRow = rowBox.top - barHeight - gap
  const belowRow = rowBox.bottom + gap
  const nearestEdgeTop = rowBox.top >= visibleBottom ? visibleBottom - barHeight - gap : visibleTop + gap
  const clientTop = [aboveRow, belowRow].find(fits) ?? nearestEdgeTop
  const cellLeft = activeCell ? activeCell.getBoundingClientRect().left : tableBox.left
  const maxLeft = containerBox.left + container.clientWidth * scale - barWidth - gap
  const clientLeft = Math.max(containerBox.left + gap, Math.min(cellLeft, maxLeft))

  return {
    ...toContainerPosition(container, clientLeft, clientTop),
    isTableVisible: tableBox.bottom > visibleTop && tableBox.top < visibleBottom,
  }
}

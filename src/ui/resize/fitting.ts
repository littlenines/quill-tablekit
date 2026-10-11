import { MIN_ROW_HEIGHT } from '../../config/constants'
import { sumOf } from '../../model/layout'
import { createElement } from '../dom'
import { measureColumnWidths, measureRowHeights, naturalRowHeight, tableGrid } from '../domGrid'

// Rounding can leave a column a fraction of a pixel too narrow, and then its text wraps
const WRAP_SAFETY = 1

// The table in the editor has fixed column widths, so its content would just wrap.
// A hidden copy with automatic layout shows how wide each column wants to be.
export const contentColumnWidths = (tableElement: HTMLTableElement, measuringParent: HTMLElement): number[] => {
  const measuringBox = createElement('div', { className: 'ql-editor qlt-measuring' }, { 'aria-hidden': 'true' })
  const tableCopy = tableElement.cloneNode(true) as HTMLTableElement

  tableCopy.querySelector(':scope > colgroup')?.remove()
  tableCopy.removeAttribute('data-caption')
  tableCopy.style.width = ''
  measuringBox.append(tableCopy)
  measuringParent.append(measuringBox)

  try {
    return measureColumnWidths(tableGrid(tableCopy)).map((width) => width + WRAP_SAFETY)
  } finally {
    measuringBox.remove()
  }
}

// As tall as the rows are on average, but never shorter than the tallest content
export const equalRowHeight = (tableElement: HTMLTableElement): number => {
  const rowHeights = measureRowHeights(tableElement)
  const tallestContent = Math.max(
    ...Array.from(tableElement.rows, (rowElement) => naturalRowHeight(rowElement, MIN_ROW_HEIGHT)),
  )

  return Math.max(tallestContent, Math.round(sumOf(rowHeights) / Math.max(1, rowHeights.length)))
}

import { CELL_PADDING_STYLES, HEADER_BACKGROUND, STRIPE_BACKGROUND } from '../config/constants'
import { normalizeBorderStyle, normalizeCellPadding } from '../model/properties'
import { tagsWithoutEditorMarkup } from './markup'

const isStripedRow = (rowNumber: number, hasHeader: boolean) =>
  hasHeader ? rowNumber > 0 && rowNumber % 2 === 0 : rowNumber % 2 === 1

export const cellTags = (cellElement: HTMLElement): [openingTag: string, closingTag: string] => {
  const tableElement = cellElement.closest('table')
  const rowNumber = (cellElement.parentElement as HTMLTableRowElement | null)?.sectionRowIndex ?? 0
  const { header, headerColumn, striped, borderStyle, cellPadding } = tableElement?.dataset ?? {}
  const hasHeader = header != null
  const isHeaderColumnCell = headerColumn != null && cellElement.hasAttribute('data-first-column')
  const borderColor = tableElement?.style.getPropertyValue('--qlt-border').trim() || '#000'
  const lineStyle = normalizeBorderStyle(borderStyle) ?? 'solid'
  const padding = normalizeCellPadding(cellPadding)
  const cellStyles = [
    lineStyle === 'none' ? 'border: none;' : `border: 1px ${lineStyle} ${borderColor};`,
    padding ? `padding: ${CELL_PADDING_STYLES[padding]};` : '',
  ]

  if ((hasHeader && rowNumber === 0) || isHeaderColumnCell) {
    const headerStyle = [...cellStyles, `text-align: left; background-color: ${HEADER_BACKGROUND};`]
    const scope = hasHeader && rowNumber === 0 ? 'col' : 'row'

    return tagsWithoutEditorMarkup(cellElement, headerStyle.filter(Boolean).join(' '), 'th', { scope })
  }

  if (striped != null && isStripedRow(rowNumber, hasHeader) && !cellElement.style.backgroundColor) {
    const stripeColor = tableElement?.style.getPropertyValue('--qlt-table-stripe').trim() || STRIPE_BACKGROUND

    cellStyles.push(`background-color: ${stripeColor};`)
  }

  return tagsWithoutEditorMarkup(cellElement, cellStyles.filter(Boolean).join(' '))
}

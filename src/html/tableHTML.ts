import Quill from 'quill'
import { BLOT_NAMES, CLASS_NAMES } from '../config/constants'
import type { CellArea } from '../model/grid'
import { columnWidthStyles } from '../model/layout'
import type { TableModel } from '../model/TableModel'
import { savedColumnWidths, type SavedWidths } from '../ui/domGrid'
import { indexes } from '../utils/array'
import { Parchment, type ParchmentTypes } from '../utils/quill'
import { cellTags } from './cellTags'
import { escapeText, tagsWithoutEditorMarkup } from './markup'

type Blot = ParchmentTypes.Blot

const TextBlot = Quill.import('blots/text') as typeof Parchment.TextBlot

const blotToHTML = (blot: Blot, startIndex: number, length: number): string => {
  if (blot instanceof TextBlot) {
    return escapeText(blot.value().slice(startIndex, startIndex + length)).replaceAll(' ', '&nbsp;')
  }

  if ('html' in blot && typeof blot.html === 'function') {
    return (blot.html as (startIndex: number, length: number) => string)(startIndex, length)
  }

  if (blot instanceof Parchment.ParentBlot) {
    const isCell = blot.statics.blotName === BLOT_NAMES.cell
    const [openingTag, closingTag] = isCell
      ? cellTags(blot.domNode as HTMLElement)
      : tagsWithoutEditorMarkup(blot.domNode as Element)

    return `${openingTag}${childrenToHTML(blot, startIndex, length)}${closingTag}`
  }

  return blot.domNode instanceof Element ? blot.domNode.outerHTML : ''
}

const childrenToHTML = (parent: ParchmentTypes.ParentBlot, startIndex: number, length: number): string => {
  const childrenHTML: string[] = []

  parent.children.forEachAt(startIndex, length, (child, childStart, childLength) => {
    childrenHTML.push(blotToHTML(child, childStart, childLength))
  })

  return childrenHTML.join('')
}

// A cell merged down from the header row can't be split between <thead> and <tbody>, so then the header stays in <tbody>
const tableSections = (rowsHTML: string[], startsWithHeaderRow: boolean): string => {
  const [headerRowHTML, ...bodyRowsHTML] = rowsHTML

  if (!startsWithHeaderRow || headerRowHTML === undefined) return `<tbody>${rowsHTML.join('')}</tbody>`

  const body = bodyRowsHTML.length > 0 ? `<tbody>${bodyRowsHTML.join('')}</tbody>` : ''

  return `<thead>${headerRowHTML}</thead>${body}`
}

const spansDown = (rowElement: HTMLTableRowElement | undefined) =>
  rowElement != null && Array.from(rowElement.cells).some((cellElement) => cellElement.rowSpan > 1)

const rowsOf = (table: ParchmentTypes.ParentBlot, startIndex: number, length: number) => {
  const rows: { rowElement: Element; html: string }[] = []

  table.children.forEachAt(startIndex, length, (body, bodyStart, bodyLength) => {
    if (!(body instanceof Parchment.ParentBlot)) return

    body.children.forEachAt(bodyStart, bodyLength, (row, rowStart, rowLength) => {
      rows.push({ rowElement: row.domNode as Element, html: blotToHTML(row, rowStart, rowLength) })
    })
  })

  return rows
}

export const tableHTML = (table: ParchmentTypes.ParentBlot, startIndex: number, length: number): string => {
  const isCell = (blot: Blot) => blot.statics.blotName === BLOT_NAMES.cell
  const selectedCells = table.descendants(isCell, startIndex, length) as ParchmentTypes.ParentBlot[]

  const coversWholeTable = startIndex === 0 && length >= table.length()

  if (selectedCells.length === 1 && !coversWholeTable) {
    const [onlyCell] = selectedCells

    return childrenToHTML(onlyCell, startIndex - onlyCell.offset(table), length)
  }

  const tableElement = table.domNode as HTMLTableElement
  const rows = rowsOf(table, startIndex, length)
  const [firstTableRow] = tableElement.rows
  const startsWithHeaderRow =
    tableElement.hasAttribute('data-header') && rows[0]?.rowElement === firstTableRow && !spansDown(firstTableRow)
  const sections = tableSections(
    rows.map(({ html }) => html),
    startsWithHeaderRow,
  )

  return wrapInTable(tableElement, savedColumnWidths(tableElement), sections)
}

export const cellAreaHTML = (table: ParchmentTypes.ParentBlot, model: TableModel, area: CellArea): string => {
  const tableElement = table.domNode as HTMLElement
  const cellElementsById = new Map(
    [...tableElement.querySelectorAll<HTMLElement>(`td.${CLASS_NAMES.cell}`)].map((cellElement) => [
      cellElement.dataset.cell,
      cellElement,
    ]),
  )
  const cellsInArea = model.orderedCells().filter(({ column }) => column >= area.left && column < area.right)

  const cellHTML = (cellId: string) => {
    const cellBlot = Quill.find(cellElementsById.get(cellId) as Node)

    return cellBlot instanceof Parchment.ParentBlot ? blotToHTML(cellBlot, 0, cellBlot.length()) : ''
  }

  const rowsHTML = indexes(area.bottom - area.top).map((rowOffset) => {
    const cellsInRow = cellsInArea.filter(({ row }) => row === area.top + rowOffset)

    const rowHeight = model.rowHeights[area.top + rowOffset]
    const rowStyle = rowHeight ? ` style="height: ${rowHeight}px;"` : ''

    return `<tr${rowStyle}>${cellsInRow.map(({ cell }) => cellHTML(cell.id)).join('')}</tr>`
  })

  const { widths, isPercent } = savedColumnWidths(tableElement)
  const headerRowSpansDown = cellsInArea.some(({ row, rowspan }) => row === 0 && rowspan > 1)
  const startsWithHeaderRow = tableElement.hasAttribute('data-header') && area.top === 0 && !headerRowSpansDown

  return wrapInTable(
    tableElement,
    { widths: widths?.slice(area.left, area.right), isPercent },
    tableSections(rowsHTML, startsWithHeaderRow),
  )
}

const wrapInTable = (
  tableElement: HTMLElement,
  { widths: columnWidths, isPercent }: SavedWidths,
  tableContent: string,
): string => {
  const widthStyles = columnWidths?.length ? columnWidthStyles(columnWidths, isPercent) : null
  const exportedTable = tableElement.cloneNode(false) as HTMLElement
  const columns = widthStyles?.columns.map((width) => `<col style="width: ${width};">`).join('')
  const colgroup = columns ? `<colgroup>${columns}</colgroup>` : ''
  const borderColor = tableElement.style.getPropertyValue('--qlt-border').trim()
  const tableStyle = [
    'border-collapse: collapse; table-layout: fixed;',
    widthStyles ? '' : ' width: 100%;',
    borderColor ? ` border-color: ${borderColor};` : '',
  ].join('')

  exportedTable.style.width = widthStyles?.table ?? ''

  const { caption: captionText, captionSide } = tableElement.dataset
  const captionStyle = captionSide === 'bottom' ? ' style="caption-side: bottom;"' : ''
  const caption = captionText ? `<caption${captionStyle}>${escapeText(captionText)}</caption>` : ''
  const [openingTag, closingTag] = tagsWithoutEditorMarkup(exportedTable, tableStyle)

  return `${openingTag}${caption}${colgroup}${tableContent}${closingTag}`
}

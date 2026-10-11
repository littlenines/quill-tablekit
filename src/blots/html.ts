import Quill from 'quill'
import { BLOT_NAMES, CELL_PADDING_STYLES, CLASS_NAMES, HEADER_BACKGROUND, STRIPE_BACKGROUND } from '../config/constants'
import { CELL_DATA_ATTRIBUTES } from '../model/cellValue'
import type { CellArea } from '../model/grid'
import { columnWidthStyles } from '../model/layout'
import { savedColumnWidths, type SavedWidths } from '../ui/domGrid'
import { normalizeBorderStyle, normalizeCellPadding } from '../model/properties'
import type { TableModel } from '../model/TableModel'
import { indexes } from '../utils/array'
import { Parchment, type ParchmentTypes } from '../utils/quill'

type Blot = ParchmentTypes.Blot

const TextBlot = Quill.import('blots/text') as typeof Parchment.TextBlot

const EDITOR_ONLY_ATTRIBUTES = [...CELL_DATA_ATTRIBUTES, 'contenteditable', 'data-first-column']

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }

const escapeText = (text: string) => text.replace(/[&<>"]/g, (character) => HTML_ESCAPES[character])

const QUILL_CLASS_STYLES: [classPattern: RegExp, toStyle: (classValue: string) => string][] = [
  [/^ql-align-(center|right|justify)$/, (alignment) => `text-align: ${alignment};`],
  [/^ql-direction-(rtl)$/, (direction) => `direction: ${direction};`],
]

const inlineStylesForQuillClasses = (element: Element): string =>
  [...element.classList]
    .flatMap((className) =>
      QUILL_CLASS_STYLES.flatMap(([classPattern, toStyle]) => {
        const classValue = classPattern.exec(className)?.[1]

        return classValue ? [toStyle(classValue)] : []
      }),
    )
    .join(' ')

const tagsWithoutEditorMarkup = (
  element: Element,
  extraStyle?: string,
  exportedTagName?: string,
  extraAttributes: Record<string, string> = {},
): [openingTag: string, closingTag: string] => {
  const cleanCopy = exportedTagName
    ? document.createElement(exportedTagName)
    : (element.cloneNode(false) as HTMLElement)

  if (exportedTagName) {
    for (const { name, value } of element.attributes) cleanCopy.setAttribute(name, value)
  }

  for (const attributeName of EDITOR_ONLY_ATTRIBUTES) cleanCopy.removeAttribute(attributeName)

  for (const [attributeName, attributeValue] of Object.entries(extraAttributes)) {
    cleanCopy.setAttribute(attributeName, attributeValue)
  }

  cleanCopy.style.removeProperty('--qlt-border')
  cleanCopy.style.removeProperty('--qlt-table-stripe')

  cleanCopy.classList.remove(...[...cleanCopy.classList].filter((className) => className.startsWith('qlt-')))

  if (cleanCopy.classList.length === 0) cleanCopy.removeAttribute('class')

  const existingStyle = cleanCopy.getAttribute('style')
  const exportedStyle = [extraStyle, inlineStylesForQuillClasses(cleanCopy), existingStyle].filter(Boolean).join(' ')

  if (exportedStyle) cleanCopy.setAttribute('style', exportedStyle)
  else cleanCopy.removeAttribute('style')

  const closingTag = `</${cleanCopy.tagName.toLowerCase()}>`

  return [cleanCopy.outerHTML.slice(0, -closingTag.length), closingTag]
}

const isStripedRow = (rowNumber: number, hasHeader: boolean) =>
  hasHeader ? rowNumber > 0 && rowNumber % 2 === 0 : rowNumber % 2 === 1

const cellTags = (cellElement: HTMLElement): [openingTag: string, closingTag: string] => {
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

import { CELL_FORMAT, HEADER_BACKGROUND } from '../config/constants'
import { makeId, parseRowHeight, parseWidths, type TableCellValue } from '../model/cellValue'
import {
  normalizeColor,
  normalizeTableAlign,
  normalizeVerticalAlign,
  withoutEmptyValues,
  type TableAlign,
} from '../model/properties'
import { Delta, Parchment, type ParchmentTypes } from '../utils/quill'

type Scroll = ParchmentTypes.ScrollBlot
type Operation = Delta['ops'][number]

const pastedTableIds = new WeakMap<Element, string>()
const pastedRowIds = new WeakMap<Element, string>()

const idForElement = (idsByElement: WeakMap<Element, string>, element: Element, prefix: string): string => {
  if (!idsByElement.has(element)) idsByElement.set(element, makeId(prefix))
  return idsByElement.get(element) as string
}

const readColumnWidths = (tableElement: HTMLTableElement): number[] | undefined => {
  const columnElements = [...tableElement.querySelectorAll<HTMLElement>(':scope > colgroup > col')]

  if (columnElements.length === 0) return undefined

  return parseWidths(
    columnElements.map((columnElement) => {
      const styleWidth = columnElement.style.width

      return Number.parseFloat(styleWidth.endsWith('px') ? styleWidth : (columnElement.getAttribute('width') ?? ''))
    }),
  )
}

const isBlockEmbed = ({ insert }: Operation, scroll: Scroll): boolean => {
  if (insert == null || typeof insert !== 'object') return false

  const [embedName] = Object.keys(insert)

  return embedName != null && scroll.query(embedName, Parchment.Scope.BLOCK_BLOT) != null
}

export const toCellLines = (pastedContent: Delta, cellValue: TableCellValue, scroll: Scroll): Delta => {
  // Windows clipboard text uses \r\n, and Quill turns a lone \r into a line break
  const withUnixLineBreaks = new Delta(
    pastedContent.ops.map((operation) =>
      typeof operation.insert === 'string'
        ? { ...operation, insert: operation.insert.replace(/\r\n?/g, '\n') }
        : operation,
    ),
  )
  const content = endsWithLineBreak(withUnixLineBreaks)
    ? withUnixLineBreaks
    : withUnixLineBreaks.concat(new Delta().insert('\n'))
  let cellLines = new Delta()

  content.eachLine((lineContent, lineAttributes) => {
    const blockAttributes = Object.fromEntries(
      Object.entries(lineAttributes).filter(
        ([attributeName]) => scroll.query(attributeName, Parchment.Scope.BLOCK_ATTRIBUTE) != null,
      ),
    )
    const inlineContent = new Delta(lineContent.ops.filter((operation) => !isBlockEmbed(operation, scroll)))

    cellLines = cellLines.concat(inlineContent).insert('\n', { [CELL_FORMAT]: { ...cellValue }, ...blockAttributes })
  })

  return cellLines
}

export const endsWithLineBreak = (content: Delta): boolean => {
  const lastInsert = content.ops.at(-1)?.insert

  return typeof lastInsert === 'string' && lastInsert.endsWith('\n')
}

export const hasTableLines = (content: Delta): boolean =>
  content.ops.some((operation) => operation.attributes?.[CELL_FORMAT] != null)

const hasHeaderRow = (tableElement: HTMLTableElement): boolean => {
  const firstRowCells = [...(tableElement.rows[0]?.cells ?? [])]

  return (
    tableElement.tHead != null || (firstRowCells.length > 0 && firstRowCells.every(({ tagName }) => tagName === 'TH'))
  )
}

const readTableAlign = ({ style, align }: HTMLTableElement): TableAlign | undefined => {
  if (style.marginLeft === 'auto') return style.marginRight === 'auto' ? 'center' : 'right'

  return normalizeTableAlign(align.toLowerCase())
}

const withoutBackground = (content: Delta, cellBackground: string | undefined): Delta => {
  if (!cellBackground) return content

  return new Delta(
    content.ops.map(({ attributes, ...operation }) => {
      if (attributes?.background !== cellBackground) return attributes ? { ...operation, attributes } : operation

      const { background: _textBackground, ...otherAttributes } = attributes

      return Object.keys(otherAttributes).length > 0 ? { ...operation, attributes: otherAttributes } : operation
    }),
  )
}

export const matchTableCell = (cellNode: Node, cellContent: Delta, scroll: Scroll): Delta => {
  const cellElement = cellNode as HTMLTableCellElement
  const rowElement = cellElement.closest('tr')
  const tableElement = cellElement.closest('table')

  if (!rowElement || !tableElement) return cellContent

  const isHeaderTable = hasHeaderRow(tableElement)
  const isHeaderCell = isHeaderTable && rowElement === tableElement.rows[0]
  const pastedBackground = normalizeColor(cellElement.style.backgroundColor || cellElement.getAttribute('bgcolor'))
  const background = isHeaderCell && pastedBackground === HEADER_BACKGROUND ? undefined : pastedBackground
  const cellValue: TableCellValue = {
    table: idForElement(pastedTableIds, tableElement, 'tbl'),
    row: idForElement(pastedRowIds, rowElement, 'row'),
    cell: makeId('cell'),
    rowspan: Math.max(1, cellElement.rowSpan || 1),
    colspan: Math.max(1, cellElement.colSpan || 1),
    ...withoutEmptyValues({
      widths: readColumnWidths(tableElement),
      rowHeight: parseRowHeight(rowElement.style.height || rowElement.getAttribute('height')),
      header: isHeaderTable || undefined,
      tableAlign: readTableAlign(tableElement),
      borderColor: normalizeColor(tableElement.style.borderColor),
      background,
      verticalAlign: normalizeVerticalAlign(cellElement.style.verticalAlign || cellElement.getAttribute('valign')),
    }),
  }

  return toCellLines(withoutBackground(cellContent, pastedBackground), cellValue, scroll)
}

export const matchTableRow = (_rowNode: Node, rowContent: Delta): Delta =>
  new Delta(
    rowContent.ops.map(({ attributes, ...operation }) => {
      if (!attributes) return operation

      const { table: _quillTableFormat, ...otherAttributes } = attributes

      return Object.keys(otherAttributes).length > 0 ? { ...operation, attributes: otherAttributes } : operation
    }),
  )

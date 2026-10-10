import { CELL_FORMAT } from '../config/constants'
import { makeId, parseWidths, type TableCellValue } from '../model/cellValue'
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

export const matchTableCell = (cellNode: Node, cellContent: Delta, scroll: Scroll): Delta => {
  const cellElement = cellNode as HTMLTableCellElement
  const rowElement = cellElement.closest('tr')
  const tableElement = cellElement.closest('table')

  if (!rowElement || !tableElement) return cellContent

  const cellValue: TableCellValue = {
    table: idForElement(pastedTableIds, tableElement, 'tbl'),
    row: idForElement(pastedRowIds, rowElement, 'row'),
    cell: makeId('cell'),
    rowspan: Math.max(1, cellElement.rowSpan || 1),
    colspan: Math.max(1, cellElement.colSpan || 1),
  }
  const columnWidths = readColumnWidths(tableElement)

  if (columnWidths) cellValue.widths = columnWidths

  return toCellLines(cellContent, cellValue, scroll)
}

export const matchTableRow = (_rowNode: Node, rowContent: Delta): Delta =>
  new Delta(
    rowContent.ops.map(({ attributes, ...operation }) => {
      if (!attributes) return operation

      const { table: _quillTableFormat, ...otherAttributes } = attributes

      return Object.keys(otherAttributes).length > 0 ? { ...operation, attributes: otherAttributes } : operation
    }),
  )

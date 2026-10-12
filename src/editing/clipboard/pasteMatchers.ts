import { CELL_FORMAT, HEADER_BACKGROUND, STRIPE_BACKGROUND } from '../../config/constants'
import { makeId, parseRowHeight, type TableCellValue } from '../../model/cellValue'
import { normalizeCaption, normalizeColor, normalizeVerticalAlign, withoutEmptyValues } from '../../model/properties'
import { Delta, Parchment, type ParchmentTypes } from '../../utils/quill'
import {
  backgroundOf,
  hasHeaderColumn,
  hasHeaderRow,
  readBorderStyle,
  readCaptionSide,
  readCellPadding,
  readColumnWidths,
  readTableAlign,
  stripesOf,
} from './pastedTableStyle'

type Scroll = ParchmentTypes.ScrollBlot
type Operation = Delta['ops'][number]

const pastedTableIds = new WeakMap<Element, string>()
const pastedRowIds = new WeakMap<Element, string>()

const idForElement = (idsByElement: WeakMap<Element, string>, element: Element, prefix: string): string => {
  if (!idsByElement.has(element)) idsByElement.set(element, makeId(prefix))
  return idsByElement.get(element) as string
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
  const isHeaderColumnTable = hasHeaderColumn(tableElement)
  const isHeaderCell =
    (isHeaderTable && rowElement === tableElement.rows[0]) || (isHeaderColumnTable && cellElement.cellIndex === 0)
  const stripes = stripesOf(tableElement)
  const pastedBackground = backgroundOf(cellElement)
  const isStripeColor = stripes?.rows.has(rowElement) === true && pastedBackground === stripes.color
  const isTableColor = (isHeaderCell && pastedBackground === HEADER_BACKGROUND) || isStripeColor
  const background = isTableColor ? undefined : pastedBackground
  const cellValue: TableCellValue = {
    table: idForElement(pastedTableIds, tableElement, 'tbl'),
    row: idForElement(pastedRowIds, rowElement, 'row'),
    cell: makeId('cell'),
    rowspan: Math.max(1, cellElement.rowSpan || 1),
    colspan: Math.max(1, cellElement.colSpan || 1),
    ...withoutEmptyValues({
      ...readColumnWidths(tableElement),
      rowHeight: parseRowHeight(rowElement.style.height || rowElement.getAttribute('height')),
      header: isHeaderTable || undefined,
      headerColumn: isHeaderColumnTable || undefined,
      tableAlign: readTableAlign(tableElement),
      borderColor: normalizeColor(tableElement.style.borderColor),
      borderStyle: readBorderStyle(cellElement),
      cellPadding: readCellPadding(cellElement),
      striped: stripes ? true : undefined,
      stripeColor: stripes?.color === STRIPE_BACKGROUND ? undefined : stripes?.color,
      caption: normalizeCaption(tableElement.caption?.textContent),
      captionSide: readCaptionSide(tableElement.caption),
      background,
      verticalAlign: normalizeVerticalAlign(cellElement.style.verticalAlign || cellElement.getAttribute('valign')),
    }),
  }

  return toCellLines(withoutBackground(cellContent, pastedBackground), cellValue, scroll)
}

export const matchCaption = (): Delta => new Delta()

const PARTS_WITHOUT_TEXT = new Set(['TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'COLGROUP'])

// Indented HTML has line breaks between the tags, and Quill would add them as a space to the next cell
export const matchTableWhitespace = (textNode: Node, content: Delta): Delta => {
  const parentTag = textNode.parentElement?.tagName ?? ''

  return PARTS_WITHOUT_TEXT.has(parentTag) && !textNode.textContent?.trim() ? new Delta() : content
}

export const matchTableRow = (_rowNode: Node, rowContent: Delta): Delta =>
  new Delta(
    rowContent.ops.map(({ attributes, ...operation }) => {
      if (!attributes) return operation

      const { table: _quillTableFormat, ...otherAttributes } = attributes

      return Object.keys(otherAttributes).length > 0 ? { ...operation, attributes: otherAttributes } : operation
    }),
  )

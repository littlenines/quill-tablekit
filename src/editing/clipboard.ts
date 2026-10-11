import { CELL_FORMAT, HEADER_BACKGROUND, STRIPE_BACKGROUND } from '../config/constants'
import { makeId, parseRowHeight, parseWidths, type TableCellValue } from '../model/cellValue'
import {
  normalizeBorderStyle,
  normalizeCaption,
  normalizeCaptionSide,
  normalizeColor,
  normalizeTableAlign,
  normalizeVerticalAlign,
  withoutEmptyValues,
  type CellPadding,
  type TableAlign,
} from '../model/properties'
import { Delta, Parchment, type ParchmentTypes } from '../utils/quill'

type Scroll = ParchmentTypes.ScrollBlot
type Operation = Delta['ops'][number]

const pastedTableIds = new WeakMap<Element, string>()
const pastedRowIds = new WeakMap<Element, string>()

interface Stripes {
  color: string
  rows: Set<Element>
}

const stripesOfTables = new WeakMap<Element, Stripes | null>()

const idForElement = (idsByElement: WeakMap<Element, string>, element: Element, prefix: string): string => {
  if (!idsByElement.has(element)) idsByElement.set(element, makeId(prefix))
  return idsByElement.get(element) as string
}

const isPercent = (width: string) => width.trim().endsWith('%')

// Percent columns are shares of the table, so they're turned into shares of the editor like the saved widths
const readColumnWidths = (tableElement: HTMLTableElement): Pick<TableCellValue, 'widths' | 'widthUnit'> => {
  const columnElements = [...tableElement.querySelectorAll<HTMLElement>(':scope > colgroup > col')]
  const columnWidths = columnElements.map(
    (columnElement) => columnElement.style.width || columnElement.getAttribute('width') || '',
  )

  if (columnWidths.length === 0) return {}

  if (columnWidths.every(isPercent)) {
    const tableWidth = tableElement.style.width
    const tableShare = isPercent(tableWidth) ? Number.parseFloat(tableWidth) : 100
    const widths = parseWidths(
      columnWidths.map((width) => (Number.parseFloat(width) * tableShare) / 100),
      2,
    )

    return widths ? { widths, widthUnit: 'percent' } : {}
  }

  return { widths: parseWidths(columnWidths.map((width) => Number.parseFloat(width))) }
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

const hasHeaderColumn = (tableElement: HTMLTableElement): boolean => {
  const bodyRows = [...tableElement.rows].slice(hasHeaderRow(tableElement) ? 1 : 0)

  return bodyRows.length > 0 && bodyRows.every((rowElement) => rowElement.cells[0]?.tagName === 'TH')
}

const readTableAlign = ({ style, align }: HTMLTableElement): TableAlign | undefined => {
  if (style.marginLeft === 'auto') return style.marginRight === 'auto' ? 'center' : 'right'

  return normalizeTableAlign(align.toLowerCase())
}

const backgroundOf = (cellElement: HTMLTableCellElement) =>
  normalizeColor(cellElement.style.backgroundColor || cellElement.getAttribute('bgcolor'))

const mostCommonBackground = (cellElements: HTMLTableCellElement[]): [color: string, cellCount: number] | null => {
  const cellCounts = new Map<string, number>()

  for (const cellElement of cellElements) {
    const background = backgroundOf(cellElement)

    if (background) cellCounts.set(background, (cellCounts.get(background) ?? 0) + 1)
  }

  return [...cellCounts].sort(([, firstCount], [, secondCount]) => secondCount - firstCount)[0] ?? null
}

// Every other row under the header shares one background, and the rows between don't have it.
// One such row is too little to tell stripes from a colored row, unless it's the default stripe color.
const findStripes = (tableElement: HTMLTableElement): Stripes | null => {
  const bodyRows = [...tableElement.rows].slice(hasHeaderRow(tableElement) ? 1 : 0)
  const stripeRows = bodyRows.filter((_rowElement, rowNumber) => rowNumber % 2 === 1)
  const plainRows = bodyRows.filter((_rowElement, rowNumber) => rowNumber % 2 === 0)
  const stripeCells = stripeRows.flatMap((rowElement) => [...rowElement.cells])
  const [color, cellCount] = mostCommonBackground(stripeCells) ?? []

  if (!color || !cellCount || cellCount * 2 <= stripeCells.length) return null
  if (stripeRows.length < 2 && color !== STRIPE_BACKGROUND) return null

  const plainRowsHaveIt = plainRows.some((rowElement) =>
    [...rowElement.cells].some((cellElement) => backgroundOf(cellElement) === color),
  )

  return plainRowsHaveIt ? null : { color, rows: new Set(stripeRows) }
}

const stripesOf = (tableElement: HTMLTableElement): Stripes | null => {
  if (!stripesOfTables.has(tableElement)) stripesOfTables.set(tableElement, findStripes(tableElement))

  return stripesOfTables.get(tableElement) ?? null
}

const readCaptionSide = (captionElement: HTMLTableCaptionElement | null) =>
  normalizeCaptionSide(captionElement?.style.captionSide || captionElement?.getAttribute('align')?.toLowerCase())

const readBorderStyle = ({ style }: HTMLTableCellElement) =>
  normalizeBorderStyle(style.borderTopStyle || style.borderStyle)

const readCellPadding = ({ style }: HTMLTableCellElement): CellPadding | undefined => {
  const topPadding = Number.parseFloat(style.paddingTop)

  if (Number.isNaN(topPadding)) return undefined
  if (topPadding <= 2) return 'compact'

  return topPadding >= 7 ? 'wide' : undefined
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

export const matchTableRow = (_rowNode: Node, rowContent: Delta): Delta =>
  new Delta(
    rowContent.ops.map(({ attributes, ...operation }) => {
      if (!attributes) return operation

      const { table: _quillTableFormat, ...otherAttributes } = attributes

      return Object.keys(otherAttributes).length > 0 ? { ...operation, attributes: otherAttributes } : operation
    }),
  )

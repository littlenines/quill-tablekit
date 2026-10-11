import { STRIPE_BACKGROUND } from '../../config/constants'
import { parseWidths, type TableCellValue } from '../../model/cellValue'
import {
  normalizeBorderStyle,
  normalizeCaptionSide,
  normalizeColor,
  normalizeTableAlign,
  type CellPadding,
  type TableAlign,
} from '../../model/properties'

// Reads a pasted <table>'s look back into table settings

interface Stripes {
  color: string
  rows: Set<Element>
}

const stripesOfTables = new WeakMap<Element, Stripes | null>()

const isPercent = (width: string) => width.trim().endsWith('%')

// Percent columns are shares of the table, so they're turned into shares of the editor like the saved widths
export const readColumnWidths = (tableElement: HTMLTableElement): Pick<TableCellValue, 'widths' | 'widthUnit'> => {
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

export const hasHeaderRow = (tableElement: HTMLTableElement): boolean => {
  const firstRowCells = [...(tableElement.rows[0]?.cells ?? [])]

  return (
    tableElement.tHead != null || (firstRowCells.length > 0 && firstRowCells.every(({ tagName }) => tagName === 'TH'))
  )
}

export const hasHeaderColumn = (tableElement: HTMLTableElement): boolean => {
  const bodyRows = [...tableElement.rows].slice(hasHeaderRow(tableElement) ? 1 : 0)

  return bodyRows.length > 0 && bodyRows.every((rowElement) => rowElement.cells[0]?.tagName === 'TH')
}

export const readTableAlign = (tableElement: HTMLTableElement): TableAlign | undefined => {
  const { marginLeft, marginRight } = tableElement.style

  if (marginLeft === 'auto') return marginRight === 'auto' ? 'center' : 'right'

  return normalizeTableAlign(tableElement.getAttribute('align')?.toLowerCase())
}

export const backgroundOf = (cellElement: HTMLTableCellElement) =>
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

export const stripesOf = (tableElement: HTMLTableElement): Stripes | null => {
  if (!stripesOfTables.has(tableElement)) stripesOfTables.set(tableElement, findStripes(tableElement))

  return stripesOfTables.get(tableElement) ?? null
}

export const readCaptionSide = (captionElement: HTMLTableCaptionElement | null) =>
  normalizeCaptionSide(captionElement?.style.captionSide || captionElement?.getAttribute('align')?.toLowerCase())

export const readBorderStyle = ({ style }: HTMLTableCellElement) =>
  normalizeBorderStyle(style.borderTopStyle || style.borderStyle)

export const readCellPadding = ({ style }: HTMLTableCellElement): CellPadding | undefined => {
  const topPadding = Number.parseFloat(style.paddingTop)

  if (Number.isNaN(topPadding)) return undefined
  if (topPadding <= 2) return 'compact'

  return topPadding >= 7 ? 'wide' : undefined
}

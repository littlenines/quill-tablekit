import {
  normalizeBorderStyle,
  normalizeCaption,
  normalizeCellPadding,
  normalizeColor,
  normalizeTableAlign,
  normalizeVerticalAlign,
  withoutEmptyValues,
  type BorderStyle,
  type CellPadding,
  type TableAlign,
  type VerticalAlign,
} from './properties'

export interface TableCellValue {
  table: string
  row: string
  cell: string
  rowspan: number
  colspan: number
  widths?: number[]
  rowHeight?: number
  header?: boolean
  tableAlign?: TableAlign
  borderColor?: string
  borderStyle?: BorderStyle
  cellPadding?: CellPadding
  striped?: boolean
  stripeColor?: string
  caption?: string
  background?: string
  verticalAlign?: VerticalAlign
}

export const CELL_DATA_ATTRIBUTES = [
  'data-table',
  'data-row',
  'data-cell',
  'data-rowspan',
  'data-colspan',
  'data-widths',
  'data-row-height',
  'data-header',
  'data-table-align',
  'data-border-color',
  'data-border-style',
  'data-cell-padding',
  'data-striped',
  'data-stripe-color',
  'data-caption',
  'data-background',
  'data-vertical-align',
]

export const makeId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`

export const freshCellValue = (): TableCellValue => ({
  table: makeId('tbl'),
  row: makeId('row'),
  cell: makeId('cell'),
  rowspan: 1,
  colspan: 1,
})

const toSpan = (spanInput: unknown): number => {
  const span = typeof spanInput === 'string' ? Number.parseInt(spanInput, 10) : spanInput

  return typeof span === 'number' && Number.isFinite(span) && span >= 1 ? Math.floor(span) : 1
}

const toId = (idInput: unknown): string | null => {
  if (typeof idInput === 'number') return String(idInput)
  return typeof idInput === 'string' && idInput.length > 0 ? idInput : null
}

const isPositiveNumber = (width: unknown): width is number =>
  typeof width === 'number' && Number.isFinite(width) && width > 0

export const parseWidths = (widthsInput: unknown): number[] | undefined => {
  const widthEntries =
    typeof widthsInput === 'string' ? widthsInput.split(',') : Array.isArray(widthsInput) ? widthsInput : null

  if (!widthEntries?.length) return undefined

  const widths = widthEntries.map((width) => (typeof width === 'string' ? Number.parseFloat(width) : width))

  if (!widths.every(isPositiveNumber)) return undefined

  return widths.map(Math.round)
}

const isTrue = (flag: unknown) => flag === true || flag === 'true'

export const parseRowHeight = (heightInput: unknown): number | undefined => {
  const height = typeof heightInput === 'string' ? Number.parseFloat(heightInput) : heightInput

  return isPositiveNumber(height) ? Math.round(height) : undefined
}

export const normalizeCellValue = (cellValueInput: unknown): TableCellValue | null => {
  if (cellValueInput == null || typeof cellValueInput !== 'object') return null

  const fields = cellValueInput as Record<string, unknown>
  const table = toId(fields.table)
  const row = toId(fields.row)
  const cell = toId(fields.cell)

  if (!table || !row || !cell) return null

  return {
    table,
    row,
    cell,
    rowspan: toSpan(fields.rowspan),
    colspan: toSpan(fields.colspan),
    ...withoutEmptyValues({
      widths: parseWidths(fields.widths),
      rowHeight: parseRowHeight(fields.rowHeight),
      header: isTrue(fields.header) || undefined,
      tableAlign: normalizeTableAlign(fields.tableAlign),
      borderColor: normalizeColor(fields.borderColor),
      borderStyle: normalizeBorderStyle(fields.borderStyle),
      cellPadding: normalizeCellPadding(fields.cellPadding),
      striped: isTrue(fields.striped) || undefined,
      stripeColor: normalizeColor(fields.stripeColor),
      caption: normalizeCaption(fields.caption),
      background: normalizeColor(fields.background),
      verticalAlign: normalizeVerticalAlign(fields.verticalAlign),
    }),
  }
}

export const setAttribute = (element: HTMLElement, attributeName: string, attributeValue: string | null): void => {
  if (attributeValue == null) element.removeAttribute(attributeName)
  else if (element.getAttribute(attributeName) !== attributeValue) element.setAttribute(attributeName, attributeValue)
}

export const writeCellValue = (lineElement: HTMLElement, cellValue: TableCellValue): void => {
  const { table, row, cell, rowspan, colspan, widths, rowHeight } = cellValue
  const { header, tableAlign, borderColor, borderStyle, cellPadding, striped, stripeColor, caption } = cellValue
  const { background, verticalAlign } = cellValue

  setAttribute(lineElement, 'data-table', table)
  setAttribute(lineElement, 'data-row', row)
  setAttribute(lineElement, 'data-cell', cell)
  setAttribute(lineElement, 'data-rowspan', String(rowspan))
  setAttribute(lineElement, 'data-colspan', String(colspan))
  setAttribute(lineElement, 'data-widths', widths?.length ? widths.join(',') : null)
  setAttribute(lineElement, 'data-row-height', rowHeight ? String(rowHeight) : null)
  setAttribute(lineElement, 'data-header', header ? 'true' : null)
  setAttribute(lineElement, 'data-table-align', tableAlign ?? null)
  setAttribute(lineElement, 'data-border-color', borderColor ?? null)
  setAttribute(lineElement, 'data-border-style', borderStyle ?? null)
  setAttribute(lineElement, 'data-cell-padding', cellPadding ?? null)
  setAttribute(lineElement, 'data-striped', striped ? 'true' : null)
  setAttribute(lineElement, 'data-stripe-color', stripeColor ?? null)
  setAttribute(lineElement, 'data-caption', caption ?? null)
  setAttribute(lineElement, 'data-background', background ?? null)
  setAttribute(lineElement, 'data-vertical-align', verticalAlign ?? null)
}

export const readCellValue = (lineElement: HTMLElement) => {
  const { dataset } = lineElement

  return normalizeCellValue({
    table: dataset.table,
    row: dataset.row,
    cell: dataset.cell,
    rowspan: dataset.rowspan,
    colspan: dataset.colspan,
    widths: dataset.widths,
    rowHeight: dataset.rowHeight,
    header: dataset.header,
    tableAlign: dataset.tableAlign,
    borderColor: dataset.borderColor,
    borderStyle: dataset.borderStyle,
    cellPadding: dataset.cellPadding,
    striped: dataset.striped,
    stripeColor: dataset.stripeColor,
    caption: dataset.caption,
    background: dataset.background,
    verticalAlign: dataset.verticalAlign,
  })
}

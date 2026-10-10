export interface TableCellValue {
  table: string
  row: string
  cell: string
  rowspan: number
  colspan: number
  widths?: number[]
}

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

export const normalizeCellValue = (cellValueInput: unknown): TableCellValue | null => {
  if (cellValueInput == null || typeof cellValueInput !== 'object') return null

  const fields = cellValueInput as Record<string, unknown>
  const table = toId(fields.table)
  const row = toId(fields.row)
  const cell = toId(fields.cell)

  if (!table || !row || !cell) return null

  const widths = parseWidths(fields.widths)

  return {
    table,
    row,
    cell,
    rowspan: toSpan(fields.rowspan),
    colspan: toSpan(fields.colspan),
    ...(widths && { widths }),
  }
}

export const setAttribute = (element: HTMLElement, attributeName: string, attributeValue: string | null): void => {
  if (attributeValue == null) element.removeAttribute(attributeName)
  else if (element.getAttribute(attributeName) !== attributeValue) element.setAttribute(attributeName, attributeValue)
}

export const writeCellValue = (
  lineElement: HTMLElement,
  { table, row, cell, rowspan, colspan, widths }: TableCellValue,
): void => {
  setAttribute(lineElement, 'data-table', table)
  setAttribute(lineElement, 'data-row', row)
  setAttribute(lineElement, 'data-cell', cell)
  setAttribute(lineElement, 'data-rowspan', String(rowspan))
  setAttribute(lineElement, 'data-colspan', String(colspan))
  setAttribute(lineElement, 'data-widths', widths?.length ? widths.join(',') : null)
}

export const readCellValue = (lineElement: HTMLElement) =>
  normalizeCellValue({
    table: lineElement.dataset.table,
    row: lineElement.dataset.row,
    cell: lineElement.dataset.cell,
    rowspan: lineElement.dataset.rowspan,
    colspan: lineElement.dataset.colspan,
    widths: lineElement.dataset.widths,
  })

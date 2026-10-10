import { CELL_FORMAT } from '../config/constants'
import { indexes } from '../utils/array'
import { Delta } from '../utils/quill'
import { emptyCell, type CellData } from './cell'
import { makeId, normalizeCellValue, type TableCellValue } from './cellValue'
import { cellAreas, cellsInArea, expandToWholeCells, placeCells, type CellArea, type SpannedCell } from './grid'
import { sumOf } from './layout'
import { withoutEmptyValues, type BorderStyle, type CellPadding, type CellStyle, type TableAlign } from './properties'

export interface PlacedCell {
  cell: CellData
  row: number
  column: number
  rowspan: number
  colspan: number
}

const cellStyleOf = ({ background, verticalAlign }: TableCellValue): CellStyle =>
  withoutEmptyValues({ background, verticalAlign })

const uniqueId = (usedIds: Set<string>, preferredId: string, prefix: string): string => {
  const chosenId = usedIds.has(preferredId) ? makeId(prefix) : preferredId

  usedIds.add(chosenId)
  return chosenId
}

// A table as a grid: a merged cell is the same CellData in every spot it covers.
// The changes to it (rows, merging, moving...) are functions in the files next to this one.
export class TableModel {
  tableId: string
  rowIds: string[]
  grid: CellData[][]
  columnWidths: number[] | null
  rowHeights: (number | undefined)[]
  header = false
  tableAlign: TableAlign | undefined
  borderColor: string | undefined
  borderStyle: BorderStyle | undefined
  cellPadding: CellPadding | undefined
  striped = false
  stripeColor: string | undefined
  caption: string | undefined

  constructor(tableId: string, rowIds: string[], grid: CellData[][], columnWidths: number[] | null) {
    this.tableId = tableId
    this.rowIds = rowIds
    this.rowHeights = rowIds.map(() => undefined)
    this.grid = grid
    this.columnWidths = columnWidths
  }

  static create(rowCount: number, columnCount: number): TableModel {
    const grid = indexes(rowCount).map(() => indexes(columnCount).map(() => emptyCell()))

    return new TableModel(
      makeId('tbl'),
      grid.map(() => makeId('row')),
      grid,
      null,
    )
  }

  static fromDelta(tableDelta: Delta): TableModel {
    const cellGroups: { cellValue: TableCellValue; content: Delta }[] = []

    tableDelta.eachLine((lineContent, lineAttributes) => {
      const cellValue = normalizeCellValue(lineAttributes[CELL_FORMAT])

      if (!cellValue) return

      const { [CELL_FORMAT]: _cellFormat, ...otherAttributes } = lineAttributes
      const hasOtherAttributes = Object.keys(otherAttributes).length > 0
      const line = new Delta(lineContent.ops).insert('\n', hasOtherAttributes ? otherAttributes : undefined)
      const previousGroup = cellGroups.at(-1)
      const isSameCell =
        previousGroup?.cellValue.row === cellValue.row && previousGroup.cellValue.cell === cellValue.cell

      if (previousGroup && isSameCell) previousGroup.content = previousGroup.content.concat(line)
      else cellGroups.push({ cellValue, content: line })
    })

    const usedCellIds = new Set<string>()
    const usedRowIds = new Set<string>()
    const rowIds: string[] = []
    const rowHeights: (number | undefined)[] = []
    const rows: SpannedCell<CellData>[][] = []

    for (const [groupIndex, { cellValue, content }] of cellGroups.entries()) {
      if (cellGroups[groupIndex - 1]?.cellValue.row !== cellValue.row) {
        rowIds.push(uniqueId(usedRowIds, cellValue.row, 'row'))
        rowHeights.push(cellValue.rowHeight)
        rows.push([])
      }

      rows
        .at(-1)
        ?.push({
          cell: { id: uniqueId(usedCellIds, cellValue.cell, 'cell'), content, style: cellStyleOf(cellValue) },
          rowspan: cellValue.rowspan,
          colspan: cellValue.colspan,
        })
    }

    const firstCellValue = cellGroups[0]?.cellValue
    const tableId = firstCellValue?.table ?? makeId('tbl')
    const model = new TableModel(
      tableId,
      rowIds,
      placeCells(rows, () => emptyCell()),
      null,
    )
    const storedWidths = cellGroups.find(({ cellValue }) => cellValue.widths)?.cellValue.widths

    model.setColumnWidths(storedWidths ?? null)
    model.rowHeights = rowHeights.slice(0, model.rowCount)
    model.header = firstCellValue?.header === true
    model.tableAlign = firstCellValue?.tableAlign
    model.borderColor = firstCellValue?.borderColor
    model.borderStyle = firstCellValue?.borderStyle
    model.cellPadding = firstCellValue?.cellPadding
    model.striped = firstCellValue?.striped === true
    model.stripeColor = firstCellValue?.stripeColor
    model.caption = firstCellValue?.caption

    return model
  }

  get rowCount(): number {
    return this.grid.length
  }

  get columnCount(): number {
    return this.grid[0]?.length ?? 0
  }

  get isEmpty(): boolean {
    return this.rowCount === 0 || this.columnCount === 0
  }

  findCell(cellId: string): CellData | null {
    return this.grid.flat().find((cell) => cell.id === cellId) ?? null
  }

  areaOf(cell: CellData): CellArea | null {
    return cellAreas(this.grid).get(cell) ?? null
  }

  expandToWholeCells(area: CellArea): CellArea {
    return expandToWholeCells(this.grid, area)
  }

  cellsInArea(area: CellArea): CellData[] {
    return cellsInArea(this.grid, area)
  }

  setRowHeights(rowHeights: (number | null | undefined)[] | null): void {
    this.rowHeights = this.rowIds.map((_rowId, rowIndex) => {
      const height = rowHeights?.[rowIndex]

      return height != null && Number.isFinite(height) && height > 0 ? Math.round(height) : undefined
    })
  }

  setColumnWidths(columnWidths: number[] | null): void {
    if (!columnWidths?.length || this.columnCount === 0) {
      this.columnWidths = null
      return
    }

    const fittedWidths = columnWidths.slice(0, this.columnCount)
    const averageWidth = Math.round(sumOf(fittedWidths) / fittedWidths.length)
    const missingColumns = this.columnCount - fittedWidths.length

    this.columnWidths = [...fittedWidths, ...indexes(missingColumns).map(() => averageWidth)]
  }

  // Removes rows and columns where no cell starts, since those can't be written as lines
  normalize(): void {
    for (let rowIndex = this.rowCount - 1; rowIndex > 0; rowIndex--) {
      const rowAbove = this.grid[rowIndex - 1]
      const isCoveredFromAbove = this.grid[rowIndex].every((cell, columnIndex) => cell === rowAbove[columnIndex])

      if (isCoveredFromAbove) {
        this.grid.splice(rowIndex, 1)
        this.rowIds.splice(rowIndex, 1)
        this.#foldRowHeightIntoRowAbove(rowIndex)
      }
    }

    for (let columnIndex = this.columnCount - 1; columnIndex > 0; columnIndex--) {
      const isCoveredFromLeft = this.grid.every((row) => row[columnIndex] === row[columnIndex - 1])

      if (!isCoveredFromLeft) continue

      for (const row of this.grid) row.splice(columnIndex, 1)

      if (this.columnWidths) {
        this.columnWidths[columnIndex - 1] += this.columnWidths[columnIndex]
        this.columnWidths.splice(columnIndex, 1)
      }
    }
  }

  orderedCells(): PlacedCell[] {
    return [...cellAreas(this.grid)].map(([cell, { top, left, bottom, right }]) => ({
      cell,
      row: top,
      column: left,
      rowspan: bottom - top,
      colspan: right - left,
    }))
  }

  toDelta(): Delta {
    let tableDelta = new Delta()

    const tableFields = withoutEmptyValues({
      widths: this.columnWidths ? [...this.columnWidths] : undefined,
      header: this.header || undefined,
      tableAlign: this.tableAlign,
      borderColor: this.borderColor,
      borderStyle: this.borderStyle,
      cellPadding: this.cellPadding,
      striped: this.striped || undefined,
      stripeColor: this.stripeColor,
      caption: this.caption,
    })

    for (const { cell, row, rowspan, colspan } of this.orderedCells()) {
      const cellValue: TableCellValue = {
        table: this.tableId,
        row: this.rowIds[row],
        ...(this.rowHeights[row] && { rowHeight: this.rowHeights[row] }),
        cell: cell.id,
        rowspan,
        colspan,
        ...tableFields,
        ...cell.style,
      }

      cell.content.eachLine((lineContent, lineAttributes) => {
        tableDelta = tableDelta.concat(lineContent).insert('\n', { [CELL_FORMAT]: { ...cellValue }, ...lineAttributes })
      })
    }

    return tableDelta
  }

  cellOffset(cellId: string): number {
    let offset = 0

    for (const { cell } of this.orderedCells()) {
      if (cell.id === cellId) return offset

      offset += cell.content.length()
    }

    return -1
  }

  #foldRowHeightIntoRowAbove(rowIndex: number): void {
    const [removedHeight] = this.rowHeights.splice(rowIndex, 1)
    const heightAbove = this.rowHeights[rowIndex - 1]

    this.rowHeights[rowIndex - 1] = heightAbove && removedHeight ? heightAbove + removedHeight : undefined
  }
}

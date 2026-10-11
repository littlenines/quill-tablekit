import { CELL_FORMAT } from '../config/constants'
import { indexes } from '../utils/array'
import { Delta } from '../utils/quill'
import { emptyCell, type CellData } from './cell'
import { makeId, type TableCellValue } from './cellValue'
import { cellAreas, cellsInArea, expandToWholeCells, placeCells, type CellArea } from './grid'
import { sumOf } from './layout'
import { withoutEmptyValues, type BorderStyle, type CellPadding, type TableAlign, type WidthUnit } from './properties'
import { groupLinesByCell, rowsOfCells } from './tableLines'

export interface PlacedCell {
  cell: CellData
  row: number
  column: number
  rowspan: number
  colspan: number
}

// A table as a grid: a merged cell is the same CellData in every spot it covers.
// The changes to it (rows, merging, moving...) are functions in the files next to this one.
export class TableModel {
  tableId: string
  rowIds: string[]
  grid: CellData[][]
  columnWidths: number[] | null
  widthUnit: WidthUnit = 'px'
  rowHeights: (number | undefined)[]
  header = false
  headerColumn = false
  tableAlign: TableAlign | undefined
  borderColor: string | undefined
  borderStyle: BorderStyle | undefined
  cellPadding: CellPadding | undefined
  striped = false
  stripeColor: string | undefined
  caption: string | undefined
  captionSide: 'bottom' | undefined

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
    const cellGroups = groupLinesByCell(tableDelta)
    const { rowIds, rowHeights, rows } = rowsOfCells(cellGroups)
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
    model.widthUnit = firstCellValue?.widthUnit ?? 'px'
    model.rowHeights = rowHeights.slice(0, model.rowCount)
    model.header = firstCellValue?.header === true
    model.headerColumn = firstCellValue?.headerColumn === true
    model.tableAlign = firstCellValue?.tableAlign
    model.borderColor = firstCellValue?.borderColor
    model.borderStyle = firstCellValue?.borderStyle
    model.cellPadding = firstCellValue?.cellPadding
    model.striped = firstCellValue?.striped === true
    model.stripeColor = firstCellValue?.stripeColor
    model.caption = firstCellValue?.caption
    model.captionSide = firstCellValue?.captionSide

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

  orderedCells(): PlacedCell[] {
    return [...cellAreas(this.grid)].map(([cell, { top, left, bottom, right }]) => ({
      cell,
      row: top,
      column: left,
      rowspan: bottom - top,
      colspan: right - left,
    }))
  }

  toDelta(savedWidths = this.columnWidths): Delta {
    let tableDelta = new Delta()

    const tableFields = withoutEmptyValues({
      widths: savedWidths ? [...savedWidths] : undefined,
      widthUnit: savedWidths && this.widthUnit === 'percent' ? ('percent' as const) : undefined,
      header: this.header || undefined,
      headerColumn: this.headerColumn || undefined,
      tableAlign: this.tableAlign,
      borderColor: this.borderColor,
      borderStyle: this.borderStyle,
      cellPadding: this.cellPadding,
      striped: this.striped || undefined,
      stripeColor: this.stripeColor,
      caption: this.caption,
      captionSide: this.captionSide,
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
}

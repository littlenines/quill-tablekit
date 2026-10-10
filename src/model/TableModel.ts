import { CELL_FORMAT } from '../config/constants'
import { indexes } from '../utils/array'
import { Delta } from '../utils/quill'
import { makeId, normalizeCellValue, type TableCellValue } from './cellValue'
import { cellAreas, cellsInArea, expandToWholeCells, placeCells, type CellArea, type SpannedCell } from './grid'

export interface CellData {
  id: string
  content: Delta
}

export interface PlacedCell {
  cell: CellData
  row: number
  column: number
  rowspan: number
  colspan: number
}

const emptyCell = (): CellData => ({ id: makeId('cell'), content: new Delta().insert('\n') })

const isEmptyContent = (content: Delta) => content.length() <= 1

const sumOf = (numbers: number[]) => numbers.reduce((total, number) => total + number, 0)

const uniqueId = (usedIds: Set<string>, preferredId: string, prefix: string): string => {
  const chosenId = usedIds.has(preferredId) ? makeId(prefix) : preferredId

  usedIds.add(chosenId)
  return chosenId
}

export class TableModel {
  tableId: string
  rowIds: string[]
  grid: CellData[][]
  columnWidths: number[] | null

  constructor(tableId: string, rowIds: string[], grid: CellData[][], columnWidths: number[] | null) {
    this.tableId = tableId
    this.rowIds = rowIds
    this.grid = grid
    this.columnWidths = columnWidths
  }

  static create(rowCount: number, columnCount: number): TableModel {
    const grid = indexes(rowCount).map(() => indexes(columnCount).map(emptyCell))

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
    const rows: SpannedCell<CellData>[][] = []

    for (const [groupIndex, { cellValue, content }] of cellGroups.entries()) {
      if (cellGroups[groupIndex - 1]?.cellValue.row !== cellValue.row) {
        rowIds.push(uniqueId(usedRowIds, cellValue.row, 'row'))
        rows.push([])
      }

      rows
        .at(-1)
        ?.push({
          cell: { id: uniqueId(usedCellIds, cellValue.cell, 'cell'), content },
          rowspan: cellValue.rowspan,
          colspan: cellValue.colspan,
        })
    }

    const tableId = cellGroups[0]?.cellValue.table ?? makeId('tbl')
    const model = new TableModel(tableId, rowIds, placeCells(rows, emptyCell), null)
    const storedWidths = cellGroups.find(({ cellValue }) => cellValue.widths)?.cellValue.widths

    model.setColumnWidths(storedWidths ?? null)
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

  insertRow(rowIndex: number): CellData[] {
    const newRow = indexes(this.columnCount).map((columnIndex) => {
      const cellAbove = this.grid[rowIndex - 1]?.[columnIndex]
      const cellBelow = this.grid[rowIndex]?.[columnIndex]

      return cellAbove && cellAbove === cellBelow ? cellAbove : emptyCell()
    })

    this.grid.splice(rowIndex, 0, newRow)
    this.rowIds.splice(rowIndex, 0, makeId('row'))

    return newRow
  }

  insertColumn(columnIndex: number, minWidth = 1): void {
    for (const row of this.grid) {
      const cellOnLeft = row[columnIndex - 1]
      const cellOnRight = row[columnIndex]

      row.splice(columnIndex, 0, cellOnLeft && cellOnLeft === cellOnRight ? cellOnLeft : emptyCell())
    }

    if (this.columnWidths) {
      const totalWidth = sumOf(this.columnWidths)
      const newWidth = this.columnWidths[columnIndex - 1] ?? this.columnWidths[columnIndex] ?? minWidth
      const scale = totalWidth / (totalWidth + newWidth)

      this.columnWidths.splice(columnIndex, 0, newWidth)
      this.columnWidths = this.columnWidths.map((width) => Math.max(minWidth, Math.round(width * scale)))
    }
  }

  deleteRows(firstRow: number, endRow: number): void {
    this.grid.splice(firstRow, endRow - firstRow)
    this.rowIds.splice(firstRow, endRow - firstRow)
    this.normalize()
  }

  deleteColumns(firstColumn: number, endColumn: number): void {
    for (const row of this.grid) row.splice(firstColumn, endColumn - firstColumn)

    this.columnWidths?.splice(firstColumn, endColumn - firstColumn)

    if (this.columnCount === 0) this.grid = []

    this.normalize()
  }

  merge(selectedArea: CellArea): CellData | null {
    const area = this.expandToWholeCells(selectedArea)
    const cellsToMerge = this.cellsInArea(area)

    if (cellsToMerge.length < 2) return null

    const mergedCell = this.grid[area.top][area.left]
    const cellsWithText = cellsToMerge.filter(({ content }) => !isEmptyContent(content))

    if (cellsWithText.length > 0) {
      mergedCell.content = cellsWithText.reduce((content, cell) => content.concat(cell.content), new Delta())
    }

    for (let rowIndex = area.top; rowIndex < area.bottom; rowIndex++) {
      this.grid[rowIndex].fill(mergedCell, area.left, area.right)
    }

    this.normalize()
    return mergedCell
  }

  split(mergedCell: CellData): boolean {
    const area = this.areaOf(mergedCell)

    if (!area || (area.bottom - area.top === 1 && area.right - area.left === 1)) return false

    for (let rowIndex = area.top; rowIndex < area.bottom; rowIndex++) {
      for (let columnIndex = area.left; columnIndex < area.right; columnIndex++) {
        const isTopLeft = rowIndex === area.top && columnIndex === area.left

        if (!isTopLeft) this.grid[rowIndex][columnIndex] = emptyCell()
      }
    }

    return true
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

  normalize(): void {
    for (let rowIndex = this.rowCount - 1; rowIndex > 0; rowIndex--) {
      const rowAbove = this.grid[rowIndex - 1]
      const isCoveredFromAbove = this.grid[rowIndex].every((cell, columnIndex) => cell === rowAbove[columnIndex])

      if (isCoveredFromAbove) {
        this.grid.splice(rowIndex, 1)
        this.rowIds.splice(rowIndex, 1)
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

    for (const { cell, row, rowspan, colspan } of this.orderedCells()) {
      const cellValue: TableCellValue = {
        table: this.tableId,
        row: this.rowIds[row],
        cell: cell.id,
        rowspan,
        colspan,
        ...(this.columnWidths && { widths: [...this.columnWidths] }),
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

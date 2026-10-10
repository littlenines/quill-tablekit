import { CELL_FORMAT } from '../config/constants'
import { indexes } from '../utils/array'
import { Delta } from '../utils/quill'
import { makeId, normalizeCellValue, type TableCellValue } from './cellValue'
import { cellAreas, cellsInArea, expandToWholeCells, placeCells, type CellArea, type SpannedCell } from './grid'
import { withoutEmptyValues, type CellStyle, type TableAlign, type TextAlign } from './properties'

export interface CellData {
  id: string
  content: Delta
  style: CellStyle
}

export interface PasteLimits {
  maxRows: number
  maxColumns: number
  minColumnWidth: number
}

export interface PlacedCell {
  cell: CellData
  row: number
  column: number
  rowspan: number
  colspan: number
}

const emptyCell = (style: CellStyle = {}): CellData => ({
  id: makeId('cell'),
  content: new Delta().insert('\n'),
  style: { ...style },
})

const cellStyleOf = ({ background, verticalAlign }: TableCellValue): CellStyle =>
  withoutEmptyValues({ background, verticalAlign })

const isEmptyContent = (content: Delta) => content.length() <= 1

const emptyContentKeepingLineFormat = (content: Delta): Delta => {
  let firstLineAttributes: Record<string, unknown> = {}

  content.eachLine((_lineContent, lineAttributes) => {
    firstLineAttributes = lineAttributes
    return false
  })

  const hasAttributes = Object.keys(firstLineAttributes).length > 0

  return new Delta().insert('\n', hasAttributes ? firstLineAttributes : undefined)
}

const startsAt = (area: CellArea | undefined, rowIndex: number, columnIndex: number) =>
  area?.top === rowIndex && area.left === columnIndex

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
  rowHeights: (number | undefined)[]
  header = false
  tableAlign: TableAlign | undefined
  borderColor: string | undefined

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

      if (cellAbove && cellAbove === cellBelow) return cellAbove

      return emptyCell((cellAbove ?? cellBelow)?.style)
    })

    this.grid.splice(rowIndex, 0, newRow)
    this.rowIds.splice(rowIndex, 0, makeId('row'))
    this.rowHeights.splice(rowIndex, 0, undefined)

    return newRow
  }

  insertColumn(columnIndex: number, minWidth = 1): void {
    for (const row of this.grid) {
      const cellOnLeft = row[columnIndex - 1]
      const cellOnRight = row[columnIndex]

      const isInsideMergedCell = cellOnLeft && cellOnLeft === cellOnRight

      row.splice(columnIndex, 0, isInsideMergedCell ? cellOnLeft : emptyCell((cellOnLeft ?? cellOnRight)?.style))
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
    this.rowHeights.splice(firstRow, endRow - firstRow)
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

        if (!isTopLeft) this.grid[rowIndex][columnIndex] = emptyCell(mergedCell.style)
      }
    }

    return true
  }

  updateCellStyle(cells: CellData[], styleChanges: { [Field in keyof CellStyle]?: CellStyle[Field] | null }): void {
    for (const cell of cells) cell.style = withoutEmptyValues({ ...cell.style, ...styleChanges })
  }

  setTextAlign(cells: CellData[], textAlign: TextAlign | undefined): void {
    for (const cell of cells) {
      let alignedContent = new Delta()

      cell.content.eachLine((lineContent, { align: _previousAlign, ...otherAttributes }) => {
        const lineAttributes = textAlign ? { ...otherAttributes, align: textAlign } : otherAttributes
        const hasAttributes = Object.keys(lineAttributes).length > 0

        alignedContent = alignedContent.concat(lineContent).insert('\n', hasAttributes ? lineAttributes : undefined)
      })

      cell.content = alignedContent
    }
  }

  clearContent(cells: CellData[]): void {
    for (const cell of cells) cell.content = emptyContentKeepingLineFormat(cell.content)
  }

  pasteTable(source: TableModel, top: number, left: number, limits: PasteLimits): CellArea {
    const neededRows = Math.min(limits.maxRows, top + source.rowCount)
    const neededColumns = Math.min(limits.maxColumns, left + source.columnCount)

    while (this.rowCount < neededRows) this.insertRow(this.rowCount)

    while (this.columnCount < neededColumns) this.insertColumn(this.columnCount, limits.minColumnWidth)

    const targetAreas = cellAreas(this.grid)
    const sourceAreas = cellAreas(source.grid)

    for (const [sourceRow, sourceCells] of source.grid.entries()) {
      for (const [sourceColumn, sourceCell] of sourceCells.entries()) {
        const targetRow = top + sourceRow
        const targetColumn = left + sourceColumn
        const targetCell = this.grid[targetRow]?.[targetColumn]

        if (!targetCell || !startsAt(targetAreas.get(targetCell), targetRow, targetColumn)) continue

        const isSourceCellStart = startsAt(sourceAreas.get(sourceCell), sourceRow, sourceColumn)

        targetCell.content = isSourceCellStart ? sourceCell.content : emptyContentKeepingLineFormat(targetCell.content)
        targetCell.style = { ...sourceCell.style }
      }
    }

    return {
      top,
      left,
      bottom: Math.min(this.rowCount, top + source.rowCount),
      right: Math.min(this.columnCount, left + source.columnCount),
    }
  }

  setRowHeights(rowHeights: (number | null | undefined)[] | null): void {
    this.rowHeights = this.rowIds.map((_rowId, rowIndex) => {
      const height = rowHeights?.[rowIndex]

      return height != null && Number.isFinite(height) && height > 0 ? Math.round(height) : undefined
    })
  }

  #foldRowHeightIntoRowAbove(rowIndex: number): void {
    const [removedHeight] = this.rowHeights.splice(rowIndex, 1)
    const heightAbove = this.rowHeights[rowIndex - 1]

    this.rowHeights[rowIndex - 1] = heightAbove && removedHeight ? heightAbove + removedHeight : undefined
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

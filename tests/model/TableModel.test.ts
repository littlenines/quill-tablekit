import { describe, expect, it } from 'vitest'
import { Delta } from 'quill'
import { CELL_FORMAT } from '../../src/config/constants'
import { TableModel } from '../../src/model/TableModel'
import type { TableCellValue } from '../../src/model/cellValue'

const cellValuesIn = (tableDelta: Delta): TableCellValue[] =>
  tableDelta.ops
    .filter((operation) => operation.attributes?.[CELL_FORMAT])
    .map((operation) => operation.attributes?.[CELL_FORMAT] as TableCellValue)

const tableLine = (text: string, cellValue: Partial<TableCellValue> & { row: string; cell: string }): Delta =>
  new Delta().insert(text).insert('\n', { [CELL_FORMAT]: { table: 't', rowspan: 1, colspan: 1, ...cellValue } })

const sumOf = (numbers: number[]) => numbers.reduce((total, number) => total + number, 0)

describe('TableModel', () => {
  it('creates an empty grid and writes one line per cell', () => {
    const model = TableModel.create(2, 3)
    const cellValues = cellValuesIn(model.toDelta())

    expect(model.toDelta().length()).toBe(6)
    expect(new Set(cellValues.map((cellValue) => cellValue.row)).size).toBe(2)
    expect(new Set(cellValues.map((cellValue) => cellValue.cell)).size).toBe(6)
    expect(cellValues.every((cellValue) => cellValue.rowspan === 1 && cellValue.colspan === 1)).toBe(true)
  })

  it('round-trips through a Delta, including multi-line cells and line attributes', () => {
    const tableDelta = new Delta()
      .concat(tableLine('first', { row: 'r1', cell: 'c1' }))
      .insert('second line')
      .insert('\n', { [CELL_FORMAT]: { table: 't', row: 'r1', cell: 'c1', rowspan: 1, colspan: 1 }, align: 'center' })
      .concat(tableLine('other cell', { row: 'r1', cell: 'c2' }))

    const model = TableModel.fromDelta(tableDelta)

    expect(model.rowCount).toBe(1)
    expect(model.columnCount).toBe(2)
    expect(model.toDelta()).toEqual(tableDelta)
  })

  it('places merged cells on the grid', () => {
    const tableDelta = new Delta()
      .concat(tableLine('A', { row: 'r1', cell: 'tall', rowspan: 2 }))
      .concat(tableLine('B', { row: 'r1', cell: 'top-right' }))
      .concat(tableLine('D', { row: 'r2', cell: 'bottom-right' }))

    const model = TableModel.fromDelta(tableDelta)

    expect(model.grid.map((row) => row.map((cell) => cell.id))).toEqual([
      ['tall', 'top-right'],
      ['tall', 'bottom-right'],
    ])
  })

  it('repairs ragged rows and overlapping spans instead of producing a broken grid', () => {
    const tableDelta = new Delta()
      .concat(tableLine('A', { row: 'r1', cell: 'wide', colspan: 3 }))
      .concat(tableLine('B', { row: 'r2', cell: 'single' }))

    const model = TableModel.fromDelta(tableDelta)

    expect(model.columnCount).toBe(3)
    expect(model.rowCount).toBe(2)
    expect(model.grid[1][0].id).toBe('single')
    expect(model.grid[1][1]).not.toBe(model.grid[1][2])
  })

  it('merges a block of cells into the top-left cell and keeps all the text', () => {
    const model = TableModel.create(2, 2)

    model.grid[0][0].content = new Delta().insert('one\n')
    model.grid[1][1].content = new Delta().insert('four\n')

    const mergedCell = model.merge({ top: 0, left: 0, bottom: 2, right: 2 })

    expect(mergedCell).toBe(model.grid[0][0])
    expect(mergedCell?.content).toEqual(new Delta().insert('one\nfour\n'))
    expect(model.rowCount).toBe(1)
    expect(model.columnCount).toBe(1)
  })

  it('writes rowspan and colspan for a partial merge', () => {
    const model = TableModel.create(3, 3)

    model.merge({ top: 0, left: 0, bottom: 2, right: 2 })

    const [mergedCellValue] = cellValuesIn(model.toDelta())

    expect(mergedCellValue.rowspan).toBe(2)
    expect(mergedCellValue.colspan).toBe(2)
    expect(model.cellsInArea({ top: 0, left: 0, bottom: 3, right: 3 })).toHaveLength(6)
  })

  it('grows a selection to whole merged cells', () => {
    const model = TableModel.create(3, 3)

    model.merge({ top: 1, left: 1, bottom: 3, right: 3 })

    expect(model.expandToWholeCells({ top: 0, left: 1, bottom: 2, right: 2 })).toEqual({
      top: 0,
      left: 1,
      bottom: 3,
      right: 3,
    })
  })

  it('splits a merged cell back into single cells', () => {
    const model = TableModel.create(3, 3)
    const mergedCell = model.merge({ top: 0, left: 0, bottom: 2, right: 2 })

    if (!mergedCell) throw new Error('merge failed')

    expect(model.split(mergedCell)).toBe(true)
    expect(model.cellsInArea({ top: 0, left: 0, bottom: 3, right: 3 })).toHaveLength(9)
    expect(model.split(model.grid[2][2])).toBe(false)
  })

  it('extends a merged cell when a row is inserted through it', () => {
    const model = TableModel.create(3, 2)
    const mergedCell = model.merge({ top: 0, left: 0, bottom: 2, right: 1 })

    model.insertRow(1)

    expect(model.rowCount).toBe(4)
    expect(model.grid[1][0]).toBe(mergedCell)
    expect(model.grid[1][1]).not.toBe(model.grid[0][1])
  })

  it('inserts a column without changing the total width', () => {
    const model = TableModel.create(1, 2)

    model.setColumnWidths([200, 200])
    model.insertColumn(1, 40)

    expect(model.columnWidths).toHaveLength(3)
    expect(sumOf(model.columnWidths ?? [])).toBeCloseTo(400, -1)
  })

  it('deletes rows and columns, shrinking merged cells that cross them', () => {
    const model = TableModel.create(3, 3)
    const mergedCell = model.merge({ top: 0, left: 0, bottom: 3, right: 1 })

    model.deleteRows(1, 2)
    expect(model.rowCount).toBe(2)
    expect(model.grid[1][0]).toBe(mergedCell)

    model.deleteColumns(0, 1)
    expect(model.columnCount).toBe(2)
    expect(model.grid.flat()).not.toContain(mergedCell)
  })

  it('is empty after deleting every row', () => {
    const model = TableModel.create(2, 2)

    model.deleteRows(0, 2)
    expect(model.isEmpty).toBe(true)
    expect(model.toDelta().length()).toBe(0)
  })

  it('folds the width of a removed column into the column on its left', () => {
    const model = TableModel.create(1, 3)

    model.setColumnWidths([100, 100, 100])
    model.merge({ top: 0, left: 1, bottom: 1, right: 3 })

    expect(model.columnWidths).toEqual([100, 200])
  })

  it('reports where each cell starts in the written Delta', () => {
    const model = TableModel.create(1, 2)

    model.grid[0][0].content = new Delta().insert('hello\n')
    expect(model.cellOffset(model.grid[0][1].id)).toBe(6)
    expect(model.cellOffset('missing')).toBe(-1)
  })
})

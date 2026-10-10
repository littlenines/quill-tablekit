import { describe, expect, it } from 'vitest'
import { Delta } from 'quill'
import { CELL_FORMAT } from '../../src/config/constants'
import { TableModel } from '../../src/model/TableModel'
import { mergeCells } from '../../src/model/merging'
import { cellValuesIn, tableLine } from './modelHelpers'

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

  it('grows a selection to whole merged cells', () => {
    const model = TableModel.create(3, 3)

    mergeCells(model, { top: 1, left: 1, bottom: 3, right: 3 })

    expect(model.expandToWholeCells({ top: 0, left: 1, bottom: 2, right: 2 })).toEqual({
      top: 0,
      left: 1,
      bottom: 3,
      right: 3,
    })
  })

  it('reports where each cell starts in the written Delta', () => {
    const model = TableModel.create(1, 2)

    model.grid[0][0].content = new Delta().insert('hello\n')
    expect(model.cellOffset(model.grid[0][1].id)).toBe(6)
    expect(model.cellOffset('missing')).toBe(-1)
  })

  it('round-trips table and cell properties through a Delta', () => {
    const tableDelta = new Delta()
      .concat(tableLine('A', { row: 'r1', cell: 'c1', header: true, tableAlign: 'center', background: '#fff2cc' }))
      .concat(tableLine('B', { row: 'r1', cell: 'c2', header: true, tableAlign: 'center', verticalAlign: 'middle' }))

    const model = TableModel.fromDelta(tableDelta)

    expect(model.header).toBe(true)
    expect(model.tableAlign).toBe('center')
    expect(model.grid[0][0].style).toEqual({ background: '#fff2cc' })
    expect(model.toDelta()).toEqual(tableDelta)
  })

  it('ignores row heights that are not positive numbers', () => {
    const model = TableModel.create(3, 1)

    model.setRowHeights([50, -5, null])

    expect(model.rowHeights).toEqual([50, undefined, undefined])
  })
})

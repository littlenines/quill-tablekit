import { describe, expect, it } from 'vitest'
import { Delta } from 'quill'
import { TableModel } from '../../src/model/TableModel'
import { updateCellStyle } from '../../src/model/cellChanges'
import { mergeCells } from '../../src/model/merging'
import { deleteColumns, deleteRows, insertColumn, insertRow } from '../../src/model/rowsAndColumns'
import { tableLine, sumOf } from './modelHelpers'

describe('inserting and deleting rows and columns', () => {
  it('extends a merged cell when a row is inserted through it', () => {
    const model = TableModel.create(3, 2)
    const mergedCell = mergeCells(model, { top: 0, left: 0, bottom: 2, right: 1 })

    insertRow(model, 1)

    expect(model.rowCount).toBe(4)
    expect(model.grid[1][0]).toBe(mergedCell)
    expect(model.grid[1][1]).not.toBe(model.grid[0][1])
  })

  it('inserts a column without changing the total width', () => {
    const model = TableModel.create(1, 2)

    model.setColumnWidths([200, 200])
    insertColumn(model, 1, 40)

    expect(model.columnWidths).toHaveLength(3)
    expect(sumOf(model.columnWidths ?? [])).toBeCloseTo(400, -1)
  })

  it('deletes rows and columns, shrinking merged cells that cross them', () => {
    const model = TableModel.create(3, 3)
    const mergedCell = mergeCells(model, { top: 0, left: 0, bottom: 3, right: 1 })

    deleteRows(model, 1, 2)
    expect(model.rowCount).toBe(2)
    expect(model.grid[1][0]).toBe(mergedCell)

    deleteColumns(model, 0, 1)
    expect(model.columnCount).toBe(2)
    expect(model.grid.flat()).not.toContain(mergedCell)
  })

  it('is empty after deleting every row', () => {
    const model = TableModel.create(2, 2)

    deleteRows(model, 0, 2)
    expect(model.isEmpty).toBe(true)
    expect(model.toDelta().length()).toBe(0)
  })

  it('gives new rows and columns the look of the cells next to them', () => {
    const model = TableModel.create(1, 1)

    updateCellStyle([model.grid[0][0]], { background: '#fff2cc' })
    insertRow(model, 1)
    insertColumn(model, 1)

    expect(model.grid.flat().every((cell) => cell.style.background === '#fff2cc')).toBe(true)
  })

  it('keeps row heights with their rows', () => {
    const tableDelta = new Delta()
      .concat(tableLine('A', { row: 'r1', cell: 'c1', rowHeight: 60 }))
      .concat(tableLine('B', { row: 'r2', cell: 'c2' }))

    const model = TableModel.fromDelta(tableDelta)

    expect(model.rowHeights).toEqual([60, undefined])
    expect(model.toDelta()).toEqual(tableDelta)

    insertRow(model, 0)
    expect(model.rowHeights).toEqual([undefined, 60, undefined])

    deleteRows(model, 0, 1)
    expect(model.rowHeights).toEqual([60, undefined])
  })
})

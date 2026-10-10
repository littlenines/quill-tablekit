import { describe, expect, it } from 'vitest'
import { Delta } from 'quill'
import { TableModel } from '../../src/model/TableModel'
import { updateCellStyle } from '../../src/model/cellChanges'
import { mergeCells, splitCell } from '../../src/model/merging'
import { cellValuesIn } from './modelHelpers'

describe('merging and splitting', () => {
  it('merges a block of cells into the top-left cell and keeps all the text', () => {
    const model = TableModel.create(2, 2)

    model.grid[0][0].content = new Delta().insert('one\n')
    model.grid[1][1].content = new Delta().insert('four\n')

    const mergedCell = mergeCells(model, { top: 0, left: 0, bottom: 2, right: 2 })

    expect(mergedCell).toBe(model.grid[0][0])
    expect(mergedCell?.content).toEqual(new Delta().insert('one\nfour\n'))
    expect(model.rowCount).toBe(1)
    expect(model.columnCount).toBe(1)
  })

  it('writes rowspan and colspan for a partial merge', () => {
    const model = TableModel.create(3, 3)

    mergeCells(model, { top: 0, left: 0, bottom: 2, right: 2 })

    const [mergedCellValue] = cellValuesIn(model.toDelta())

    expect(mergedCellValue.rowspan).toBe(2)
    expect(mergedCellValue.colspan).toBe(2)
    expect(model.cellsInArea({ top: 0, left: 0, bottom: 3, right: 3 })).toHaveLength(6)
  })

  it('splits a merged cell back into single cells', () => {
    const model = TableModel.create(3, 3)
    const mergedCell = mergeCells(model, { top: 0, left: 0, bottom: 2, right: 2 })

    if (!mergedCell) throw new Error('merge failed')

    expect(splitCell(model, mergedCell)).toBe(true)
    expect(model.cellsInArea({ top: 0, left: 0, bottom: 3, right: 3 })).toHaveLength(9)
    expect(splitCell(model, model.grid[2][2])).toBe(false)
  })

  it('gives every cell of a split cell its look', () => {
    const model = TableModel.create(2, 2)
    const mergedCell = mergeCells(model, { top: 0, left: 0, bottom: 1, right: 2 })

    if (!mergedCell) throw new Error('merge failed')

    updateCellStyle([mergedCell], { verticalAlign: 'bottom' })
    splitCell(model, mergedCell)

    const verticalAligns = model.grid.map((row) => row.map((cell) => cell.style.verticalAlign))

    expect(verticalAligns).toEqual([
      ['bottom', 'bottom'],
      [undefined, undefined],
    ])
  })

  it('folds the width of a removed column into the column on its left', () => {
    const model = TableModel.create(1, 3)

    model.setColumnWidths([100, 100, 100])
    mergeCells(model, { top: 0, left: 1, bottom: 1, right: 3 })

    expect(model.columnWidths).toEqual([100, 200])
  })

  it('adds the heights of two rows together when merging makes them one', () => {
    const model = TableModel.create(2, 1)

    model.setRowHeights([40, 30])
    mergeCells(model, { top: 0, left: 0, bottom: 2, right: 1 })

    expect(model.rowHeights).toEqual([70])
  })
})

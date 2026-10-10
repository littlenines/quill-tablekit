import { describe, expect, it } from 'vitest'
import {
  canMoveColumns,
  canMoveRows,
  duplicateColumns,
  duplicateRows,
  moveColumns,
  moveRows,
} from '../../src/model/arrange'
import { updateCellStyle } from '../../src/model/cellChanges'
import { mergeCells } from '../../src/model/merging'
import { tableWithTexts, textsOf, area } from './modelHelpers'

describe('moving rows', () => {
  it('swaps the row with the one below it', () => {
    const model = tableWithTexts([
      ['a1', 'b1'],
      ['a2', 'b2'],
      ['a3', 'b3'],
    ])
    const firstRowId = model.rowIds[0]

    expect(moveRows(model, area(0, 0), 1)).toBe(true)
    expect(textsOf(model)).toEqual([
      ['a2', 'b2'],
      ['a1', 'b1'],
      ['a3', 'b3'],
    ])
    expect(model.rowIds[1]).toBe(firstRowId)
  })

  it('keeps the row height with its row', () => {
    const model = tableWithTexts([['a1'], ['a2']])

    model.setRowHeights([50, null])
    moveRows(model, area(1, 0), -1)

    expect(model.rowHeights).toEqual([undefined, 50])
  })

  it('cannot move the first row up or the last row down', () => {
    const model = tableWithTexts([['a1'], ['a2']])

    expect(canMoveRows(model, area(0, 0), -1)).toBe(false)
    expect(canMoveRows(model, area(1, 0), 1)).toBe(false)
    expect(moveRows(model, area(0, 0), -1)).toBe(false)
    expect(textsOf(model)).toEqual([['a1'], ['a2']])
  })

  it('moves a cell merged down together with every row it covers', () => {
    const model = tableWithTexts([
      ['a1', 'b1'],
      ['a2', 'b2'],
      ['a3', 'b3'],
    ])

    mergeCells(model, area(1, 0, 3, 1))
    moveRows(model, area(1, 1), -1)

    expect(textsOf(model)).toEqual([
      ['a2\na3', 'b2'],
      ['a2\na3', 'b3'],
      ['a1', 'b1'],
    ])
  })

  it('jumps over a neighbor that is merged down as a whole', () => {
    const model = tableWithTexts([
      ['a1', 'b1'],
      ['a2', 'b2'],
      ['a3', 'b3'],
    ])

    mergeCells(model, area(0, 0, 2, 1))
    moveRows(model, area(2, 0), -1)

    expect(textsOf(model)).toEqual([
      ['a3', 'b3'],
      ['a1\na2', 'b1'],
      ['a1\na2', 'b2'],
    ])
  })
})

describe('moving columns', () => {
  it('swaps the column with the one on its left, widths included', () => {
    const model = tableWithTexts([
      ['a1', 'b1', 'c1'],
      ['a2', 'b2', 'c2'],
    ])

    model.setColumnWidths([100, 200, 300])
    moveColumns(model, area(0, 2), -1)

    expect(textsOf(model)).toEqual([
      ['a1', 'c1', 'b1'],
      ['a2', 'c2', 'b2'],
    ])
    expect(model.columnWidths).toEqual([100, 300, 200])
  })

  it('cannot move the first column left or the last column right', () => {
    const model = tableWithTexts([['a1', 'b1']])

    expect(canMoveColumns(model, area(0, 0), -1)).toBe(false)
    expect(canMoveColumns(model, area(0, 1), 1)).toBe(false)
    expect(canMoveColumns(model, area(0, 0), 1)).toBe(true)
  })
})

describe('duplicating', () => {
  it('adds a copy of the row below it, with new ids', () => {
    const model = tableWithTexts([
      ['a1', 'b1'],
      ['a2', 'b2'],
    ])

    duplicateRows(model, area(0, 1))

    expect(textsOf(model)).toEqual([
      ['a1', 'b1'],
      ['a1', 'b1'],
      ['a2', 'b2'],
    ])
    expect(new Set(model.rowIds).size).toBe(3)
    expect(model.grid[1][0]).not.toBe(model.grid[0][0])
    expect(model.grid[1][0].id).not.toBe(model.grid[0][0].id)
  })

  it('keeps merged cells merged in the copy', () => {
    const model = tableWithTexts([
      ['a1', 'b1', 'c1'],
      ['a2', 'b2', 'c2'],
    ])

    mergeCells(model, area(0, 0, 1, 2))
    duplicateRows(model, area(0, 0))

    expect(model.grid[1][0]).toBe(model.grid[1][1])
    expect(model.grid[1][0]).not.toBe(model.grid[0][0])
    expect(textsOf(model)[1]).toEqual(['a1\nb1', 'a1\nb1', 'c1'])
  })

  it('adds a copy of the column on its right and keeps the table width', () => {
    const model = tableWithTexts([
      ['a1', 'b1'],
      ['a2', 'b2'],
    ])

    model.setColumnWidths([200, 400])
    duplicateColumns(model, area(0, 0), 40)

    expect(textsOf(model)).toEqual([
      ['a1', 'a1', 'b1'],
      ['a2', 'a2', 'b2'],
    ])
    expect(model.columnWidths).toEqual([150, 150, 300])
  })

  it('copies the cell style', () => {
    const model = tableWithTexts([['a1']])

    updateCellStyle([model.grid[0][0]], { background: '#ff0000' })
    duplicateColumns(model, area(0, 0))

    expect(model.grid[0][1].style).toEqual({ background: '#ff0000' })
  })
})

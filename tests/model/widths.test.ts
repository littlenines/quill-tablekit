import { describe, expect, it } from 'vitest'
import { equalizeColumnWidths, fitToWidth, hasEqualColumns } from '../../src/model/widths'
import { tableWithTexts } from './modelHelpers'

describe('column widths', () => {
  it('makes every column the same width without changing the table width', () => {
    const model = tableWithTexts([['a', 'b', 'c']])

    model.setColumnWidths([100, 300, 201])

    expect(hasEqualColumns(model)).toBe(false)

    equalizeColumnWidths(model)

    expect(model.columnWidths).toEqual([201, 200, 200])
    expect(hasEqualColumns(model)).toBe(true)
  })

  it('treats a table without saved widths as already equal', () => {
    const model = tableWithTexts([['a', 'b']])

    expect(hasEqualColumns(model)).toBe(true)

    equalizeColumnWidths(model)

    expect(model.columnWidths).toBeNull()
  })

  it('fits the table to a width and keeps the proportions', () => {
    const model = tableWithTexts([['a', 'b']])

    model.setColumnWidths([100, 300])
    fitToWidth(model, 800, 40)

    expect(model.columnWidths).toEqual([200, 600])
  })

  it('does nothing when the width is not known', () => {
    const model = tableWithTexts([['a', 'b']])

    model.setColumnWidths([100, 300])
    fitToWidth(model, Infinity, 40)

    expect(model.columnWidths).toEqual([100, 300])
  })
})

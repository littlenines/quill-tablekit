import { describe, expect, it } from 'vitest'
import { mergeCells } from '../../../src/model/operations/merging'
import { canSortRows, sortRows } from '../../../src/model/operations/sort'
import { area, tableWithTexts, textsOf } from '../modelHelpers'

describe('sorting rows', () => {
  it('sorts the rows by the text in a column', () => {
    const model = tableWithTexts([
      ['pear', '3'],
      ['Apple', '1'],
      ['banana', '2'],
    ])

    expect(sortRows(model, 0, 'ascending')).toBe(true)
    expect(textsOf(model)).toEqual([
      ['Apple', '1'],
      ['banana', '2'],
      ['pear', '3'],
    ])

    sortRows(model, 1, 'descending')

    expect(textsOf(model).map(([fruit]) => fruit)).toEqual(['pear', 'banana', 'Apple'])
  })

  it('sorts numbers by their value', () => {
    const model = tableWithTexts([['10'], ['-2'], ['1.5'], ['9'], ['1.25']])

    sortRows(model, 0, 'ascending')

    expect(textsOf(model).flat()).toEqual(['-2', '1.25', '1.5', '9', '10'])
  })

  it('compares the numbers inside text', () => {
    const model = tableWithTexts([['Item 10'], ['Item 2'], ['Item 1']])

    sortRows(model, 0, 'ascending')

    expect(textsOf(model).flat()).toEqual(['Item 1', 'Item 2', 'Item 10'])
  })

  it('puts empty cells last in both orders', () => {
    const model = tableWithTexts([[''], ['b'], ['a']])

    sortRows(model, 0, 'ascending')
    expect(textsOf(model).flat()).toEqual(['a', 'b', ''])

    sortRows(model, 0, 'descending')
    expect(textsOf(model).flat()).toEqual(['b', 'a', ''])
  })

  it('keeps the order of rows with the same text', () => {
    const model = tableWithTexts([
      ['x', '1'],
      ['a', '2'],
      ['x', '3'],
    ])

    sortRows(model, 0, 'descending')

    expect(textsOf(model)).toEqual([
      ['x', '1'],
      ['x', '3'],
      ['a', '2'],
    ])
  })

  it('leaves the header row on top', () => {
    const model = tableWithTexts([['Name'], ['b'], ['a']])

    model.header = true
    sortRows(model, 0, 'descending')

    expect(textsOf(model).flat()).toEqual(['Name', 'b', 'a'])
  })

  it('moves the row ids and heights with their rows', () => {
    const model = tableWithTexts([['b'], ['a']])
    const [firstRowId, secondRowId] = model.rowIds

    model.setRowHeights([40, null])
    sortRows(model, 0, 'ascending')

    expect(model.rowIds).toEqual([secondRowId, firstRowId])
    expect(model.rowHeights).toEqual([undefined, 40])
  })

  it('keeps cells merged across columns in their row', () => {
    const model = tableWithTexts([
      ['b', 'b2'],
      ['a', 'a2'],
    ])

    mergeCells(model, area(0, 0, 1, 2))
    sortRows(model, 1, 'ascending')

    expect(model.grid[1][0]).toBe(model.grid[1][1])
    expect(textsOf(model)[0]).toEqual(['a', 'a2'])
  })

  it('does not sort when a cell spans several rows', () => {
    const model = tableWithTexts([
      ['b', '1'],
      ['a', '2'],
      ['c', '3'],
    ])

    mergeCells(model, area(0, 0, 2, 1))

    expect(canSortRows(model)).toBe(false)
    expect(sortRows(model, 0, 'ascending')).toBe(false)
  })

  it('needs at least two rows to sort', () => {
    const model = tableWithTexts([['Name'], ['a']])

    model.header = true

    expect(canSortRows(model)).toBe(false)
  })
})

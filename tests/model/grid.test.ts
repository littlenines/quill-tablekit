import { describe, expect, it } from 'vitest'
import {
  cellAreas,
  cellsInArea,
  combineAreas,
  expandToWholeCells,
  placeCells,
  type CellArea,
} from '../../src/model/grid'

const spannedCell = (cell: string, rowspan = 1, colspan = 1) => ({ cell, rowspan, colspan })

describe('placeCells', () => {
  it('lays out spans like an HTML table', () => {
    const grid = placeCells([[spannedCell('a', 2), spannedCell('b')], [spannedCell('c')]], () => '-')

    expect(grid).toEqual([
      ['a', 'b'],
      ['a', 'c'],
    ])
  })

  it('clips spans that would overlap instead of corrupting the grid', () => {
    const grid = placeCells([[spannedCell('a', 1, 2)], [spannedCell('b', 1, 3)]], () => '-')

    expect(grid).toEqual([
      ['a', 'a', '-'],
      ['b', 'b', 'b'],
    ])
  })

  it('clips row spans at the end of the table', () => {
    const grid = placeCells([[spannedCell('a', 5)]], () => '-')

    expect(grid).toEqual([['a']])
  })

  it('fills holes left by ragged rows', () => {
    let fillerCount = 0
    const grid = placeCells([[spannedCell('a'), spannedCell('b')], [spannedCell('c')]], () => `filler${++fillerCount}`)

    expect(grid).toEqual([
      ['a', 'b'],
      ['c', 'filler1'],
    ])
  })
})

describe('cell areas', () => {
  const grid = [
    ['a', 'a', 'b'],
    ['c', 'd', 'b'],
    ['e', 'f', 'g'],
  ]

  it('finds the area of every cell', () => {
    const areas = cellAreas(grid)

    expect(areas.get('a')).toEqual({ top: 0, left: 0, bottom: 1, right: 2 })
    expect(areas.get('b')).toEqual({ top: 0, left: 2, bottom: 2, right: 3 })
  })

  it('grows an area until no merged cell sticks out', () => {
    const expandInGrid = (area: CellArea) => expandToWholeCells(grid, area)

    expect(expandInGrid({ top: 1, left: 1, bottom: 2, right: 2 })).toEqual({ top: 1, left: 1, bottom: 2, right: 2 })
    expect(expandInGrid({ top: 1, left: 0, bottom: 2, right: 1 })).toEqual({ top: 1, left: 0, bottom: 2, right: 1 })
    expect(expandInGrid({ top: 0, left: 1, bottom: 1, right: 2 })).toEqual({ top: 0, left: 0, bottom: 1, right: 2 })
    expect(expandInGrid({ top: 1, left: 1, bottom: 2, right: 3 })).toEqual({ top: 0, left: 0, bottom: 2, right: 3 })
  })

  it('lists the distinct cells in an area in reading order', () => {
    expect(cellsInArea(grid, { top: 0, left: 0, bottom: 2, right: 3 })).toEqual(['a', 'b', 'c', 'd'])
  })

  it('combines two areas', () => {
    const topRight = { top: 0, left: 2, bottom: 1, right: 3 }
    const bottomLeft = { top: 1, left: 0, bottom: 3, right: 1 }

    expect(combineAreas(topRight, bottomLeft)).toEqual({ top: 0, left: 0, bottom: 3, right: 3 })
  })
})

import { describe, expect, it } from 'vitest'
import { equalColumnWidths, swapNeighbors } from '../../src/model/layout'

describe('equalColumnWidths', () => {
  it('splits the total width evenly and gives the leftover pixels to the first columns', () => {
    expect(equalColumnWidths([100, 200, 302])).toEqual([201, 201, 200])
  })
})

describe('swapNeighbors', () => {
  it('swaps two blocks that sit next to each other', () => {
    const letters = ['a', 'b', 'c', 'd', 'e']

    swapNeighbors(letters, 1, 3, 4)

    expect(letters).toEqual(['a', 'd', 'b', 'c', 'e'])
  })
})

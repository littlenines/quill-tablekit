import { describe, expect, it } from 'vitest'
import { resizeColumns } from '../../src/ui/ColumnResizer'

describe('resizeColumns', () => {
  it('trades width between neighbours for an inner edge', () => {
    expect(resizeColumns([100, 100, 100], 1, 30, 40)).toEqual([130, 70, 100])
  })

  it('respects the minimum width on both sides', () => {
    expect(resizeColumns([100, 100], 1, 500, 40)).toEqual([160, 40])
    expect(resizeColumns([100, 100], 1, -500, 40)).toEqual([40, 160])
  })

  it('grows the table when dragging the outer edge', () => {
    expect(resizeColumns([100, 100], 2, 50, 40)).toEqual([100, 150])
  })

  it('ignores edges outside the table', () => {
    expect(resizeColumns([100, 100], 0, 50, 40)).toEqual([100, 100])
    expect(resizeColumns([100, 100], 3, 50, 40)).toEqual([100, 100])
  })
})

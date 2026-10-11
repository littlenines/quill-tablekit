import { describe, expect, it } from 'vitest'
import { resizeColumns, tableLeftAfterResize } from '../../src/ui/resize/resizeMath'

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
    expect(resizeColumns([100, 100], 3, 50, 40)).toEqual([100, 100])
  })

  it('treats the left edge as the first column’s outer edge, for centered and right-aligned tables', () => {
    expect(resizeColumns([100, 100], 0, -50, 40)).toEqual([150, 100])
    expect(resizeColumns([100, 100], 0, 80, 40)).toEqual([40, 100])
    expect(resizeColumns([100, 100], 0, -500, 40, 300)).toEqual([200, 100])
  })

  it('stops the outer edge at the editor width', () => {
    expect(resizeColumns([100, 100], 2, 500, 40, 300)).toEqual([100, 200])
  })

  it('lets a table that is already too wide get narrower, but not wider', () => {
    expect(resizeColumns([300, 300], 2, 50, 40, 500)).toEqual([300, 300])
    expect(resizeColumns([300, 300], 2, -50, 40, 500)).toEqual([300, 250])
  })
})

describe('tableLeftAfterResize', () => {
  const tableBox = new DOMRect(100, 0, 400, 50)

  it('keeps the left edge of a left-aligned table', () => {
    expect(tableLeftAfterResize(tableBox, 'left', 300)).toBe(100)
  })

  it('keeps the center of a centered table', () => {
    expect(tableLeftAfterResize(tableBox, 'center', 300)).toBe(150)
  })

  it('keeps the right edge of a right-aligned table', () => {
    expect(tableLeftAfterResize(tableBox, 'right', 300)).toBe(200)
  })
})

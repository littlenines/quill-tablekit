import { describe, expect, it } from 'vitest'
import { scaleColumnWidths } from '../../src/model/layout'
import { isPastWidthLimit } from '../../src/ui/resize/dragging'
import { growRowHeights, rowHeightAfterDrag, savedHeightAfterDrag } from '../../src/ui/resize/resizeMath'

describe('rowHeightAfterDrag', () => {
  it('adds the drag distance to the row', () => {
    expect(rowHeightAfterDrag(30, 25.4, 20)).toBe(55)
  })

  it('stops where the row content would not fit anymore', () => {
    expect(rowHeightAfterDrag(80, -100, 32)).toBe(32)
  })
})

describe('savedHeightAfterDrag', () => {
  it('goes back to an automatic height when dragged down to the content', () => {
    expect(savedHeightAfterDrag(32, 32)).toBeNull()
    expect(savedHeightAfterDrag(33, 32)).toBeNull()
  })

  it('keeps a height that is taller than the content', () => {
    expect(savedHeightAfterDrag(60, 32)).toBe(60)
  })
})

describe('scaleColumnWidths', () => {
  it('keeps the proportions of the columns', () => {
    expect(scaleColumnWidths([100, 200, 100], 200, 40)).toEqual([150, 300, 150])
  })

  it('never goes below the minimum column width', () => {
    expect(scaleColumnWidths([100, 300], -1000, 40)).toEqual([40, 60])
  })

  it('stops at the editor width', () => {
    expect(scaleColumnWidths([100, 200], 300, 40, 450)).toEqual([150, 300])
  })

  it('makes the columns add up to exactly the new width, so nothing is lost to rounding', () => {
    const widths = scaleColumnWidths([351, 350, 351], 101, 40)

    expect(widths.reduce((total, width) => total + width, 0)).toBe(1153)
  })
})

describe('growRowHeights', () => {
  it('spreads the change evenly over the rows', () => {
    expect(growRowHeights([30, 40], 20, [20, 20])).toEqual([40, 50])
  })

  it('never goes below what each row needs for its content', () => {
    expect(growRowHeights([30, 60], -100, [30, 45])).toEqual([30, 45])
  })
})

describe('isPastWidthLimit', () => {
  it('is false until the table would be wider than the limit', () => {
    expect(isPastWidthLimit([300, 300], 380, 1000)).toBe(false)
    expect(isPastWidthLimit([300, 300], 400, 1000)).toBe(false)
  })

  it('is true once the mouse asks for more than the limit', () => {
    expect(isPastWidthLimit([300, 300], 402, 1000)).toBe(true)
  })

  it('is true for any growth when the table is already wider than the limit', () => {
    expect(isPastWidthLimit([700, 700], 5, 1000)).toBe(true)
  })

  it('is never true while the table gets narrower', () => {
    expect(isPastWidthLimit([700, 700], -50, 1000)).toBe(false)
  })
})

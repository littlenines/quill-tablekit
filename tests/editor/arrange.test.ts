import { describe, expect, it } from 'vitest'
import { cellIndex, cellLines, cellTexts, fillCells, setupWithTable } from '../helpers'

const menuItem = (host: HTMLElement, label: string) =>
  [...host.querySelectorAll<HTMLButtonElement>('.qlt-menu-item')].find((menuButton) => menuButton.textContent === label)

const openBarMenu = (host: HTMLElement, label: string) =>
  host.querySelector<HTMLButtonElement>(`.qlt-action-bar [aria-label="${label}"]`)?.click()

describe('moving rows and columns', () => {
  it('moves the row down and keeps the cursor in the same cell', () => {
    const { quill, tableKit } = setupWithTable(3, 2)

    fillCells(quill, ['a1', 'b1', 'a2', 'b2', 'a3', 'b3'])
    quill.setSelection(cellIndex(quill, 1) + 1, 0)
    tableKit.moveRowDown()

    expect(cellTexts(quill)).toEqual(['a2', 'b2', 'a1', 'b1', 'a3', 'b3'])
    expect(quill.getSelection()?.index).toBe(cellIndex(quill, 3) + 1)
  })

  it('moves the column right', () => {
    const { quill, tableKit } = setupWithTable(2, 3)

    fillCells(quill, ['a1', 'b1', 'c1', 'a2', 'b2', 'c2'])
    quill.setSelection(cellIndex(quill, 0), 0)
    tableKit.moveColumnRight()

    expect(cellTexts(quill)).toEqual(['b1', 'a1', 'c1', 'b2', 'a2', 'c2'])
  })

  it('undoes a move in one step', () => {
    const { quill, tableKit } = setupWithTable(2, 1)

    fillCells(quill, ['top', 'bottom'])
    quill.setSelection(cellIndex(quill, 1), 0)
    tableKit.moveRowUp()
    quill.history.undo()

    expect(cellTexts(quill)).toEqual(['top', 'bottom'])
  })

  it('disables the moves that are not possible from the current cell', () => {
    const { quill, host } = setupWithTable(2, 2)

    quill.setSelection(0, 0)
    openBarMenu(host, 'Rows')

    expect(menuItem(host, 'Move row up')?.disabled).toBe(true)
    expect(menuItem(host, 'Move row down')?.disabled).toBe(false)

    openBarMenu(host, 'Rows')
    openBarMenu(host, 'Columns')

    expect(menuItem(host, 'Move column left')?.disabled).toBe(true)
    expect(menuItem(host, 'Move column right')?.disabled).toBe(false)
  })
})

describe('duplicating', () => {
  it('duplicates the row below the current one', () => {
    const { quill, tableKit } = setupWithTable(2, 2)

    fillCells(quill, ['a1', 'b1', 'a2', 'b2'])
    quill.setSelection(cellIndex(quill, 0), 0)
    tableKit.duplicateRow()

    expect(cellTexts(quill)).toEqual(['a1', 'b1', 'a1', 'b1', 'a2', 'b2'])
    expect(new Set(cellLines(quill).map((cellValue) => cellValue.cell)).size).toBe(6)
  })

  it('duplicates the column to the right of the current one', () => {
    const { quill, tableKit } = setupWithTable(1, 2)

    fillCells(quill, ['a1', 'b1'])
    quill.setSelection(cellIndex(quill, 1), 0)
    tableKit.duplicateColumn()

    expect(cellTexts(quill)).toEqual(['a1', 'b1', 'b1'])
  })
})

describe('column widths', () => {
  it('makes the columns equal and keeps the table width', () => {
    const { quill, tableKit } = setupWithTable(1, 3)

    tableKit.setColumnWidths(quill.root.querySelector('table') as HTMLTableElement, [100, 300, 200])
    quill.setSelection(0, 0)
    tableKit.equalizeColumnWidths()

    expect(cellLines(quill)[0].widths).toEqual([200, 200, 200])
  })

  it('fits a px table to the width of the editor', () => {
    const { quill, tableKit } = setupWithTable(1, 2, { responsiveWidths: false })

    Object.defineProperty(quill.root, 'clientWidth', { value: 602 })
    tableKit.setColumnWidths(quill.root.querySelector('table') as HTMLTableElement, [100, 300])
    quill.setSelection(0, 0)
    tableKit.fitTableToWidth()

    expect(cellLines(quill)[0].widths).toEqual([150, 450])
  })

  it('only offers Equal column widths and Fit table to width when they would change something', () => {
    const { quill, host, tableKit } = setupWithTable(1, 2)

    quill.setSelection(0, 0)
    openBarMenu(host, 'Columns')

    expect(menuItem(host, 'Equal column widths')?.disabled).toBe(true)

    openBarMenu(host, 'Columns')
    openBarMenu(host, 'More')

    expect(menuItem(host, 'Fit table to width')?.disabled).toBe(true)

    openBarMenu(host, 'More')
    tableKit.setColumnWidths(quill.root.querySelector('table') as HTMLTableElement, [100, 300])
    quill.setSelection(0, 0)
    openBarMenu(host, 'Columns')

    expect(menuItem(host, 'Equal column widths')?.disabled).toBe(false)
  })
})

describe('fitting', () => {
  it('fits the columns to their content and keeps the table inside the editor', () => {
    const { quill, tableKit } = setupWithTable(1, 3, { responsiveWidths: false })

    Object.defineProperty(quill.root, 'clientWidth', { value: 252 })
    quill.setSelection(0, 0)
    tableKit.fitColumnsToContent()

    const widths = cellLines(quill)[0].widths ?? []

    expect(widths).toHaveLength(3)
    expect(widths.reduce((total, width) => total + width, 0)).toBe(250)
    expect(quill.root.parentElement?.querySelector('.qlt-measuring')).toBeNull()
  })

  it('makes every row the same height', () => {
    const { quill, tableKit } = setupWithTable(3, 1)

    quill.setSelection(0, 0)
    tableKit.equalizeRowHeights()

    const heights = [...new Set(cellLines(quill).map((cellValue) => cellValue.rowHeight))]

    expect(heights).toHaveLength(1)
    expect(heights[0]).toBeGreaterThan(0)
  })

  it('only offers Equal row heights with more than one row', () => {
    const { quill, host } = setupWithTable(1, 1)

    quill.setSelection(0, 0)
    openBarMenu(host, 'Rows')

    expect(menuItem(host, 'Equal row heights')?.disabled).toBe(true)
  })
})

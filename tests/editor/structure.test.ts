import { describe, expect, it } from 'vitest'
import { cellIndex, cellLines, cells, setupWithTable, shape, tables } from '../helpers'

describe('merging and splitting', () => {
  it('merges the selected cells and keeps their text', () => {
    const { quill, tableKit } = setupWithTable(2, 2)

    quill.insertText(cellIndex(quill, 1), 'right', 'user')
    quill.insertText(0, 'left', 'user')

    quill.setSelection(0, cellIndex(quill, 1) + 2)
    expect(tableKit.canMergeCells()).toBe(true)
    tableKit.mergeCells()

    expect(shape(quill)).toEqual([[21], [11, 11]])
    expect([...cells(quill)[0].querySelectorAll('p')].map((paragraph) => paragraph.textContent)).toEqual([
      'left',
      'right',
    ])
  })

  it('merges vertically with rowspan and splits back', () => {
    const { quill, tableKit } = setupWithTable(2, 2)

    quill.setSelection(0, cellIndex(quill, 2))
    tableKit.mergeCells()
    expect(shape(quill)).toEqual([[12, 11], [11]])

    quill.setSelection(0, 0)
    expect(tableKit.canSplitCell()).toBe(true)
    tableKit.splitCell()
    expect(shape(quill)).toEqual([
      [11, 11],
      [11, 11],
    ])
  })

  it('merges empty cells when the selection ends at the start of the last one, like a shift-click does', () => {
    const { quill, tableKit } = setupWithTable(2, 2)
    const topRight = cellIndex(quill, 1)
    const bottomRight = cellIndex(quill, 3)

    quill.setSelection(topRight, bottomRight - topRight)

    expect(tableKit.canMergeCells()).toBe(true)
    tableKit.mergeCells()
    expect(shape(quill)).toEqual([[11, 12], [11]])
  })

  it('undoes a merge in one step', () => {
    const { quill, tableKit } = setupWithTable(2, 2)
    const before = quill.getContents()

    quill.history.cutoff()

    quill.setSelection(0, cellIndex(quill, 3) + 1)
    tableKit.mergeCells()
    expect(cells(quill)).toHaveLength(1)

    quill.history.undo()
    expect(quill.getContents()).toEqual(before)
    expect(cells(quill)).toHaveLength(4)
  })
})

describe('rows and columns', () => {
  it('inserts and deletes rows and columns around the cursor', () => {
    const { quill, tableKit } = setupWithTable(2, 2)

    quill.setSelection(0, 0)

    tableKit.insertRowAbove()
    tableKit.insertColumnRight()
    expect(tables(quill)[0].rows).toHaveLength(3)
    expect(tables(quill)[0].rows[0].cells).toHaveLength(3)

    tableKit.deleteRow()
    tableKit.deleteColumn()
    expect(shape(quill)).toEqual([
      [11, 11],
      [11, 11],
    ])
  })

  it('keeps the caret position in the cell after a structural edit', () => {
    const { quill, tableKit } = setupWithTable(2, 2)

    quill.insertText(cellIndex(quill, 3), 'text', 'user')
    quill.setSelection(cellIndex(quill, 3) + 2, 0)

    tableKit.insertRowAbove()

    expect(quill.getSelection()?.index).toBe(cellIndex(quill, 5) + 2)
  })

  it('deletes the table when its last row is deleted', () => {
    const { quill, tableKit } = setupWithTable(1, 2)

    quill.setSelection(0, 0)

    tableKit.deleteRow()

    expect(tables(quill)).toHaveLength(0)
  })

  it('deletes the table', () => {
    const { quill, tableKit } = setupWithTable(2, 2)

    quill.setSelection(0, 0)

    tableKit.deleteTable()

    expect(tables(quill)).toHaveLength(0)
    expect(cellLines(quill)).toHaveLength(0)
  })
})

describe('column widths', () => {
  it('stores widths in the Delta and renders them as a colgroup', () => {
    const { quill, tableKit } = setupWithTable(2, 2)

    quill.history.cutoff()

    tableKit.setColumnWidths(tables(quill)[0], [120, 240])

    expect(cellLines(quill).every((cellValue) => cellValue.widths?.join() === '120,240')).toBe(true)

    const columnElements = [...tables(quill)[0].querySelectorAll<HTMLElement>('colgroup col')]

    expect(columnElements.map((columnElement) => columnElement.style.width)).toEqual(['120px', '240px'])
    expect(tables(quill)[0].style.width).toBe('360px')
  })

  it('undoes a width change', () => {
    const { quill, tableKit } = setupWithTable(2, 2)

    quill.history.cutoff()
    tableKit.setColumnWidths(tables(quill)[0], [120, 240])

    quill.history.undo()

    expect(tables(quill)[0].querySelector('colgroup')).toBeNull()
  })

  it('goes back to automatic widths with null', () => {
    const { quill, tableKit } = setupWithTable(1, 2)

    tableKit.setColumnWidths(tables(quill)[0], [120, 240])

    tableKit.setColumnWidths(tables(quill)[0], null)

    expect(cellLines(quill).some((cellValue) => cellValue.widths)).toBe(false)
    expect(tables(quill)[0].style.width).toBe('')
  })
})

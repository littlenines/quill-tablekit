import { describe, expect, it } from 'vitest'
import { cellIndex, cellLines, cellTexts, copyOrCut, fillCells, paste, setup, setupWithTable, tables } from '../helpers'

const selectCells = (quill: Parameters<typeof cellIndex>[0], firstCell: number, lastCell: number) => {
  const selectionStart = cellIndex(quill, firstCell)

  quill.setSelection(selectionStart, cellIndex(quill, lastCell) + 1 - selectionStart)
}

describe('pasting a table into cells', () => {
  it('pastes copied cells over the cells at the cursor', () => {
    const { quill } = setupWithTable(3, 3)

    fillCells(quill, ['a1', 'b1', 'c1', 'a2', 'b2', 'c2'])
    selectCells(quill, 0, 4)

    const { clipboardContent } = copyOrCut(quill, 'copy')

    quill.setSelection(cellIndex(quill, 4), 0)
    paste(quill, clipboardContent)

    expect(cellTexts(quill)).toEqual(['a1', 'b1', 'c1', 'a2', 'a1', 'b1', '', 'a2', 'b2'])
    expect(quill.getSelection()?.index).toBe(cellIndex(quill, 4))
  })

  it('adds rows and columns when the pasted table is bigger, up to maxRows and maxColumns', () => {
    const { quill } = setupWithTable(1, 1, { maxRows: 2, maxColumns: 5 })

    quill.setSelection(0, 0)
    paste(quill, {
      'text/html':
        '<table><tr><td>1</td><td>2</td></tr><tr><td>3</td><td>4</td></tr><tr><td>5</td><td>6</td></tr></table>',
    })

    expect(cellTexts(quill)).toEqual(['1', '2', '3', '4'])
  })

  it('is one undo step', () => {
    const { quill } = setupWithTable(1, 1)
    const before = quill.getContents()

    quill.history.cutoff()
    quill.setSelection(0, 0)
    paste(quill, { 'text/html': '<table><tr><td>1</td><td>2</td></tr></table>' })
    quill.history.undo()

    expect(quill.getContents()).toEqual(before)
  })

  it('pastes copied cells into another editor', () => {
    const source = setupWithTable(2, 2)

    fillCells(source.quill, ['a1', 'b1', 'a2', 'b2'])
    selectCells(source.quill, 1, 3)

    const { clipboardContent } = copyOrCut(source.quill, 'copy')
    const target = setupWithTable(2, 2)

    target.quill.setSelection(0, 0)
    paste(target.quill, clipboardContent)

    expect(cellTexts(target.quill)).toEqual(['b1', '', 'b2', ''])
  })
})

describe('copying what the table looks like', () => {
  const styledTable = () => {
    const editor = setupWithTable(2, 2)
    const { quill, tableKit } = editor

    fillCells(quill, ['Name', 'Amount', 'Ana', '10'])
    quill.setSelection(0, 0)
    tableKit.setColumnWidths(tables(quill)[0], [120, 80])
    tableKit.setTableProperties({ header: true, align: 'center', borderColor: '#e06666' })
    quill.setSelection(cellIndex(quill, 2), 0)
    tableKit.setCellProperties({ background: '#fff2cc', verticalAlign: 'middle', textAlign: 'center' })

    return editor
  }

  it('keeps every property when the copied table is pasted as a new table', () => {
    const { quill } = styledTable()

    quill.setSelection(0, quill.getLength())

    const { clipboardContent } = copyOrCut(quill, 'copy')
    const target = setup()

    paste(target.quill, clipboardContent)

    const pastedLines = cellLines(target.quill)

    expect(pastedLines.every((cellValue) => cellValue.header && cellValue.tableAlign === 'center')).toBe(true)
    expect(pastedLines.every((cellValue) => cellValue.borderColor === '#e06666')).toBe(true)
    expect(pastedLines.map((cellValue) => cellValue.background)).toEqual([undefined, undefined, '#fff2cc', undefined])
    expect(pastedLines[2]).toMatchObject({ verticalAlign: 'middle', widths: [120, 80] })
    expect(target.quill.getContents().ops.some(({ attributes }) => attributes?.bold || attributes?.background)).toBe(
      false,
    )

    const withoutIds = (lines: ReturnType<typeof cellLines>) =>
      lines.map(({ table: _table, row: _row, cell: _cell, ...properties }) => properties)

    expect(withoutIds(pastedLines)).toEqual(withoutIds(cellLines(quill)))
  })

  it('pastes cell colors and alignment into an existing table, and keeps that table’s own settings', () => {
    const { quill } = styledTable()

    selectCells(quill, 2, 3)

    const { clipboardContent } = copyOrCut(quill, 'copy')
    const target = setupWithTable(1, 2)

    target.quill.setSelection(0, 0)
    paste(target.quill, clipboardContent)

    const [pastedCell, otherCell] = cellLines(target.quill)

    expect(pastedCell).toMatchObject({ background: '#fff2cc', verticalAlign: 'middle' })
    expect(otherCell.background).toBeUndefined()
    expect(pastedCell.header).toBeUndefined()
    expect(target.quill.getContents().ops[1].attributes?.align).toBe('center')
  })
})

import { describe, expect, it } from 'vitest'
import { Delta } from 'quill'
import { cellAttributes, cellIndex, setup, setupWithTable, tables } from '../helpers'

describe('select row and column', () => {
  it('selects every cell in the row', () => {
    const { quill, tableKit } = setupWithTable(3, 3)

    quill.setSelection(cellIndex(quill, 4), 0)
    tableKit.selectRow()

    expect(quill.getSelection()).toEqual({
      index: cellIndex(quill, 3),
      length: cellIndex(quill, 5) - cellIndex(quill, 3),
    })
    expect(tableKit.getContext()?.selectedArea).toEqual({ top: 1, left: 0, bottom: 2, right: 3 })
  })

  it('selects every cell in the column', () => {
    const { quill, tableKit } = setupWithTable(3, 3)

    quill.setSelection(cellIndex(quill, 4), 0)
    tableKit.selectColumn()

    expect(tableKit.getContext()?.selectedArea).toEqual({ top: 0, left: 1, bottom: 3, right: 2 })
    expect(tableKit.canMergeCells()).toBe(true)
  })

  it('ends the selection after the text of the last cell', () => {
    const { quill, tableKit } = setupWithTable(1, 2)

    quill.insertText(cellIndex(quill, 1), 'end', 'user')
    quill.setSelection(0, 0)
    tableKit.selectRow()

    expect(quill.getText(quill.getSelection()?.index, quill.getSelection()?.length)).toBe('\nend')
  })
})

describe('paragraph outside the table', () => {
  it('adds an empty line above a table at the start of the document', () => {
    const { quill, tableKit } = setupWithTable(1, 2)

    quill.setSelection(cellIndex(quill, 1), 0)
    tableKit.insertParagraphAbove()

    expect(quill.root.firstElementChild?.tagName).toBe('P')
    expect(quill.getContents().ops[0]).toEqual({ insert: '\n' })
    expect(quill.getSelection()).toEqual({ index: 0, length: 0 })
    expect(tableKit.isInTable()).toBe(false)
  })

  it('adds a plain empty line right after the table, even before a heading', () => {
    const { quill, tableKit } = setup()

    quill.setContents(
      new Delta()
        .insert('A')
        .insert('\n', cellAttributes({ row: 'r1', cell: 'c1' }))
        .insert('After')
        .insert('\n', { header: 1 }),
    )
    quill.setSelection(0, 0)
    tableKit.insertParagraphBelow()

    expect(quill.getContents().ops.slice(2)).toEqual([
      { insert: '\nAfter' },
      { insert: '\n', attributes: { header: 1 } },
    ])
    expect(quill.getSelection()).toEqual({ index: 2, length: 0 })
    expect(tables(quill)).toHaveLength(1)
  })

  it('is one undo step', () => {
    const { quill, tableKit } = setupWithTable(1, 1)
    const before = quill.getContents()

    quill.history.cutoff()
    quill.setSelection(0, 0)
    tableKit.insertParagraphAbove()
    quill.history.undo()

    expect(quill.getContents()).toEqual(before)
  })
})

import { describe, expect, it } from 'vitest'
import { cellIndex, press, setup, setupWithTable, tables } from '../helpers'

describe('moving between cells', () => {
  it('moves between cells with Tab and Shift+Tab', () => {
    const { quill } = setupWithTable(1, 2)

    press(quill, 'Tab')
    expect(quill.getSelection()?.index).toBe(cellIndex(quill, 1))

    press(quill, 'Tab', { shiftKey: true })
    expect(quill.getSelection()?.index).toBe(0)
  })

  it('tabs through merged cells row by row, where each cell starts', () => {
    const { quill, tableKit } = setupWithTable(2, 3)

    for (const [cellNumber, text] of [...['a', 'b', 'c', 'd', 'e', 'f'].entries()].reverse()) {
      quill.insertText(cellIndex(quill, cellNumber), text, 'user')
    }

    quill.setSelection(cellIndex(quill, 1), cellIndex(quill, 4) - cellIndex(quill, 1) + 1)
    tableKit.mergeCells()

    const textAtCursor = () => {
      const selection = quill.getSelection()

      return quill.getText(selection?.index, selection?.length).replaceAll('\n', '/')
    }

    quill.setSelection(cellIndex(quill, 2), 0)
    press(quill, 'Tab')
    expect(textAtCursor()).toBe('d')

    press(quill, 'Tab')
    expect(textAtCursor()).toBe('f')

    press(quill, 'Tab', { shiftKey: true })
    press(quill, 'Tab', { shiftKey: true })
    expect(textAtCursor()).toBe('c')

    press(quill, 'Tab', { shiftKey: true })
    expect(textAtCursor()).toBe('b/e')
  })

  it('adds a row when tabbing out of the last cell', () => {
    const { quill } = setupWithTable(1, 2)

    quill.setSelection(cellIndex(quill, 1), 0)

    press(quill, 'Tab')

    expect(tables(quill)[0].rows).toHaveLength(2)
    expect(quill.getSelection()?.index).toBe(cellIndex(quill, 2))
  })

  it('moves to the cell below and above with the arrow keys', () => {
    const { quill } = setupWithTable(2, 2)

    quill.insertText(0, 'top', 'user')
    quill.setSelection(1, 0)
    press(quill, 'ArrowDown')

    expect(quill.getSelection()?.index).toBe(cellIndex(quill, 2))

    press(quill, 'ArrowUp')

    expect(quill.getSelection()?.index).toBe(3)
  })

  it('goes from a merged cell to the row under all of it', () => {
    const { quill, tableKit } = setupWithTable(3, 2)

    quill.setSelection(0, cellIndex(quill, 2))
    tableKit.mergeCells()
    quill.setSelection(0, 0)
    press(quill, 'ArrowDown')

    expect(quill.getSelection()?.index).toBe(cellIndex(quill, 3))
  })

  it('leaves the table from the first and the last row', () => {
    const { quill, tableKit } = setup()

    quill.setText('before\n\n')
    quill.setSelection(7, 0)
    tableKit.insertTable(1, 2)
    quill.setSelection(cellIndex(quill, 1), 0)
    press(quill, 'ArrowUp')

    expect(quill.getSelection()?.index).toBe(6)

    quill.setSelection(cellIndex(quill, 1), 0)
    press(quill, 'ArrowDown')

    expect(quill.getSelection()?.index).toBe(quill.getLength() - 1)
  })

  it('goes to the start of the line when nothing is above the table', () => {
    const { quill } = setupWithTable(1, 1)

    quill.insertText(0, 'text', 'user')
    quill.setSelection(2, 0)
    press(quill, 'ArrowUp')

    expect(quill.getSelection()?.index).toBe(0)
  })

  it('leaves Shift with the arrow keys to the browser', () => {
    const { quill } = setupWithTable(2, 1)

    quill.setSelection(0, 0)
    press(quill, 'ArrowDown', { shiftKey: true })

    expect(quill.getSelection()).toEqual({ index: 0, length: 0 })
  })
})

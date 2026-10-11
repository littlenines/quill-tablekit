import { describe, expect, it } from 'vitest'
import { cellIndex, cells, press, setup, setupWithTable, shape, tables } from '../helpers'

describe('keyboard in a table', () => {
  it('keeps Enter inside the cell as a new line', () => {
    const { quill } = setupWithTable(1, 2)

    quill.insertText(0, 'first', 'user')
    quill.setSelection(5, 0)

    press(quill, 'Enter')
    quill.insertText(6, 'second', 'user')

    const [first] = cells(quill)

    expect([...first.querySelectorAll('p')].map((paragraph) => paragraph.textContent)).toEqual(['first', 'second'])
    expect(cells(quill)).toHaveLength(2)
  })

  it('ignores Backspace at the start of a cell and Delete at its end', () => {
    const { quill } = setupWithTable(1, 2)

    quill.insertText(0, 'A', 'user')

    const before = quill.getContents()

    quill.setSelection(cellIndex(quill, 1), 0)
    press(quill, 'Backspace')
    quill.setSelection(1, 0)
    press(quill, 'Delete')

    expect(quill.getContents()).toEqual(before)
  })

  it('does not pull the paragraph after a table into the last cell on Backspace', () => {
    const { quill } = setupWithTable(1, 1)

    quill.insertText(quill.getLength() - 1, 'after', 'user')

    const afterIndex = quill.getLength() - 6

    quill.setSelection(afterIndex, 0)
    press(quill, 'Backspace')

    expect(quill.root.lastElementChild?.textContent).toBe('after')
    expect(cells(quill)[0].textContent).toBe('')
    expect(quill.getSelection()?.index).toBe(afterIndex - 1)
  })

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

  it('does not turn "1. " into a list inside a cell', () => {
    const { quill } = setupWithTable(1, 1)

    quill.insertText(0, '1.', 'user')
    quill.setSelection(2, 0)

    press(quill, ' ')

    expect(cells(quill)[0].textContent).toBe('1. ')
    expect(quill.root.querySelector('td ol')).toBeNull()
  })
})

describe('deleting a selection', () => {
  it('clears the highlighted cells without destroying the table', () => {
    const { quill } = setupWithTable(2, 2)

    for (const [cellNumber, text] of [
      [3, 'b2'],
      [2, 'a2'],
      [1, 'b1'],
      [0, 'a1'],
    ] as const) {
      quill.insertText(cellIndex(quill, cellNumber), text, 'user')
    }

    quill.setSelection(1, cellIndex(quill, 2))
    press(quill, 'Backspace')

    expect(shape(quill)).toEqual([
      [11, 11],
      [11, 11],
    ])
    expect(cells(quill).map((cellElement) => cellElement.textContent)).toEqual(['', 'b1', '', 'b2'])
    expect(quill.getSelection()).toEqual({ index: 0, length: 0 })
  })

  it('deletes a whole table when the selection covers all of it', () => {
    const { quill, tableKit } = setup()

    quill.setText('before\n')
    quill.setSelection(0, 0)
    tableKit.insertTable(2, 2)
    quill.insertText(quill.getLength() - 1, 'after', 'user')

    quill.setSelection(3, quill.getLength() - 7)
    press(quill, 'Backspace')

    expect(tables(quill)).toHaveLength(0)
    expect(quill.getText()).toBe('befter\n')
  })
})

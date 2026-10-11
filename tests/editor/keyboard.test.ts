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

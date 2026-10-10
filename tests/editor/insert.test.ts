import { describe, expect, it } from 'vitest'
import { setup, setupWithTable, shape, tables } from '../helpers'

describe('inserting a table', () => {
  it('inserts a rows × columnElements table at an empty line and puts the cursor in the first cell', () => {
    const { quill } = setupWithTable(3, 4)

    expect(tables(quill)).toHaveLength(1)
    expect(shape(quill)).toEqual([
      [11, 11, 11, 11],
      [11, 11, 11, 11],
      [11, 11, 11, 11],
    ])
    expect(quill.getSelection()?.index).toBe(0)
  })

  it('leaves a paragraph after the table to type in', () => {
    const { quill } = setupWithTable(1, 1)

    expect(quill.root.lastElementChild?.tagName).toBe('P')
  })

  it('inserts below a line with text instead of splitting it', () => {
    const { quill, tableKit } = setup()

    quill.setText('Hello world\n')
    quill.setSelection(5, 0)

    tableKit.insertTable(1, 2)

    expect(quill.root.firstElementChild?.textContent).toBe('Hello world')
    expect(quill.root.children[1].tagName).toBe('TABLE')
    expect(quill.root.lastElementChild?.tagName).toBe('P')
  })

  it('does not nest a table inside a cell', () => {
    const { quill, tableKit } = setupWithTable(2, 2)

    tableKit.insertTable(2, 2)

    expect(tables(quill)).toHaveLength(1)
  })

  it('clamps sizes to the configured limits', () => {
    const { quill } = setupWithTable(50, 50, { maxRows: 2, maxColumns: 3 })

    expect(shape(quill)).toEqual([
      [11, 11, 11],
      [11, 11, 11],
    ])
  })
})

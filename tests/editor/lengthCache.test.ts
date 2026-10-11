import { describe, expect, it } from 'vitest'
import { cellIndex, cellTexts, fillCells, setupWithTable, tables } from '../helpers'

describe('changing table settings', () => {
  it('keeps the document in step when a text-change listener types into the table', () => {
    const { quill, tableKit } = setupWithTable(2, 2)
    let hasTyped = false

    fillCells(quill, ['a', 'b', 'c', 'last'])
    quill.on('text-change', () => {
      if (hasTyped) return

      hasTyped = true
      quill.insertText(cellIndex(quill, 1), 'typed ', 'user')
      quill.insertText(quill.getText().indexOf('last'), 'then ', 'user')
    })
    quill.setSelection(0, 0)
    tableKit.setTableProperties({ header: true, striped: true })

    const editor = (quill as unknown as { editor: { getDelta: () => unknown } }).editor

    expect(cellTexts(quill)).toEqual(['a', 'typed b', 'c', 'then last'])
    expect(quill.getContents()).toEqual(editor.getDelta())
    expect(quill.scroll.length()).toBe(quill.getLength())
    expect(tables(quill)[0].dataset.header).toBe('true')
  })

  it('still finds every cell after a settings change and an edit', () => {
    const { quill, tableKit } = setupWithTable(3, 3)

    fillCells(quill, ['1', '2', '3', '4', '5', '6', '7', '8', '9'])
    quill.setSelection(0, 0)
    tableKit.setTableProperties({ borderStyle: 'dashed' })
    quill.insertText(cellIndex(quill, 4), 'x', 'user')
    tableKit.setColumnWidths(tables(quill)[0], [100, 120, 140])

    expect(cellTexts(quill)).toEqual(['1', '2', '3', '4', 'x5', '6', '7', '8', '9'])
    expect(quill.scroll.length()).toBe(quill.getLength())
  })
})

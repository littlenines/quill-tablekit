import { describe, expect, it, vi } from 'vitest'
import Quill, { Delta } from 'quill'
import {
  cellAttributes,
  cellIndex,
  cellTexts,
  fillCells,
  paste,
  press,
  setup,
  setupWithTable,
  tables,
} from '../helpers'

describe('things that broke in other table modules', () => {
  it('joins two lines of a merged cell with Backspace and keeps both texts', () => {
    const { quill, tableKit } = setupWithTable(1, 2)

    fillCells(quill, ['left', 'right'])
    quill.setSelection(0, cellIndex(quill, 1) + 1)
    tableKit.mergeCells()
    quill.setSelection(quill.getText().indexOf('right'), 0)
    press(quill, 'Backspace')

    expect(cellTexts(quill)).toEqual(['leftright'])
  })

  it('makes a new line when Enter is pressed in an empty cell', () => {
    const { quill } = setupWithTable(1, 2)

    quill.setSelection(0, 0)
    press(quill, 'Enter')

    expect(tables(quill)[0].querySelectorAll('td')[0].querySelectorAll('p')).toHaveLength(2)
  })

  it('keeps two tables apart when the line between them is deleted', () => {
    const { quill } = setup()

    quill.setContents(
      new Delta()
        .insert('\n', cellAttributes({ table: 'first', row: 'r1', cell: 'c1' }))
        .insert('\n')
        .insert('\n', cellAttributes({ table: 'second', row: 'r2', cell: 'c2' }))
        .insert('\n', cellAttributes({ table: 'second', row: 'r2', cell: 'c3' })),
    )
    quill.setSelection(1, 0)
    press(quill, 'Backspace')

    expect(tables(quill)).toHaveLength(2)
    expect(tables(quill).map((tableElement) => tableElement.querySelectorAll('td').length)).toEqual([1, 2])
  })

  it('inserts tables with different column counts one after the other', () => {
    const { quill, tableKit } = setup()

    quill.setSelection(0, 0)
    tableKit.insertTable(2, 2)
    quill.setSelection(quill.getLength() - 1, 0)
    tableKit.insertTable(1, 4)

    expect(tables(quill).map((tableElement) => tableElement.rows[0].cells.length)).toEqual([2, 4])
  })

  it('pastes a table where one was just deleted', () => {
    const { quill, tableKit } = setupWithTable(2, 2)

    quill.setSelection(0, 0)
    tableKit.deleteTable()
    paste(quill, { 'text/html': '<table><tr><td>new</td><td></td></tr></table>' })

    expect(cellTexts(quill)).toEqual(['new', ''])
  })

  it('pastes a table from Excel with empty cells', () => {
    const { quill } = setup()

    paste(quill, {
      'text/html':
        '<table><tr><td>A</td><td></td><td>C</td></tr><tr><td></td><td>E</td><td style="mso-ignore:padding"></td></tr></table>',
    })

    expect(cellTexts(quill)).toEqual(['A', '', 'C', '', 'E', ''])
  })

  it('hides the action bar when the table is deleted with the keyboard', () => {
    const { quill, host } = setup()

    quill.setText('before\n')
    quill.setSelection(7, 0)
    ;(quill.getModule('tableKit') as { insertTable: (rows: number, columns: number) => void }).insertTable(1, 1)
    quill.setSelection(0, quill.getLength())
    press(quill, 'Backspace')

    expect(tables(quill)).toHaveLength(0)
    expect(host.querySelector<HTMLElement>('.qlt-action-bar')?.style.display).toBe('none')
  })

  it('fires text-change when a column is resized', () => {
    const { quill, tableKit } = setupWithTable(1, 2)
    const onTextChange = vi.fn()

    quill.on('text-change', onTextChange)
    tableKit.setColumnWidths(tables(quill)[0], [100, 200])

    expect(onTextChange).toHaveBeenCalledOnce()
  })

  it('shows saved tables when the module is registered but not turned on', () => {
    const host = document.createElement('div')

    document.body.append(host)

    const quill = new Quill(host, { modules: { toolbar: false } })

    quill.setContents(new Delta().insert('x').insert('\n', cellAttributes({ row: 'r1', cell: 'c1' })))

    expect(tables(quill)).toHaveLength(1)
  })

  it('does not warn about the table toolbar button', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    setup()

    expect([...warn.mock.calls, ...error.mock.calls].flat().join(' ')).not.toMatch(/table/i)

    warn.mockRestore()
    error.mockRestore()
  })
})

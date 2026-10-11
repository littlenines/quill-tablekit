import { describe, expect, it } from 'vitest'
import { Delta } from 'quill'
import { cellAttributes, cellLines, paste, setup, setupWithTable, tables } from '../helpers'

const EDITOR_WIDTH = 800

const withEditorWidth = <Editor extends ReturnType<typeof setup>>(editor: Editor): Editor => {
  Object.defineProperty(editor.quill.root, 'clientWidth', { value: EDITOR_WIDTH })

  return editor
}

const percentTable = (widths: number[]) =>
  new Delta()
    .insert('a')
    .insert('\n', cellAttributes({ row: 'r1', cell: 'a', widths, widthUnit: 'percent' }))
    .insert('b')
    .insert('\n', cellAttributes({ row: 'r1', cell: 'b', widths, widthUnit: 'percent' }))

describe('responsive widths', () => {
  it('saves resized columns as shares of the editor by default', () => {
    const { quill, tableKit } = withEditorWidth(setupWithTable(1, 2))

    tableKit.setColumnWidths(tables(quill)[0], [200, 400])

    expect(cellLines(quill)[0]).toMatchObject({ widths: [25, 50], widthUnit: 'percent' })
  })

  it('saves px when the option is off', () => {
    const { quill, tableKit } = withEditorWidth(setupWithTable(1, 2, { responsiveWidths: false }))

    tableKit.setColumnWidths(tables(quill)[0], [200, 400])

    expect(cellLines(quill)[0].widths).toEqual([200, 400])
    expect(cellLines(quill)[0].widthUnit).toBeUndefined()
  })

  it('shows the table as a share of the editor, and each column as a share of the table', () => {
    const { quill } = setup()

    quill.setContents(percentTable([20, 60]))

    const [tableElement] = tables(quill)
    const columnWidths = [...tableElement.querySelectorAll('col')].map((column) => column.style.width)

    expect(tableElement.style.width).toBe('80%')
    expect(columnWidths).toEqual(['25%', '75%'])
  })

  it('stays in percent when the table is edited', () => {
    const { quill, tableKit } = withEditorWidth(setup())

    quill.setContents(percentTable([20, 60]))
    quill.setSelection(0, 0)
    tableKit.insertRowBelow()

    expect(cellLines(quill).every((cellValue) => cellValue.widthUnit === 'percent')).toBe(true)
    expect(cellLines(quill)[0].widths).toEqual([20, 60])
  })

  it('keeps the percent widths when the editor has no layout yet', () => {
    const { quill, tableKit } = setup()

    quill.setContents(percentTable([33.33, 66.67]))
    quill.setSelection(0, 0)
    tableKit.insertRowBelow()

    expect(cellLines(quill)[0].widths).toEqual([33.33, 66.67])
  })

  it('fits a percent table to exactly the editor width', () => {
    const { quill, tableKit } = withEditorWidth(setup())

    quill.setContents(percentTable([20, 60]))
    quill.setSelection(0, 0)
    tableKit.fitTableToWidth()

    expect(cellLines(quill)[0].widths).toEqual([25, 75])
  })

  it('writes percent widths in the saved HTML', () => {
    const { quill } = setup()

    quill.setContents(percentTable([20, 60]))

    const html = quill.getSemanticHTML()

    expect(html).toContain('<col style="width: 25%;"><col style="width: 75%;">')
    expect(html).toContain('width: 80%;')
  })

  it('reads percent columns from pasted HTML', () => {
    const { quill } = setup()

    paste(quill, {
      'text/html':
        '<table style="width: 80%"><colgroup><col style="width: 25%"><col style="width: 75%"></colgroup><tr><td>a</td><td>b</td></tr></table>',
    })

    expect(cellLines(quill)[0]).toMatchObject({ widths: [20, 60], widthUnit: 'percent' })
  })
})

import { describe, expect, it } from 'vitest'
import { cellLines, cells, paste, setup, setupWithTable, shape, tables } from '../helpers'

describe('pasting HTML tables', () => {
  it('turns them into table lines, keeping spans and multi-line cells', () => {
    const { quill } = setup()

    quill.clipboard.dangerouslyPasteHTML(
      '<table><tr><td rowspan="2">A</td><td>B</td></tr><tr><td><p>C</p><p>D</p></td></tr></table><p>after</p>',
    )

    expect(shape(quill)).toEqual([[12, 11], [11]])
    expect(new Set(cellLines(quill).map((cellValue) => cellValue.table)).size).toBe(1)
    expect(cells(quill)[2].querySelectorAll('p')).toHaveLength(2)
  })

  it("drops Quill's own table format from the pasted lines", () => {
    const { quill } = setup()

    quill.clipboard.dangerouslyPasteHTML('<table><tr><td>A</td><td>B</td></tr></table>')

    expect(quill.getContents().ops.some((operation) => operation.attributes && 'table' in operation.attributes)).toBe(
      false,
    )
  })

  it('reads column widths from a colgroup', () => {
    const { quill } = setup()

    quill.clipboard.dangerouslyPasteHTML(
      '<table><colgroup><col style="width: 80px"><col width="120"></colgroup><tr><td>a</td><td>b</td></tr></table>',
    )

    expect(cellLines(quill)[0].widths).toEqual([80, 120])
  })

  it('splits the current line instead of pulling its text into the first pasted cell', () => {
    const { quill } = setup()

    quill.setText('Hello\n')
    quill.setSelection(5, 0)

    paste(quill, { 'text/html': '<table><tr><td>A</td></tr></table>' })

    expect(quill.root.firstElementChild?.textContent).toBe('Hello')
    expect(cells(quill)[0].textContent).toBe('A')
  })
})

describe('pasting into a cell', () => {
  it('keeps multi-line text inside the cell, including Windows line endings', () => {
    const { quill } = setupWithTable(1, 2)

    quill.setSelection(0, 0)

    const pasteEvent = paste(quill, { 'text/plain': 'one\r\ntwo\r\nthree' })

    expect(pasteEvent.defaultPrevented).toBe(true)
    expect(cells(quill)).toHaveLength(2)
    expect([...cells(quill)[0].querySelectorAll('p')].map((paragraph) => paragraph.textContent)).toEqual([
      'one',
      'two',
      'three',
    ])
  })

  it('pastes a table over the cells instead of nesting it, adding a column when needed', () => {
    const { quill } = setupWithTable(1, 1)

    quill.setSelection(0, 0)

    paste(quill, { 'text/html': '<table><tr><td>x</td><td>y</td></tr></table>' })

    expect(tables(quill)).toHaveLength(1)
    expect(cells(quill).map((cellElement) => cellElement.textContent)).toEqual(['x', 'y'])
  })
})

describe('pasting table properties', () => {
  it('reads the header row, cell colors and alignment from pasted HTML', () => {
    const { quill, tableKit } = setup()

    paste(quill, {
      'text/html':
        '<table align="center"><tr><th>Name</th><th>Amount</th></tr>' +
        '<tr><td bgcolor="#fff2cc" valign="middle">North</td><td style="background-color: rgb(244, 204, 204)">10</td></tr></table>',
    })

    const [northLine, amountLine] = cellLines(quill).slice(2)

    expect(cellLines(quill).every((cellValue) => cellValue.header && cellValue.tableAlign === 'center')).toBe(true)
    expect(northLine).toMatchObject({ background: '#fff2cc', verticalAlign: 'middle' })
    expect(amountLine).toMatchObject({ background: '#f4cccc' })
    expect(quill.getContents().ops.some((operation) => operation.attributes?.background)).toBe(false)

    quill.setSelection(quill.getText().indexOf('North'), 0)
    expect(tableKit.getCellProperties()?.background).toBe('#fff2cc')
  })

  it('keeps the properties when a table is copied from the editor and pasted again', () => {
    const { quill, tableKit } = setupWithTable(2, 2)

    quill.setSelection(0, 0)
    tableKit.setTableProperties({ header: true, align: 'right' })
    tableKit.setColumnWidths(tables(quill)[0], [80, 80])
    tableKit.setCellProperties({ background: '#d9ead3', verticalAlign: 'bottom' })

    const secondEditor = setup().quill

    paste(secondEditor, { 'text/html': quill.getSemanticHTML() })

    const pastedLines = cellLines(secondEditor)

    expect(pastedLines.every((cellValue) => cellValue.header && cellValue.tableAlign === 'right')).toBe(true)
    expect(pastedLines[0]).toMatchObject({ background: '#d9ead3', verticalAlign: 'bottom', widths: [80, 80] })
  })
})

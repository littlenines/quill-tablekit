import { describe, expect, it } from 'vitest'
import { cellIndex, cellLines, cells, setup, setupWithTable, tables } from '../helpers'

describe('cell properties', () => {
  it('colors and aligns every selected cell in one undo step', () => {
    const { quill, tableKit } = setupWithTable(2, 2)
    const before = quill.getContents()

    quill.history.cutoff()
    quill.setSelection(0, cellIndex(quill, 2))
    tableKit.setCellProperties({ background: '#fff2cc', verticalAlign: 'middle' })

    const [topLeft, topRight, bottomLeft] = cells(quill)

    expect(topLeft.style.backgroundColor).toBe('rgb(255, 242, 204)')
    expect(bottomLeft.style.verticalAlign).toBe('middle')
    expect(topRight.getAttribute('style')).toBeNull()

    quill.history.undo()

    expect(quill.getContents()).toEqual(before)
    expect(topLeft.getAttribute('style')).toBeNull()
  })

  it('keeps the selection, so you can change more than one thing', () => {
    const { quill, tableKit } = setupWithTable(2, 2)

    quill.setSelection(0, cellIndex(quill, 3))
    tableKit.setCellProperties({ background: '#fff2cc' })

    expect(quill.getSelection()).toEqual({ index: 0, length: cellIndex(quill, 3) })
  })

  it('aligns the text with Quill’s own align format', () => {
    const { quill, tableKit } = setupWithTable(1, 2)

    quill.setSelection(0, 0)
    tableKit.setCellProperties({ textAlign: 'center' })

    expect(quill.getContents().ops[0].attributes?.align).toBe('center')
    expect(cells(quill)[0].querySelector('p')?.classList.contains('ql-align-center')).toBe(true)
    expect(tableKit.getCellProperties()).toEqual({ background: null, verticalAlign: 'top', textAlign: 'center' })
  })

  it('removes a color with null', () => {
    const { quill, tableKit } = setupWithTable(1, 1)

    quill.setSelection(0, 0)
    tableKit.setCellProperties({ background: '#fff2cc' })
    tableKit.setCellProperties({ background: null })

    expect(cells(quill)[0].hasAttribute('style')).toBe(false)
    expect(cellLines(quill)[0].background).toBeUndefined()
  })

  it('ignores a value that is not a color', () => {
    const { quill, tableKit } = setupWithTable(1, 1)

    quill.setSelection(0, 0)
    tableKit.setCellProperties({ background: 'red; position: fixed' })

    expect(cells(quill)[0].hasAttribute('style')).toBe(false)
  })
})

describe('table properties', () => {
  it('turns the first row into a header row', () => {
    const { quill, tableKit } = setupWithTable(2, 2)

    quill.setSelection(0, 0)
    tableKit.setTableProperties({ header: true })

    expect(tables(quill)[0].dataset.header).toBe('true')
    expect(cellLines(quill).every((cellValue) => cellValue.header)).toBe(true)
    expect(tableKit.getTableProperties()?.header).toBe(true)
  })

  it('aligns the table and colors its borders', () => {
    const { quill, tableKit } = setupWithTable(1, 2)

    quill.setSelection(0, 0)
    tableKit.setColumnWidths(tables(quill)[0], [100, 100])
    tableKit.setTableProperties({ align: 'center', borderColor: '#ff0000' })

    const tableStyle = tables(quill)[0].style

    expect([tableStyle.marginLeft, tableStyle.marginRight]).toEqual(['auto', 'auto'])
    expect(tableStyle.getPropertyValue('--qlt-border')).toBe('#ff0000')

    tableKit.setTableProperties({ align: 'right' })

    expect([tableStyle.marginLeft, tableStyle.marginRight]).toEqual(['auto', ''])
  })

  it('colors every cell and reports the color only while all cells share it', () => {
    const { quill, tableKit } = setupWithTable(2, 2)

    quill.setSelection(0, 0)
    tableKit.setTableProperties({ background: '#d9ead3' })

    expect(cells(quill).every((cellElement) => cellElement.style.backgroundColor === 'rgb(217, 234, 211)')).toBe(true)
    expect(tableKit.getTableProperties()?.background).toBe('#d9ead3')

    tableKit.setCellProperties({ background: '#f4cccc' })

    expect(tableKit.getTableProperties()?.background).toBeNull()
  })

  it('keeps the properties when a row is added', () => {
    const { quill, tableKit } = setupWithTable(1, 1)

    quill.setSelection(0, 0)
    tableKit.setTableProperties({ header: true, borderColor: '#ff0000' })
    tableKit.insertRowBelow()

    expect(cellLines(quill).every((cellValue) => cellValue.header && cellValue.borderColor === '#ff0000')).toBe(true)
  })

  it('does nothing outside a table', () => {
    const { quill, tableKit } = setup()

    quill.setText('text\n')
    quill.setSelection(0, 0)
    tableKit.setTableProperties({ header: true })

    expect(tableKit.getTableProperties()).toBeNull()
    expect(quill.getContents().ops).toEqual([{ insert: 'text\n' }])
  })
})

describe('saving', () => {
  it('loads the properties back from the Delta', () => {
    const { quill, tableKit } = setupWithTable(2, 2)

    quill.setSelection(0, 0)
    tableKit.setTableProperties({ header: true, align: 'center', borderColor: '#ff0000' })
    tableKit.setCellProperties({ background: '#fff2cc', verticalAlign: 'bottom', textAlign: 'right' })

    const secondEditor = setup().quill

    secondEditor.setContents(quill.getContents())

    expect(secondEditor.getContents()).toEqual(quill.getContents())
    expect(secondEditor.root.innerHTML).toBe(quill.root.innerHTML)
  })

  it('exports text alignment as an inline style too, so it works in emails', () => {
    const { quill, tableKit } = setupWithTable(1, 2)

    quill.insertText(0, 'centered', 'user')
    quill.setSelection(0, 0)
    tableKit.setCellProperties({ textAlign: 'center' })

    expect(quill.getSemanticHTML()).toContain('<p class="ql-align-center" style="text-align: center;">centered</p>')
  })

  it('exports a header row as th and uses the border color', () => {
    const { quill, tableKit } = setupWithTable(2, 1)

    quill.setSelection(0, 0)
    tableKit.setTableProperties({ header: true, borderColor: '#ff0000' })
    tableKit.setCellProperties({ background: '#fff2cc' })

    const html = quill.getSemanticHTML()

    expect(html).toMatch(
      /<th style="border: 1px solid #ff0000; text-align: left; [^"]*background-color: rgb\(255, 242, 204\);">/,
    )
    expect(html).toContain('<td style="border: 1px solid #ff0000;">')
    expect(html).not.toContain('--qlt-border')
    expect(html).toContain('border-color: #ff0000;')
    expect(html).not.toContain('data-')
  })
})

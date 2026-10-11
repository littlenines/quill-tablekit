import { describe, expect, it } from 'vitest'
import { cells, paste, setup, setupWithTable, tables } from '../helpers'

const styledTable = (rowCount = 3) => {
  const editor = setupWithTable(rowCount, 2)

  editor.quill.setSelection(0, 0)
  editor.tableKit.setTableProperties({ borderStyle: 'dashed', cellPadding: 'compact', striped: true, caption: 'Sales' })

  return editor
}

describe('stripe color', () => {
  it('uses the chosen color in the editor and in the saved HTML', () => {
    const { quill, tableKit } = styledTable()

    tableKit.setTableProperties({ stripeColor: '#e8f0fe' })

    expect(tables(quill)[0].style.getPropertyValue('--qlt-table-stripe')).toBe('#e8f0fe')
    expect(quill.getSemanticHTML()).toContain('background-color: #e8f0fe;')
    expect(quill.getSemanticHTML()).not.toContain('--qlt-table-stripe')
  })

  it('goes back to the default color with null', () => {
    const { quill, tableKit } = styledTable()

    tableKit.setTableProperties({ stripeColor: '#e8f0fe' })
    tableKit.setTableProperties({ stripeColor: null })

    expect(tableKit.getTableProperties()?.stripeColor).toBeNull()
    expect(quill.getSemanticHTML()).toContain('background-color: #f6f8fa;')
  })
})

describe('pasting stripes', () => {
  const stripedHTML = (color: string, rowCount: number) => {
    const rows = Array.from({ length: rowCount }, (_row, rowNumber) => {
      const style = rowNumber % 2 === 1 ? ` style="background-color: ${color}"` : ''

      return `<tr><td${style}>a${rowNumber}</td><td${style}>b${rowNumber}</td></tr>`
    })

    return `<table><tbody>${rows.join('')}</tbody></table>`
  }

  it('recognizes stripes in any color', () => {
    const { quill, tableKit } = setup()

    paste(quill, { 'text/html': stripedHTML('#e8f0fe', 4) })
    quill.setSelection(0, 0)

    expect(tableKit.getTableProperties()).toMatchObject({ striped: true, stripeColor: '#e8f0fe' })
    expect(cells(quill).every((cellElement) => !cellElement.style.backgroundColor)).toBe(true)
  })

  it('keeps a single colored row as cell colors', () => {
    const { quill, tableKit } = setup()

    paste(quill, { 'text/html': stripedHTML('#e8f0fe', 2) })
    quill.setSelection(0, 0)

    expect(tableKit.getTableProperties()?.striped).toBe(false)
    expect(cells(quill)[2].style.backgroundColor).toBe('rgb(232, 240, 254)')
  })

  it('keeps colors that are on every row', () => {
    const { quill, tableKit } = setup()

    paste(quill, {
      'text/html':
        '<table><tr><td style="background-color: #ffff00">a</td></tr><tr><td style="background-color: #ffff00">b</td></tr><tr><td style="background-color: #ffff00">c</td></tr><tr><td style="background-color: #ffff00">d</td></tr></table>',
    })
    quill.setSelection(0, 0)

    expect(tableKit.getTableProperties()).toMatchObject({ striped: false, background: '#ffff00' })
  })
})

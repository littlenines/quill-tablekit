import { describe, expect, it } from 'vitest'
import Quill from 'quill'
import TableKit from '../../src'
import { cellIndex, savedDocument, setup, setupWithTable, shape, tables } from '../helpers'

describe('Delta round trip', () => {
  it('loads back exactly what getContents returned', () => {
    const { quill, tableKit } = setupWithTable(3, 3)

    quill.setSelection(0, cellIndex(quill, 4))
    tableKit.mergeCells()

    const contents = quill.getContents()

    const secondEditor = setup().quill

    secondEditor.setContents(contents)

    expect(secondEditor.getContents()).toEqual(contents)
    expect(secondEditor.root.innerHTML).toBe(quill.root.innerHTML)
  })

  it('loads a Delta saved elsewhere, e.g. from an API', () => {
    const { quill } = setup()

    quill.setContents(savedDocument())

    expect(shape(quill)).toEqual([[21], [11, 11]])
  })
})

describe('semantic HTML', () => {
  it('exports spans and widths without editor-only markup', () => {
    const { quill, tableKit } = setupWithTable(2, 2, { responsiveWidths: false })

    quill.insertText(0, 'x<y', 'user')
    quill.setSelection(0, cellIndex(quill, 1))
    tableKit.mergeCells()
    tableKit.setColumnWidths(tables(quill)[0], [50, 70])

    const html = quill.getSemanticHTML()

    expect(html).toContain('<colgroup><col style="width: 50px;"><col style="width: 70px;"></colgroup>')
    expect(html).toContain('<table style="border-collapse: collapse; table-layout: fixed; width: 120px;">')
    expect(html).toContain('colspan="2"')
    expect(html).toContain('x&lt;y')
    expect(html).not.toContain('data-')
    expect(html).not.toContain('qlt-')
  })

  it('exports a table without set widths at full width, like in the editor', () => {
    const { quill } = setupWithTable(1, 2)

    expect(quill.getSemanticHTML()).toContain(
      '<table style="border-collapse: collapse; table-layout: fixed; width: 100%;">',
    )
  })

  it('copies a selection inside one cell as plain paragraphs', () => {
    const { quill } = setupWithTable(1, 2)

    quill.insertText(0, 'hello\nworld', 'user')

    expect(quill.getSemanticHTML(1, 8)).toBe('<p>ello</p><p>wor</p>')
  })
})

describe('read-only display', () => {
  it('renders a saved Delta without the editing UI', () => {
    const host = document.createElement('div')

    document.body.append(host)

    const quill = new Quill(host, { readOnly: true, modules: { toolbar: false, tableKit: true } })

    quill.setContents(savedDocument({ widths: [120, 200] }))

    expect(shape(quill)).toEqual([[21], [11, 11]])

    const columnElements = [...tables(quill)[0].querySelectorAll<HTMLElement>('col')]

    expect(columnElements.map((columnElement) => columnElement.style.width)).toEqual(['120px', '200px'])
    quill.root.querySelector('td')?.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))
    expect(host.querySelector('.qlt-menu')).toBeNull()
  })

  it('renders tables when the module is registered but not enabled on that instance', () => {
    document.head.innerHTML = ''
    TableKit.register()

    const host = document.createElement('div')

    document.body.append(host)

    const quill = new Quill(host, { readOnly: true, modules: { toolbar: false } })

    quill.setContents(savedDocument())

    expect(shape(quill)).toEqual([[21], [11, 11]])
    expect(document.getElementById('quill-tablekit-styles')).not.toBeNull()
  })
})

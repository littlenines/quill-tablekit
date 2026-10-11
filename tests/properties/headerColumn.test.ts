import { describe, expect, it } from 'vitest'
import { cellIndex, cells, copyOrCut, paste, setup, setupWithTable, tables } from '../helpers'

const barButton = (host: HTMLElement, label: string) =>
  host.querySelector<HTMLButtonElement>(`.qlt-action-bar [aria-label="${label}"]`)

const firstColumnFlags = (quillCells: HTMLTableCellElement[]) =>
  quillCells.map((cellElement) => cellElement.hasAttribute('data-first-column'))

describe('header column', () => {
  it('turns on from the action bar and marks the cells of the first column', () => {
    const { quill, host, tableKit } = setupWithTable(2, 3)

    quill.setSelection(0, 0)
    barButton(host, 'Header column')?.click()

    expect(tableKit.getTableProperties()?.headerColumn).toBe(true)
    expect(tables(quill)[0].dataset.headerColumn).toBe('true')
    expect(barButton(host, 'Header column')?.getAttribute('aria-pressed')).toBe('true')
    expect(firstColumnFlags(cells(quill))).toEqual([true, false, false, true, false, false])

    barButton(host, 'Header column')?.click()

    expect(firstColumnFlags(cells(quill)).some(Boolean)).toBe(false)
  })

  it('finds the first column when a merged cell from the row above covers it', () => {
    const { quill, tableKit } = setupWithTable(3, 2)

    quill.setSelection(0, cellIndex(quill, 2))
    tableKit.mergeCells()
    tableKit.setTableProperties({ headerColumn: true })

    const [tall, topRight, middleRight, bottomLeft, bottomRight] = cells(quill)

    expect(tall.rowSpan).toBe(2)
    expect(firstColumnFlags([tall, topRight, middleRight, bottomLeft, bottomRight])).toEqual([
      true,
      false,
      false,
      true,
      false,
    ])
  })

  it('exports the first column as row headers', () => {
    const { quill, tableKit } = setupWithTable(2, 2)

    quill.setSelection(0, 0)
    tableKit.setTableProperties({ header: true, headerColumn: true })

    const html = quill.getSemanticHTML()

    expect(html.match(/scope="col"/g)).toHaveLength(2)
    expect(html.match(/scope="row"/g)).toHaveLength(1)
    expect(html).not.toContain('data-first-column')
  })

  it('shows up checked in the menu', () => {
    const { quill, host, tableKit } = setupWithTable(1, 1, { actionBar: false })

    quill.setSelection(0, 0)
    tableKit.setTableProperties({ headerColumn: true })
    host.querySelector<HTMLButtonElement>('button.ql-table')?.click()

    const menuItem = [...host.querySelectorAll('.qlt-menu-item')].find(
      (menuButton) => menuButton.textContent === 'Header column',
    )

    expect(menuItem?.getAttribute('aria-checked')).toBe('true')
  })

  it('comes back when pasted, without the header gray as a cell color', () => {
    const source = setupWithTable(2, 2)

    source.quill.setSelection(0, 0)
    source.tableKit.setTableProperties({ headerColumn: true })

    const target = setup()

    paste(target.quill, { 'text/html': source.quill.getSemanticHTML() })
    target.quill.setSelection(0, 0)

    expect(target.tableKit.getTableProperties()).toMatchObject({ header: false, headerColumn: true })
    expect(cells(target.quill).every((cellElement) => !cellElement.style.backgroundColor)).toBe(true)
  })

  it('reads row headers from other HTML', () => {
    const { quill, tableKit } = setup()

    paste(quill, { 'text/html': '<table><tr><th>Price</th><td>10</td></tr><tr><th>Tax</th><td>2</td></tr></table>' })
    quill.setSelection(0, 0)

    expect(tableKit.getTableProperties()).toMatchObject({ header: false, headerColumn: true })
  })
})

describe('header row in the saved HTML', () => {
  it('puts the header row in <thead> and the other rows in <tbody>', () => {
    const { quill, tableKit } = setupWithTable(3, 2)

    quill.setSelection(0, 0)
    tableKit.setTableProperties({ header: true })

    const html = quill.getSemanticHTML()

    expect(html).toMatch(/<thead><tr><th[^>]*>.*?<\/th><th[^>]*>.*?<\/th><\/tr><\/thead><tbody><tr><td/)
    expect(html.match(/<tr>/g)).toHaveLength(3)
  })

  it('has no <thead> without a header row', () => {
    const { quill } = setupWithTable(2, 2)

    expect(quill.getSemanticHTML()).not.toContain('<thead>')
  })

  it('keeps the header row in <tbody> when one of its cells is merged down', () => {
    const { quill, tableKit } = setupWithTable(3, 2)

    quill.setSelection(0, cellIndex(quill, 2))
    tableKit.mergeCells()
    tableKit.setTableProperties({ header: true })

    const html = quill.getSemanticHTML()

    expect(html).not.toContain('<thead>')
    expect(html).toContain('<th rowspan="2"')
  })

  it('uses <thead> for copied cells only when they include the header row', () => {
    const { quill, tableKit } = setupWithTable(3, 2)

    quill.setSelection(0, 0)
    tableKit.setTableProperties({ header: true })
    quill.setSelection(0, cellIndex(quill, 3))

    expect(copyOrCut(quill, 'copy').clipboardContent['text/html']).toContain('<thead>')

    quill.setSelection(cellIndex(quill, 2), cellIndex(quill, 5) - cellIndex(quill, 2))

    expect(copyOrCut(quill, 'copy').clipboardContent['text/html']).not.toContain('<thead>')
  })

  it('comes back with its header row when pasted', () => {
    const source = setupWithTable(2, 2)

    source.quill.setSelection(0, 0)
    source.tableKit.setTableProperties({ header: true })

    const target = setup()

    paste(target.quill, { 'text/html': source.quill.getSemanticHTML() })
    target.quill.setSelection(0, 0)

    expect(target.tableKit.getTableProperties()?.header).toBe(true)
    expect(tables(target.quill)[0].rows).toHaveLength(2)
  })
})

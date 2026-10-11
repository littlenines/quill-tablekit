import { describe, expect, it } from 'vitest'
import { cellIndex, cellTexts, fillCells, setupWithTable } from '../helpers'

const menuLabels = (host: HTMLElement) =>
  [...host.querySelectorAll<HTMLButtonElement>('.qlt-menu-item')].map((menuButton) => menuButton.textContent)

const openColumnsMenu = (host: HTMLElement) =>
  host.querySelector<HTMLButtonElement>('.qlt-action-bar [aria-label="Columns"]')?.click()

describe('sorting a table', () => {
  it('sorts by the column of the cursor and keeps the cursor in its cell', () => {
    const { quill, tableKit } = setupWithTable(3, 2)

    fillCells(quill, ['c', '1', 'a', '3', 'b', '2'])
    quill.setSelection(cellIndex(quill, 1), 0)
    tableKit.sortByColumn('descending')

    expect(cellTexts(quill)).toEqual(['a', '3', 'b', '2', 'c', '1'])
    expect(quill.getSelection()?.index).toBe(cellIndex(quill, 5))
  })

  it('undoes a sort in one step', () => {
    const { quill, tableKit } = setupWithTable(2, 1)

    fillCells(quill, ['b', 'a'])
    quill.setSelection(cellIndex(quill, 0), 0)
    tableKit.sortByColumn()
    quill.history.undo()

    expect(cellTexts(quill)).toEqual(['b', 'a'])
  })

  it('shows the sort items only with the sortable option', () => {
    const plain = setupWithTable(2, 2)

    plain.quill.setSelection(0, 0)
    openColumnsMenu(plain.host)

    expect(menuLabels(plain.host)).not.toContain('Sort A → Z')

    const sortable = setupWithTable(2, 2, { sortable: true })

    sortable.quill.setSelection(0, 0)
    openColumnsMenu(sortable.host)

    expect(menuLabels(sortable.host)).toEqual(expect.arrayContaining(['Sort A → Z', 'Sort Z → A']))
  })
})

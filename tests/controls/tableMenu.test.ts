import { describe, expect, it } from 'vitest'
import type { TableKitOptions } from '../../src'
import { cellIndex, cells, setupWithTable, tables } from '../helpers'

const clickTableButton = (host: HTMLElement) => host.querySelector<HTMLButtonElement>('button.ql-table')?.click()

const menuItems = (host: HTMLElement) => [...host.querySelectorAll<HTMLButtonElement>('.qlt-menu-item')]

const menuItem = (host: HTMLElement, label: string) =>
  menuItems(host).find((menuButton) => menuButton.textContent === label)

// With the action bar on, the toolbar button inserts tables, so the menu tests turn the bar off
const setupWithMenuInToolbar = (rowCount: number, columnCount: number, tableKitOptions: TableKitOptions = {}) =>
  setupWithTable(rowCount, columnCount, { actionBar: false, ...tableKitOptions })

describe('table menu', () => {
  it('opens from the toolbar button when the cursor is in a table', () => {
    const { quill, host } = setupWithMenuInToolbar(2, 2)

    quill.setSelection(0, 0)

    clickTableButton(host)

    expect(menuItem(host, 'Merge cells')?.disabled).toBe(true)
    expect(menuItem(host, 'Split cell')?.disabled).toBe(true)
    menuItem(host, 'Insert row below')?.click()
    expect(tables(quill)[0].rows).toHaveLength(3)
  })

  it('opens on right-click when contextMenu is on, and moves the cursor into the clicked cell', () => {
    const { quill, host } = setupWithMenuInToolbar(2, 2, { contextMenu: true })

    const contextMenuEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: 10,
      clientY: 10,
    })

    cells(quill)[3].dispatchEvent(contextMenuEvent)

    expect(contextMenuEvent.defaultPrevented).toBe(true)
    expect(host.querySelector('.qlt-menu')).not.toBeNull()
    expect(quill.getSelection()?.index).toBe(cellIndex(quill, 3))
  })

  it('keeps a selection that ends in the right-clicked empty cell, so it can be merged', () => {
    const { quill, host } = setupWithMenuInToolbar(2, 2, { contextMenu: true })
    const topRight = cellIndex(quill, 1)
    const bottomRight = cellIndex(quill, 3)

    quill.setSelection(topRight, bottomRight - topRight)
    cells(quill)[3].dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))

    expect(quill.getSelection()).toEqual({ index: topRight, length: bottomRight - topRight })
    expect(menuItem(host, 'Merge cells')?.disabled).toBe(false)
  })

  it('leaves right-click to the browser by default', () => {
    const { quill, host } = setupWithMenuInToolbar(2, 2)

    const contextMenuEvent = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })

    cells(quill)[0].dispatchEvent(contextMenuEvent)

    expect(contextMenuEvent.defaultPrevented).toBe(false)
    expect(host.querySelector('.qlt-menu')).toBeNull()
  })

  it('uses custom labels', () => {
    const { quill, host } = setupWithMenuInToolbar(1, 1, { labels: { mergeCells: 'Zellen verbinden' } })

    quill.setSelection(0, 0)

    clickTableButton(host)

    expect(menuItem(host, 'Zellen verbinden')).toBeDefined()
    expect(menuItem(host, 'Delete table')).toBeDefined()
  })

  it('shows only the items listed in the menu option', () => {
    const { quill, host } = setupWithMenuInToolbar(1, 1, { menu: ['mergeCells', 'deleteTable'] })

    quill.setSelection(0, 0)
    clickTableButton(host)

    expect(menuItems(host).map((menuButton) => menuButton.textContent)).toEqual(['Merge cells', 'Delete table'])
    expect(host.querySelectorAll('.qlt-menu-separator')).toHaveLength(1)
  })

  it('has no menu at all with an empty menu option', () => {
    const { quill, host } = setupWithMenuInToolbar(1, 1, { menu: [], contextMenu: true })
    const contextMenuEvent = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })

    cells(quill)[0].dispatchEvent(contextMenuEvent)
    quill.setSelection(0, 0)
    clickTableButton(host)

    expect(contextMenuEvent.defaultPrevented).toBe(false)
    expect(host.querySelector('.qlt-menu')).toBeNull()
    expect(host.querySelector('.qlt-action-bar')).toBeNull()
  })

  it('turns the header row on and off, and shows a check mark while it is on', () => {
    const { quill, host } = setupWithMenuInToolbar(2, 2)

    quill.setSelection(0, 0)
    clickTableButton(host)
    expect(menuItem(host, 'Header row')?.getAttribute('aria-checked')).toBe('false')
    menuItem(host, 'Header row')?.click()
    expect(tables(quill)[0].dataset.header).toBe('true')

    clickTableButton(host)
    expect(menuItem(host, 'Header row')?.getAttribute('aria-checked')).toBe('true')
    menuItem(host, 'Header row')?.click()
    expect(tables(quill)[0].hasAttribute('data-header')).toBe(false)
  })
})

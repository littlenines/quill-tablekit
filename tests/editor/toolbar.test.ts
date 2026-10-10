import { describe, expect, it } from 'vitest'
import { cellIndex, cells, setup, setupWithTable, shape, tables } from '../helpers'

const clickTableButton = (host: HTMLElement) => host.querySelector<HTMLButtonElement>('button.ql-table')?.click()

const menuItems = (host: HTMLElement) => [...host.querySelectorAll<HTMLButtonElement>('.qlt-menu-item')]

const menuItem = (host: HTMLElement, label: string) =>
  menuItems(host).find((menuButton) => menuButton.textContent === label)

describe('size picker', () => {
  it('inserts the hovered size on click', () => {
    const { quill, host } = setup()

    quill.setSelection(0, 0)
    clickTableButton(host)

    const gridButton = host.querySelector<HTMLButtonElement>('.qlt-picker [data-rows="2"][data-columns="3"]')

    gridButton?.dispatchEvent(new MouseEvent('mouseenter'))
    expect(host.querySelector('.qlt-picker-label')?.textContent).toBe('2 × 3')
    gridButton?.click()

    expect(host.querySelector('.qlt-picker')).toBeNull()
    expect(shape(quill)).toEqual([
      [11, 11, 11],
      [11, 11, 11],
    ])
  })

  it('inserts a custom size typed into the inputs', () => {
    const { quill, host } = setup()

    quill.setSelection(0, 0)
    clickTableButton(host)

    const [rowsInput, columnsInput] = host.querySelectorAll<HTMLInputElement>('.qlt-picker-input')

    rowsInput.value = '12'
    columnsInput.value = '15'
    host.querySelector('form.qlt-picker-custom')?.dispatchEvent(new Event('submit', { cancelable: true }))

    expect(tables(quill)[0].rows).toHaveLength(12)
    expect(tables(quill)[0].rows[0].cells).toHaveLength(15)
  })

  it('uses the configured grid size', () => {
    const { quill, host } = setup({ pickerRows: 4, pickerColumns: 5 })

    quill.setSelection(0, 0)
    clickTableButton(host)

    expect(host.querySelectorAll('.qlt-picker-cell')).toHaveLength(20)
  })

  it('closes on Escape', () => {
    const { quill, host } = setup()

    quill.setSelection(0, 0)
    clickTableButton(host)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    expect(host.querySelector('.qlt-picker')).toBeNull()
  })
})

describe('table menu', () => {
  it('opens from the toolbar button when the cursor is in a table', () => {
    const { quill, host } = setupWithTable(2, 2)

    quill.setSelection(0, 0)

    clickTableButton(host)

    expect(menuItem(host, 'Merge cells')?.disabled).toBe(true)
    expect(menuItem(host, 'Split cell')?.disabled).toBe(true)
    menuItem(host, 'Insert row below')?.click()
    expect(tables(quill)[0].rows).toHaveLength(3)
  })

  it('opens on right-click and moves the cursor into the clicked cell', () => {
    const { quill, host } = setupWithTable(2, 2)

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
    const { quill, host } = setupWithTable(2, 2)
    const topRight = cellIndex(quill, 1)
    const bottomRight = cellIndex(quill, 3)

    quill.setSelection(topRight, bottomRight - topRight)
    cells(quill)[3].dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))

    expect(quill.getSelection()).toEqual({ index: topRight, length: bottomRight - topRight })
    expect(menuItem(host, 'Merge cells')?.disabled).toBe(false)
  })

  it('leaves right-click alone when contextMenu is off', () => {
    const { quill, host } = setupWithTable(2, 2, { contextMenu: false })

    const contextMenuEvent = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })

    cells(quill)[0].dispatchEvent(contextMenuEvent)

    expect(contextMenuEvent.defaultPrevented).toBe(false)
    expect(host.querySelector('.qlt-menu')).toBeNull()
  })

  it('uses custom labels', () => {
    const { quill, host } = setupWithTable(1, 1, { labels: { mergeCells: 'Zellen verbinden' } })

    quill.setSelection(0, 0)

    clickTableButton(host)

    expect(menuItem(host, 'Zellen verbinden')).toBeDefined()
    expect(menuItem(host, 'Delete table')).toBeDefined()
  })
})

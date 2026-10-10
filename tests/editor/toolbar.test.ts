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

  it('inserts the hovered size when the click lands between two squares', () => {
    const { quill, host } = setup()

    quill.setSelection(0, 0)
    clickTableButton(host)
    host.querySelector('.qlt-picker [data-rows="2"][data-columns="2"]')?.dispatchEvent(new MouseEvent('mouseenter'))
    host.querySelector<HTMLElement>('.qlt-picker-grid')?.click()

    expect(shape(quill)).toEqual([
      [11, 11],
      [11, 11],
    ])
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

  it('opens on right-click when contextMenu is on, and moves the cursor into the clicked cell', () => {
    const { quill, host } = setupWithTable(2, 2, { contextMenu: true })

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
    const { quill, host } = setupWithTable(2, 2, { contextMenu: true })
    const topRight = cellIndex(quill, 1)
    const bottomRight = cellIndex(quill, 3)

    quill.setSelection(topRight, bottomRight - topRight)
    cells(quill)[3].dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))

    expect(quill.getSelection()).toEqual({ index: topRight, length: bottomRight - topRight })
    expect(menuItem(host, 'Merge cells')?.disabled).toBe(false)
  })

  it('leaves right-click to the browser by default', () => {
    const { quill, host } = setupWithTable(2, 2)

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

  it('shows only the items listed in the menu option', () => {
    const { quill, host } = setupWithTable(1, 1, { menu: ['mergeCells', 'deleteTable'] })

    quill.setSelection(0, 0)
    clickTableButton(host)

    expect(menuItems(host).map((menuButton) => menuButton.textContent)).toEqual(['Merge cells', 'Delete table'])
    expect(host.querySelectorAll('.qlt-menu-separator')).toHaveLength(1)
  })

  it('has no menu at all with an empty menu option', () => {
    const { quill, host } = setupWithTable(1, 1, { menu: [], contextMenu: true })
    const contextMenuEvent = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })

    cells(quill)[0].dispatchEvent(contextMenuEvent)
    quill.setSelection(0, 0)
    clickTableButton(host)

    expect(contextMenuEvent.defaultPrevented).toBe(false)
    expect(host.querySelector('.qlt-menu')).toBeNull()
    expect(host.querySelector('.qlt-action-bar')).toBeNull()
  })

  it('turns the header row on and off, and shows a check mark while it is on', () => {
    const { quill, host } = setupWithTable(2, 2)

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

describe('properties panel', () => {
  const openPanel = (host: HTMLElement, label: string) => {
    clickTableButton(host)
    menuItem(host, label)?.click()

    return host.querySelector<HTMLElement>('.qlt-properties')
  }

  const optionButton = (panel: HTMLElement | null, groupLabel: string, optionLabel: string) =>
    panel?.querySelector<HTMLButtonElement>(`[role="group"][aria-label="${groupLabel}"] [aria-label="${optionLabel}"]`)

  it('changes the cell while the panel stays open', () => {
    const { quill, host } = setupWithTable(2, 2)

    quill.setSelection(0, 0)

    const panel = openPanel(host, 'Cell properties')

    optionButton(panel, 'Background', '#fff2cc')?.click()
    optionButton(panel, 'Vertical alignment', 'Middle')?.click()

    expect(cells(quill)[0].style.backgroundColor).toBe('rgb(255, 242, 204)')
    expect(cells(quill)[0].style.verticalAlign).toBe('middle')
    expect(host.querySelector('.qlt-properties')).not.toBeNull()
    expect(optionButton(panel, 'Vertical alignment', 'Middle')?.getAttribute('aria-pressed')).toBe('true')
    expect(optionButton(panel, 'Vertical alignment', 'Top')?.getAttribute('aria-pressed')).toBe('false')
  })

  it('shows the current values when it opens', () => {
    const { quill, host, tableKit } = setupWithTable(1, 1)

    quill.setSelection(0, 0)
    tableKit.setTableProperties({ align: 'center', borderColor: '#ff0000' })

    const panel = openPanel(host, 'Table properties')

    expect(optionButton(panel, 'Table alignment', 'Center')?.getAttribute('aria-pressed')).toBe('true')
    expect(optionButton(panel, 'Border color', '#ff0000')).toBeNull()
    expect(optionButton(panel, 'Border color', 'No color')?.getAttribute('aria-pressed')).toBe('false')
  })

  it('uses the colors option and removes a color with No color', () => {
    const { quill, host } = setupWithTable(1, 1, { colors: ['#123456', 'nope;'] })

    quill.setSelection(0, 0)

    const panel = openPanel(host, 'Table properties')
    const swatches = panel?.querySelectorAll('[aria-label="Border color"] .qlt-swatch')

    expect(swatches).toHaveLength(2)

    optionButton(panel, 'Border color', '#123456')?.click()
    expect(tables(quill)[0].style.getPropertyValue('--qlt-border')).toBe('#123456')

    optionButton(panel, 'Border color', 'No color')?.click()
    expect(tables(quill)[0].style.getPropertyValue('--qlt-border')).toBe('')
  })

  it('applies a typed color code with Enter', () => {
    const { quill, host } = setupWithTable(1, 1)

    quill.setSelection(0, 0)

    const panel = openPanel(host, 'Cell properties')
    const codeInput = panel?.querySelector<HTMLInputElement>('[aria-label="Color code"]')

    if (!codeInput) throw new Error('no color code input')

    codeInput.value = 'rgb(18, 52, 86)'
    codeInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))

    expect(cells(quill)[0].style.backgroundColor).toBe('rgb(18, 52, 86)')
    expect(codeInput.value).toBe('#123456')
    expect(optionButton(panel, 'Background', 'No color')?.getAttribute('aria-pressed')).toBe('false')
  })

  it('marks a code that is not a color and leaves the cell alone', () => {
    const { quill, host } = setupWithTable(1, 1)

    quill.setSelection(0, 0)

    const panel = openPanel(host, 'Cell properties')
    const codeInput = panel?.querySelector<HTMLInputElement>('[aria-label="Color code"]')

    if (!codeInput) throw new Error('no color code input')

    codeInput.value = 'not a color'
    codeInput.dispatchEvent(new Event('change'))

    expect(codeInput.getAttribute('aria-invalid')).toBe('true')
    expect(cells(quill)[0].hasAttribute('style')).toBe(false)
  })

  it('applies the color from the color picker', () => {
    const { quill, host } = setupWithTable(1, 1)

    quill.setSelection(0, 0)

    const panel = openPanel(host, 'Table properties')
    const picker = panel?.querySelector<HTMLInputElement>(
      '[aria-label="Border color"] ~ .qlt-custom-color input[type="color"]',
    )

    if (!picker) throw new Error('no color picker')

    picker.value = '#aa00ff'
    picker.dispatchEvent(new Event('change'))

    expect(tables(quill)[0].style.getPropertyValue('--qlt-border')).toBe('#aa00ff')
  })

  it('shows a color that is not in the palette in the code input', () => {
    const { quill, host, tableKit } = setupWithTable(1, 1)

    quill.setSelection(0, 0)
    tableKit.setCellProperties({ background: '#123456' })

    const panel = openPanel(host, 'Cell properties')

    expect(panel?.querySelector<HTMLInputElement>('[aria-label="Color code"]')?.value).toBe('#123456')
    expect(panel?.querySelector<HTMLInputElement>('input[type="color"]')?.value).toBe('#123456')
  })
})

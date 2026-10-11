import { describe, expect, it } from 'vitest'
import type { TableKitOptions } from '../../src'
import { cells, setupWithTable, tables } from '../helpers'

const clickTableButton = (host: HTMLElement) => host.querySelector<HTMLButtonElement>('button.ql-table')?.click()

const menuItems = (host: HTMLElement) => [...host.querySelectorAll<HTMLButtonElement>('.qlt-menu-item')]

const menuItem = (host: HTMLElement, label: string) =>
  menuItems(host).find((menuButton) => menuButton.textContent === label)

// With the action bar on, the toolbar button inserts tables, so the menu tests turn the bar off

const setupWithMenuInToolbar = (rowCount: number, columnCount: number, tableKitOptions: TableKitOptions = {}) =>
  setupWithTable(rowCount, columnCount, { actionBar: false, ...tableKitOptions })

describe('properties panel', () => {
  const openPanel = (host: HTMLElement, label: string) => {
    clickTableButton(host)
    menuItem(host, label)?.click()

    return host.querySelector<HTMLElement>('.qlt-properties')
  }

  const optionButton = (panel: HTMLElement | null, groupLabel: string, optionLabel: string) =>
    panel?.querySelector<HTMLButtonElement>(`[role="group"][aria-label="${groupLabel}"] [aria-label="${optionLabel}"]`)

  it('changes the cell while the panel stays open', () => {
    const { quill, host } = setupWithMenuInToolbar(2, 2)

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
    const { quill, host, tableKit } = setupWithMenuInToolbar(1, 1)

    quill.setSelection(0, 0)
    tableKit.setTableProperties({ align: 'center', borderColor: '#ff0000' })

    const panel = openPanel(host, 'Table properties')

    expect(optionButton(panel, 'Table alignment', 'Center')?.getAttribute('aria-pressed')).toBe('true')
    expect(optionButton(panel, 'Border color', '#ff0000')).toBeNull()
    expect(optionButton(panel, 'Border color', 'Default')?.getAttribute('aria-pressed')).toBe('false')
  })

  it('uses the colors option and goes back to the default color', () => {
    const { quill, host } = setupWithMenuInToolbar(1, 1, { colors: ['#123456', 'nope;'] })

    quill.setSelection(0, 0)

    const panel = openPanel(host, 'Table properties')
    const swatches = panel?.querySelectorAll('[aria-label="Border color"] .qlt-swatch')

    expect(swatches).toHaveLength(2)

    optionButton(panel, 'Border color', '#123456')?.click()
    expect(tables(quill)[0].style.getPropertyValue('--qlt-border')).toBe('#123456')

    optionButton(panel, 'Border color', 'Default')?.click()
    expect(tables(quill)[0].style.getPropertyValue('--qlt-border')).toBe('')
  })

  it('applies a typed color code with Enter', () => {
    const { quill, host } = setupWithMenuInToolbar(1, 1)

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
    const { quill, host } = setupWithMenuInToolbar(1, 1)

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
    const { quill, host } = setupWithMenuInToolbar(1, 1)

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
    const { quill, host, tableKit } = setupWithMenuInToolbar(1, 1)

    quill.setSelection(0, 0)
    tableKit.setCellProperties({ background: '#123456' })

    const panel = openPanel(host, 'Cell properties')

    expect(panel?.querySelector<HTMLInputElement>('[aria-label="Color code"]')?.value).toBe('#123456')
    expect(panel?.querySelector<HTMLInputElement>('input[type="color"]')?.value).toBe('#123456')
  })
})

describe('table properties panel', () => {
  it('has fields for borders, spacing, stripes and the caption', () => {
    const { quill, host, tableKit } = setupWithTable(2, 2)

    quill.setSelection(0, 0)
    host.querySelector<HTMLButtonElement>('.qlt-action-bar [aria-label="Table properties"]')?.click()

    const panel = host.querySelector('.qlt-properties') as HTMLElement
    const stripedCheckbox = panel.querySelector<HTMLInputElement>('.qlt-toggle input') as HTMLInputElement
    const captionInput = panel.querySelector<HTMLInputElement>('.qlt-text-input') as HTMLInputElement

    panel.querySelector<HTMLButtonElement>('[aria-label="Borders"] [aria-label="None"]')?.click()
    panel.querySelector<HTMLButtonElement>('[aria-label="Cell spacing"] [aria-label="Wide"]')?.click()
    stripedCheckbox.click()
    captionInput.value = 'Prices'
    captionInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))

    expect(tableKit.getTableProperties()).toMatchObject({
      borderStyle: 'none',
      cellPadding: 'wide',
      striped: true,
      caption: 'Prices',
    })
    expect(host.querySelector('.qlt-properties')).not.toBeNull()
  })
})

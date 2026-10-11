import { describe, expect, it } from 'vitest'
import { cellIndex, press, setup, setupWithTable, tables } from '../helpers'

const actionBar = (host: HTMLElement) => host.querySelector<HTMLElement>('.qlt-action-bar')

const barButton = (host: HTMLElement, label: string) =>
  host.querySelector<HTMLButtonElement>(`.qlt-action-bar [aria-label="${label}"]`)

const menuLabels = (host: HTMLElement) =>
  [...host.querySelectorAll('.qlt-menu-item')].map((menuButton) => menuButton.textContent)

describe('action bar', () => {
  it('shows while the cursor is in a table and hides outside it', () => {
    const { quill, host, tableKit } = setup()

    quill.setText('before\n')
    quill.setSelection(0, 0)
    expect(actionBar(host)?.style.display).not.toBe('flex')

    quill.setSelection(7, 0)
    tableKit.insertTable(2, 2)

    expect(actionBar(host)?.style.display).toBe('flex')

    quill.setSelection(0, 0)

    expect(actionBar(host)?.style.display).toBe('none')
  })

  it('opens a short menu for rows', () => {
    const { quill, host } = setupWithTable(2, 2)

    quill.setSelection(0, 0)
    barButton(host, 'Rows')?.click()

    expect(menuLabels(host)).toEqual([
      'Insert row above',
      'Insert row below',
      'Move row up',
      'Move row down',
      'Duplicate row',
      'Equal row heights',
      'Select row',
      'Delete row',
    ])

    barButton(host, 'Rows')?.click()

    expect(host.querySelector('.qlt-menu')).toBeNull()
  })

  it('turns into Merge or Split depending on the selection', () => {
    const { quill, host } = setupWithTable(2, 2)

    quill.setSelection(0, 0)
    expect(barButton(host, 'Merge cells')?.disabled).toBe(true)

    quill.setSelection(0, cellIndex(quill, 1))
    expect(barButton(host, 'Merge cells')?.disabled).toBe(false)

    barButton(host, 'Merge cells')?.click()

    expect(tables(quill)[0].rows[0].cells).toHaveLength(1)
    expect(barButton(host, 'Split cell')?.disabled).toBe(false)

    barButton(host, 'Split cell')?.click()

    expect(tables(quill)[0].rows[0].cells).toHaveLength(2)
  })

  it('shows the header row as a pressed button', () => {
    const { quill, host } = setupWithTable(2, 2)

    quill.setSelection(0, 0)
    barButton(host, 'Header row')?.click()

    expect(tables(quill)[0].dataset.header).toBe('true')
    expect(barButton(host, 'Header row')?.getAttribute('aria-pressed')).toBe('true')
  })

  it('opens the properties panel under its button', () => {
    const { quill, host } = setupWithTable(1, 1)

    quill.setSelection(0, 0)
    barButton(host, 'Cell properties')?.click()

    expect(host.querySelector('.qlt-properties')?.getAttribute('aria-label')).toBe('Cell properties')

    barButton(host, 'Cell properties')?.click()

    expect(host.querySelector('.qlt-properties')).toBeNull()
  })

  it('deletes the table and goes away', () => {
    const { quill, host } = setupWithTable(1, 1)

    quill.setSelection(0, 0)
    barButton(host, 'Delete table')?.click()

    expect(tables(quill)).toHaveLength(0)
    expect(actionBar(host)?.style.display).toBe('none')
  })

  it('only shows the buttons for the items in the menu option', () => {
    const { quill, host } = setupWithTable(1, 1, { menu: ['mergeCells', 'deleteTable'] })

    quill.setSelection(0, 0)

    const buttonLabels = [...host.querySelectorAll('.qlt-action-bar > *')].map(
      (barElement) => barElement.getAttribute('aria-label') ?? '|',
    )

    expect(buttonLabels).toEqual(['Merge cells', '|', 'Delete table'])
  })

  it('hides with Escape until the cursor goes to another cell', () => {
    const { quill, host } = setupWithTable(1, 2)

    quill.setSelection(0, 0)
    press(quill, 'Escape')
    expect(actionBar(host)?.style.display).toBe('none')

    quill.setSelection(0, 0)
    expect(actionBar(host)?.style.display).toBe('none')

    quill.setSelection(cellIndex(quill, 1), 0)
    expect(actionBar(host)?.style.display).toBe('flex')
  })

  it('gets the keyboard focus with Alt+F10 and moves between buttons with the arrow keys', () => {
    const { quill, host } = setupWithTable(1, 1)

    quill.setSelection(0, 0)
    press(quill, 'F10', { altKey: true })

    expect(document.activeElement?.getAttribute('aria-label')).toBe('Rows')
    expect(actionBar(host)?.style.display).toBe('flex')

    const pressInBar = (key: string) =>
      document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))

    pressInBar('ArrowRight')
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Columns')
    expect(barButton(host, 'Columns')?.tabIndex).toBe(0)
    expect(barButton(host, 'Rows')?.tabIndex).toBe(-1)

    pressInBar('ArrowLeft')
    pressInBar('ArrowLeft')
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Delete table')

    pressInBar('Home')
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Rows')

    pressInBar('Escape')
    expect(document.activeElement).toBe(quill.root)
  })

  it('moves the focus into a menu opened from the keyboard and back on Escape', () => {
    const { quill, host } = setupWithTable(1, 1)

    quill.setSelection(0, 0)
    barButton(host, 'Rows')?.focus()
    barButton(host, 'Rows')?.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }))

    expect(document.activeElement?.textContent).toBe('Insert row above')

    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    )

    expect(host.querySelector('.qlt-menu')).toBeNull()
    expect(document.activeElement).toBe(barButton(host, 'Rows'))
  })

  it('uses custom icons', () => {
    const { quill, host } = setupWithTable(1, 1, {
      icons: { rows: '<i class="my-rows"></i>', insertTable: '<i class="my-table"></i>' },
    })

    quill.setSelection(0, 0)

    expect(barButton(host, 'Rows')?.querySelector('.my-rows')).not.toBeNull()
    expect(barButton(host, 'Columns')?.querySelector('svg')).not.toBeNull()
    expect(host.querySelector('button.ql-table .my-table')).not.toBeNull()
  })

  it('can be turned off', () => {
    const { quill, host } = setupWithTable(1, 1, { actionBar: false })

    quill.setSelection(0, 0)

    expect(actionBar(host)).toBeNull()
  })
})

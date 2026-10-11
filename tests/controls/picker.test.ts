import { describe, expect, it } from 'vitest'
import Quill from 'quill'
import { setup, setupWithTable, shape, tables } from '../helpers'

const clickTableButton = (host: HTMLElement) => host.querySelector<HTMLButtonElement>('button.ql-table')?.click()

describe('size picker', () => {
  it('takes the focus when opened with the keyboard, and gives it back on Escape', () => {
    const { quill, host } = setup()
    const tableButton = host.querySelector<HTMLButtonElement>('button.ql-table')

    quill.setSelection(0, 0)
    tableButton?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    tableButton?.click()

    expect(document.activeElement).toBe(host.querySelector('.qlt-picker [data-rows="1"][data-columns="1"]'))

    document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    expect(host.querySelector('.qlt-picker')).toBeNull()
    expect(document.activeElement).toBe(tableButton)
  })

  it('leaves the focus alone when opened with the mouse', () => {
    const { quill, host } = setup()
    const tableButton = host.querySelector<HTMLButtonElement>('button.ql-table')

    quill.setSelection(0, 0)
    tableButton?.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    tableButton?.click()

    expect(host.querySelector('.qlt-picker')?.contains(document.activeElement)).toBe(false)
  })

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

describe('toolbar button in a table', () => {
  it('opens the size picker and puts the new table below the current one', () => {
    const { quill, host } = setupWithTable(1, 1)

    quill.setSelection(0, 0)
    clickTableButton(host)

    expect(host.querySelector('.qlt-menu')).toBeNull()

    host.querySelector<HTMLButtonElement>('.qlt-picker-cell[data-rows="2"][data-columns="3"]')?.click()

    const [firstTable, newTable] = tables(quill)

    expect(newTable.rows).toHaveLength(2)
    expect(firstTable.nextElementSibling?.tagName).toBe('P')
    expect(firstTable.nextElementSibling?.nextElementSibling).toBe(newTable)
    expect(quill.getSelection()?.index).toBe(quill.getIndex(Quill.find(newTable.querySelector('p') as Node) as never))
  })
})

import { describe, expect, it } from 'vitest'
import { cellIndex, setup, setupWithTable } from '../helpers'

describe('cell selection highlight', () => {
  it('shows only while the selection spans several cells', () => {
    const { quill, host } = setupWithTable(2, 2)
    const overlay = host.querySelector<HTMLElement>('.qlt-selection')

    quill.setSelection(0, cellIndex(quill, 3) + 1, 'user')
    expect(overlay?.style.display).toBe('block')
    expect(host.querySelector('.ql-container')?.classList.contains('qlt-cells-selected')).toBe(true)

    quill.setSelection(0, 0, 'user')
    expect(overlay?.style.display).toBe('none')
  })
})

describe('current cell highlight', () => {
  const activeCell = (host: HTMLElement) => host.querySelector<HTMLElement>('.qlt-active-cell')

  it('marks the cell with the cursor, and nothing outside a table', () => {
    const { quill, host, tableKit } = setup()

    quill.setText('before\n')
    quill.setSelection(0, 0, 'user')
    expect(activeCell(host)?.style.display).not.toBe('block')

    quill.setSelection(7, 0, 'user')
    tableKit.insertTable(2, 2)
    expect(activeCell(host)?.style.display).toBe('block')

    quill.setSelection(0, 0, 'user')
    expect(activeCell(host)?.style.display).toBe('none')
  })

  it('makes way for the highlight when several cells are selected', () => {
    const { quill, host } = setupWithTable(2, 2)

    quill.setSelection(0, cellIndex(quill, 1), 'user')

    expect(activeCell(host)?.style.display).toBe('none')
    expect(host.querySelector<HTMLElement>('.qlt-selection')?.style.display).toBe('block')
  })

  it('stays while the properties panel is open', () => {
    const { quill, host } = setupWithTable(1, 1)

    quill.setSelection(0, 0, 'user')
    host.querySelector<HTMLButtonElement>('.qlt-action-bar [aria-label="Cell properties"]')?.click()
    quill.blur()

    expect(quill.getSelection()).toBeNull()
    expect(activeCell(host)?.style.display).toBe('block')
  })

  it('goes away together with the action bar when the editor becomes read-only', async () => {
    const { quill, host } = setupWithTable(1, 1)

    quill.setSelection(0, 0, 'user')
    quill.disable()
    await Promise.resolve()

    expect(activeCell(host)?.style.display).toBe('none')
    expect(host.querySelector<HTMLElement>('.qlt-action-bar')?.style.display).toBe('none')
  })
})

describe('options', () => {
  it('adds no resize handle when resizable is off', () => {
    const { host } = setup({ resizable: false })

    expect(host.querySelector('.qlt-col-handle')).toBeNull()
  })
})

describe('destroy', () => {
  it('removes its UI', () => {
    const { tableKit, host } = setup()

    tableKit.destroy()

    expect(host.querySelector('.qlt-selection')).toBeNull()
    expect(host.querySelector('.qlt-col-handle')).toBeNull()
  })

  it('stops reacting to right-clicks', () => {
    const { quill, tableKit, host } = setupWithTable(1, 1)

    tableKit.destroy()

    const contextMenuEvent = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })

    quill.root.querySelector('td')?.dispatchEvent(contextMenuEvent)

    expect(contextMenuEvent.defaultPrevented).toBe(false)
    expect(host.querySelector('.qlt-menu')).toBeNull()
  })
})

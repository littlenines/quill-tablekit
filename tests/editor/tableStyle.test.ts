import { describe, expect, it } from 'vitest'
import { cellIndex, cells, fillCells, paste, setup, setupWithTable, tables } from '../helpers'

const styledTable = (rowCount = 3) => {
  const editor = setupWithTable(rowCount, 2)

  editor.quill.setSelection(0, 0)
  editor.tableKit.setTableProperties({ borderStyle: 'dashed', cellPadding: 'compact', striped: true, caption: 'Sales' })

  return editor
}

describe('table style', () => {
  it('saves the border style, cell spacing, stripes and caption on the table', () => {
    const { quill, tableKit } = styledTable()
    const [tableElement] = tables(quill)

    expect(tableKit.getTableProperties()).toMatchObject({
      borderStyle: 'dashed',
      cellPadding: 'compact',
      striped: true,
      caption: 'Sales',
    })
    expect(tableElement.dataset).toMatchObject({
      borderStyle: 'dashed',
      cellPadding: 'compact',
      striped: 'true',
      caption: 'Sales',
    })
  })

  it('goes back to the defaults', () => {
    const { quill, tableKit } = styledTable()

    tableKit.setTableProperties({ borderStyle: 'solid', cellPadding: 'normal', striped: false, caption: '  ' })

    expect(tableKit.getTableProperties()).toMatchObject({
      borderStyle: 'solid',
      cellPadding: 'normal',
      striped: false,
      caption: '',
    })
    expect(tables(quill)[0].getAttribute('data-caption')).toBeNull()
  })

  it('keeps the style when rows are added', () => {
    const { tableKit } = styledTable()

    tableKit.insertRowBelow()

    expect(tableKit.getTableProperties()?.striped).toBe(true)
  })
})

describe('saved HTML', () => {
  it('writes the caption, border style, spacing and stripes as plain HTML', () => {
    const { quill } = styledTable()
    const html = quill.getSemanticHTML()

    expect(html).toContain('<caption>Sales</caption>')
    expect(html).toContain('<td style="border: 1px dashed #000; padding: 2px 6px;">')
    expect(html).toContain('<td style="border: 1px dashed #000; padding: 2px 6px; background-color: #f6f8fa;">')
    expect(html).not.toContain('data-')
  })

  it('stripes every other row, starting after the header row', () => {
    const { quill, tableKit } = styledTable(4)

    tableKit.setTableProperties({ header: true })

    const rowsWithStripes = [...quill.getSemanticHTML().matchAll(/<tr>(.*?)<\/tr>/g)].map(([, rowHTML]) =>
      rowHTML.includes('#f6f8fa'),
    )

    expect(rowsWithStripes).toEqual([false, false, true, false])
  })

  it('keeps the color of a cell that has its own background', () => {
    const { quill, tableKit } = styledTable()

    quill.setSelection(cellIndex(quill, 2), 0)
    tableKit.setCellProperties({ background: '#ff0000' })

    expect(quill.getSemanticHTML()).toContain('padding: 2px 6px; background-color: rgb(255, 0, 0);">')
  })

  it('leaves out borders for a table without borders', () => {
    const { quill, tableKit } = setupWithTable(1, 1)

    quill.setSelection(0, 0)
    tableKit.setTableProperties({ borderStyle: 'none' })

    expect(quill.getSemanticHTML()).toContain('<td style="border: none;">')
  })

  it('escapes the caption', () => {
    const { quill, tableKit } = setupWithTable(1, 1)

    quill.setSelection(0, 0)
    tableKit.setTableProperties({ caption: '<b>Q1 & Q2</b>' })

    expect(quill.getSemanticHTML()).toContain('<caption>&lt;b&gt;Q1 &amp; Q2&lt;/b&gt;</caption>')
  })

  it('marks the header cells as column headers', () => {
    const { quill, tableKit } = setupWithTable(2, 2)

    quill.setSelection(0, 0)
    tableKit.setTableProperties({ header: true })

    expect(quill.getSemanticHTML().match(/scope="col"/g)).toHaveLength(2)
  })
})

describe('pasting a styled table', () => {
  it('gets the style back instead of turning the stripes into cell colors', () => {
    const source = styledTable()

    fillCells(source.quill, ['a1', 'b1', 'a2', 'b2', 'a3', 'b3'])

    const target = setup()

    paste(target.quill, { 'text/html': source.quill.getSemanticHTML() })
    target.quill.setSelection(0, 0)

    expect(target.tableKit.getTableProperties()).toMatchObject({
      borderStyle: 'dashed',
      cellPadding: 'compact',
      striped: true,
      caption: 'Sales',
    })
    expect(cells(target.quill).every((cellElement) => !cellElement.style.backgroundColor)).toBe(true)
    expect(target.quill.getText()).not.toContain('Sales')
  })

  it('reads a caption and a borderless table from other HTML', () => {
    const { quill, tableKit } = setup()

    paste(quill, {
      'text/html':
        '<table><caption> Team  list </caption><tr><td style="border: none; padding: 10px">Ana</td></tr></table>',
    })
    quill.setSelection(0, 0)

    expect(tableKit.getTableProperties()).toMatchObject({
      caption: 'Team list',
      borderStyle: 'none',
      cellPadding: 'wide',
    })
    expect(quill.getText()).toBe('Ana\n\n')
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

describe('stripe color', () => {
  it('uses the chosen color in the editor and in the saved HTML', () => {
    const { quill, tableKit } = styledTable()

    tableKit.setTableProperties({ stripeColor: '#e8f0fe' })

    expect(tables(quill)[0].style.getPropertyValue('--qlt-table-stripe')).toBe('#e8f0fe')
    expect(quill.getSemanticHTML()).toContain('background-color: #e8f0fe;')
    expect(quill.getSemanticHTML()).not.toContain('--qlt-table-stripe')
  })

  it('goes back to the default color with null', () => {
    const { quill, tableKit } = styledTable()

    tableKit.setTableProperties({ stripeColor: '#e8f0fe' })
    tableKit.setTableProperties({ stripeColor: null })

    expect(tableKit.getTableProperties()?.stripeColor).toBeNull()
    expect(quill.getSemanticHTML()).toContain('background-color: #f6f8fa;')
  })
})

describe('pasting stripes', () => {
  const stripedHTML = (color: string, rowCount: number) => {
    const rows = Array.from({ length: rowCount }, (_row, rowNumber) => {
      const style = rowNumber % 2 === 1 ? ` style="background-color: ${color}"` : ''

      return `<tr><td${style}>a${rowNumber}</td><td${style}>b${rowNumber}</td></tr>`
    })

    return `<table><tbody>${rows.join('')}</tbody></table>`
  }

  it('recognizes stripes in any color', () => {
    const { quill, tableKit } = setup()

    paste(quill, { 'text/html': stripedHTML('#e8f0fe', 4) })
    quill.setSelection(0, 0)

    expect(tableKit.getTableProperties()).toMatchObject({ striped: true, stripeColor: '#e8f0fe' })
    expect(cells(quill).every((cellElement) => !cellElement.style.backgroundColor)).toBe(true)
  })

  it('keeps a single colored row as cell colors', () => {
    const { quill, tableKit } = setup()

    paste(quill, { 'text/html': stripedHTML('#e8f0fe', 2) })
    quill.setSelection(0, 0)

    expect(tableKit.getTableProperties()?.striped).toBe(false)
    expect(cells(quill)[2].style.backgroundColor).toBe('rgb(232, 240, 254)')
  })

  it('keeps colors that are on every row', () => {
    const { quill, tableKit } = setup()

    paste(quill, {
      'text/html':
        '<table><tr><td style="background-color: #ffff00">a</td></tr><tr><td style="background-color: #ffff00">b</td></tr><tr><td style="background-color: #ffff00">c</td></tr><tr><td style="background-color: #ffff00">d</td></tr></table>',
    })
    quill.setSelection(0, 0)

    expect(tableKit.getTableProperties()).toMatchObject({ striped: false, background: '#ffff00' })
  })
})

describe('compact color fields', () => {
  const openTableProperties = (host: HTMLElement) => {
    host.querySelector<HTMLButtonElement>('.qlt-action-bar [aria-label="Table properties"]')?.click()

    return host.querySelector('.qlt-properties') as HTMLElement
  }

  const colorButton = (panel: HTMLElement, label: string) =>
    panel.querySelector<HTMLButtonElement>(`.qlt-color-button[aria-label="${label}"]`) as HTMLButtonElement

  const paletteOf = (button: HTMLButtonElement) =>
    button.closest('.qlt-field')?.querySelector<HTMLElement>('.qlt-palette') as HTMLElement

  it('shows each color as one button and opens one palette at a time', () => {
    const { quill, host } = setupWithTable(2, 2)

    quill.setSelection(0, 0)

    const panel = openTableProperties(host)
    const borderButton = colorButton(panel, 'Border color')
    const backgroundButton = colorButton(panel, 'Background')

    expect(panel.querySelectorAll('.qlt-palette:not([hidden])')).toHaveLength(0)

    borderButton.click()

    expect(paletteOf(borderButton).hidden).toBe(false)
    expect(borderButton.getAttribute('aria-expanded')).toBe('true')

    backgroundButton.click()

    expect(paletteOf(borderButton).hidden).toBe(true)
    expect(paletteOf(backgroundButton).hidden).toBe(false)
  })

  it('closes the palette after a pick and shows the color on the button', () => {
    const { quill, host, tableKit } = setupWithTable(2, 2)

    quill.setSelection(0, 0)

    const panel = openTableProperties(host)
    const borderButton = colorButton(panel, 'Border color')

    borderButton.click()
    paletteOf(borderButton).querySelector<HTMLButtonElement>('[aria-label="#e06666"]')?.click()

    expect(tableKit.getTableProperties()?.borderColor).toBe('#e06666')
    expect(paletteOf(borderButton).hidden).toBe(true)
    expect(borderButton.querySelector<HTMLElement>('.qlt-color-preview')?.style.backgroundColor).toBe(
      'rgb(224, 102, 102)',
    )
    expect(host.querySelector('.qlt-properties')).not.toBeNull()
  })

  it('turns stripes on when a stripe color is picked', () => {
    const { quill, host, tableKit } = setupWithTable(3, 2)

    quill.setSelection(0, 0)

    const panel = openTableProperties(host)
    const stripeButton = colorButton(panel, 'Stripe color')

    stripeButton.click()
    paletteOf(stripeButton).querySelector<HTMLButtonElement>('[aria-label="#cfe2f3"]')?.click()

    expect(tableKit.getTableProperties()).toMatchObject({ striped: true, stripeColor: '#cfe2f3' })
    expect(panel.querySelector<HTMLInputElement>('.qlt-toggle input')?.checked).toBe(true)
    expect(paletteOf(stripeButton).querySelector('[aria-label="Default"]')).not.toBeNull()
  })
})

describe('caption position', () => {
  it('puts the caption under the table and saves it in the HTML', () => {
    const { quill, tableKit } = styledTable()

    tableKit.setTableProperties({ captionSide: 'bottom' })

    expect(tableKit.getTableProperties()?.captionSide).toBe('bottom')
    expect(tables(quill)[0].dataset.captionSide).toBe('bottom')
    expect(quill.getSemanticHTML()).toContain('<caption style="caption-side: bottom;">Sales</caption>')

    tableKit.setTableProperties({ captionSide: 'top' })

    expect(tables(quill)[0].hasAttribute('data-caption-side')).toBe(false)
    expect(quill.getSemanticHTML()).toContain('<caption>Sales</caption>')
  })

  it('keeps a bottom caption when pasted, also from the old align attribute', () => {
    const { quill, tableKit } = setup()

    paste(quill, { 'text/html': '<table><caption align="bottom">Notes</caption><tr><td>a</td></tr></table>' })
    quill.setSelection(0, 0)

    expect(tableKit.getTableProperties()).toMatchObject({ caption: 'Notes', captionSide: 'bottom' })
  })

  it('can be picked next to the caption in the panel', () => {
    const { quill, host, tableKit } = setupWithTable(1, 1)

    quill.setSelection(0, 0)
    host.querySelector<HTMLButtonElement>('.qlt-action-bar [aria-label="Table properties"]')?.click()
    host
      .querySelector<HTMLButtonElement>('.qlt-properties [aria-label="Caption position"] [aria-label="Bottom"]')
      ?.click()

    expect(tableKit.getTableProperties()?.captionSide).toBe('bottom')
  })
})

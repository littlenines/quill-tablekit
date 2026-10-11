import { describe, expect, it } from 'vitest'
import { setupWithTable } from '../helpers'

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

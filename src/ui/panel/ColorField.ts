import { normalizeColor } from '../../model/properties'
import { toSixDigitHex } from '../../utils/style'
import { createElement } from '../dom'

const FALLBACK_PICKER_COLOR = '#000000'

export interface PanelOption {
  value: string | null
  label: string
  color?: string
}

export interface CustomColorLabels {
  pickerLabel: string
  codeLabel: string
}

export interface ColorChoice {
  label: string
  value: string | null
  options: PanelOption[]
  customColor: CustomColorLabels
  emptyPreview?: string
  onChange: (color: string | null) => void
}

export interface ColorControl {
  button: HTMLButtonElement
  palette: HTMLDivElement
  collapse: () => void
}

interface ColorControlSettings {
  chevronIcon: string
  onExpand: (collapse: () => void) => void
  onToggle: () => void
  onChoose?: () => void
}

const showPreview = (preview: HTMLElement, color: string | null, emptyPreview: string | undefined) => {
  const shownColor = color ?? emptyPreview

  preview.style.backgroundColor = shownColor ?? ''
  preview.classList.toggle('qlt-swatch-none', !shownColor)
}

const createCustomColor = (
  currentColor: string | null,
  options: PanelOption[],
  { pickerLabel, codeLabel }: CustomColorLabels,
  applyColor: (color: string) => void,
) => {
  const element = createElement('div', { className: 'qlt-custom-color' })
  const picker = createElement(
    'input',
    { type: 'color', className: 'qlt-color-picker', title: pickerLabel },
    { 'aria-label': pickerLabel },
  )
  const codeInput = createElement(
    'input',
    { type: 'text', className: 'qlt-color-code', placeholder: '#1f6feb', spellcheck: false },
    { 'aria-label': codeLabel },
  )

  const show = (color: string | null, writeCode: boolean) => {
    picker.value = toSixDigitHex(color) ?? FALLBACK_PICKER_COLOR
    codeInput.value = writeCode && color ? color : ''
    codeInput.removeAttribute('aria-invalid')
  }

  const applyCode = () => {
    const typedColor = codeInput.value.trim()

    if (!typedColor) return

    const color = normalizeColor(typedColor)

    if (!color) {
      codeInput.setAttribute('aria-invalid', 'true')
      return
    }

    show(color, true)
    applyColor(color)
  }

  picker.addEventListener('change', () => {
    show(picker.value, true)
    applyColor(picker.value)
  })
  codeInput.addEventListener('input', () => codeInput.removeAttribute('aria-invalid'))
  codeInput.addEventListener('change', applyCode)
  codeInput.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return

    event.preventDefault()
    applyCode()
  })

  const isPaletteColor = options.some((option) => option.value === currentColor)

  show(currentColor, !isPaletteColor)
  element.append(picker, codeInput)

  return { element, show }
}

export const createColorControl = (
  { label, value, options, customColor, emptyPreview, onChange }: ColorChoice,
  { chevronIcon, onExpand, onToggle, onChoose }: ColorControlSettings,
): ColorControl => {
  const preview = createElement('span', { className: 'qlt-color-preview' })
  const button = createElement(
    'button',
    { type: 'button', className: 'qlt-color-button', title: label },
    { 'aria-label': label, 'aria-haspopup': 'true', 'aria-expanded': 'false' },
  )
  const palette = createElement('div', { className: 'qlt-palette', hidden: true })
  const swatchGroup = createElement('div', { className: 'qlt-colors' }, { role: 'group', 'aria-label': label })

  const setExpanded = (isExpanded: boolean) => {
    palette.hidden = !isExpanded
    button.setAttribute('aria-expanded', String(isExpanded))
    onToggle()
  }

  const collapse = () => setExpanded(false)

  const choose = (color: string | null) => {
    for (const [optionIndex, swatch] of swatches.entries()) {
      swatch.setAttribute('aria-pressed', String(options[optionIndex].value === color))
    }

    showPreview(preview, color, emptyPreview)
    onChange(color)
    onChoose?.()
    collapse()
    button.focus()
  }

  const customColorRow = createCustomColor(value, options, customColor, choose)

  const swatches = options.map((option) => {
    const swatch = createElement(
      'button',
      { type: 'button', className: 'qlt-swatch', title: option.label },
      { 'aria-label': option.label, 'aria-pressed': String(option.value === value) },
    )
    const swatchColor = option.color ?? (option.value === null ? emptyPreview : undefined)

    if (swatchColor) swatch.style.backgroundColor = swatchColor
    else swatch.classList.add('qlt-swatch-none')

    swatch.addEventListener('mousedown', (event) => event.preventDefault())
    swatch.addEventListener('click', () => {
      customColorRow.show(option.value, false)
      choose(option.value)
    })

    return swatch
  })

  showPreview(preview, value, emptyPreview)
  button.innerHTML = chevronIcon
  button.prepend(preview)
  button.addEventListener('mousedown', (event) => event.preventDefault())
  button.addEventListener('click', () => {
    const willExpand = palette.hidden === true

    if (willExpand) onExpand(collapse)

    setExpanded(willExpand)
  })
  swatchGroup.append(...swatches)

  const paletteClip = createElement('div', { className: 'qlt-palette-clip' })
  const paletteBody = createElement('div', { className: 'qlt-palette-body' })

  paletteBody.append(swatchGroup, customColorRow.element)
  paletteClip.append(paletteBody)
  palette.append(paletteClip)

  return { button, palette, collapse }
}

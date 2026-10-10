import { normalizeColor } from '../model/properties'
import { toSixDigitHex } from '../utils/style'
import { createElement } from './dom'
import { Popover } from './Popover'

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

export interface PanelField {
  kind: 'colors' | 'choices'
  label: string
  value: string | null
  options: PanelOption[]
  customColor?: CustomColorLabels
  onChange: (value: string | null) => void
}

export class PropertiesPanel {
  readonly popover: Popover

  constructor(container: HTMLElement) {
    this.popover = new Popover(container, 'qlt-properties')
    this.popover.element.setAttribute('role', 'dialog')
  }

  open(
    title: string,
    fields: PanelField[],
    clientX: number,
    clientY: number,
    elementThatDoesNotClose: HTMLElement | null = null,
  ): void {
    this.popover.element.setAttribute('aria-label', title)
    this.popover.element.replaceChildren(
      createElement('div', { className: 'qlt-properties-title', textContent: title }),
      ...fields.map((field) => this.#createField(field)),
    )
    this.popover.open(clientX, clientY, elementThatDoesNotClose)
  }

  close(): void {
    this.popover.close()
  }

  #createField({ kind, label, value, options, customColor, onChange }: PanelField): HTMLDivElement {
    const fieldElement = createElement('div', { className: 'qlt-field' })
    const optionGroup = createElement('div', { className: `qlt-${kind}` }, { role: 'group', 'aria-label': label })
    const customColorRow = customColor && this.#createCustomColor(value, options, customColor, (color) => choose(color))

    const optionButtons = options.map((option) => {
      const optionButton = createElement(
        'button',
        {
          type: 'button',
          className: kind === 'colors' ? 'qlt-swatch' : 'qlt-choice',
          title: option.label,
          textContent: kind === 'colors' ? '' : option.label,
        },
        { 'aria-label': option.label, 'aria-pressed': String(option.value === value) },
      )

      if (option.color) optionButton.style.backgroundColor = option.color
      else if (kind === 'colors') optionButton.classList.add('qlt-swatch-none')

      optionButton.addEventListener('mousedown', (event) => event.preventDefault())
      optionButton.addEventListener('click', () => {
        customColorRow?.show(option.value, false)
        choose(option.value)
      })

      return optionButton
    })

    const choose = (chosenValue: string | null) => {
      for (const [optionIndex, button] of optionButtons.entries()) {
        button.setAttribute('aria-pressed', String(options[optionIndex].value === chosenValue))
      }

      onChange(chosenValue)
    }

    optionGroup.append(...optionButtons)
    fieldElement.append(createElement('div', { className: 'qlt-field-label', textContent: label }), optionGroup)

    if (customColorRow) fieldElement.append(customColorRow.element)

    return fieldElement
  }

  #createCustomColor(
    currentColor: string | null,
    options: PanelOption[],
    { pickerLabel, codeLabel }: CustomColorLabels,
    applyColor: (color: string) => void,
  ) {
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
}

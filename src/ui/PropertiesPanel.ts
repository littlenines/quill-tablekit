import { createColorControl, type ColorChoice, type ColorControl, type PanelOption } from './ColorField'
import { createElement } from './dom'
import { Popover } from './Popover'

export type { ColorChoice, CustomColorLabels, PanelOption } from './ColorField'

export interface ColorsField extends ColorChoice {
  kind: 'colors'
}

export interface ChoicesField {
  kind: 'choices'
  label: string
  value: string
  options: PanelOption[]
  color?: ColorChoice
  onChange: (value: string) => void
}

// Choosing the attached color also turns the toggle on
export interface ToggleField {
  kind: 'toggle'
  label: string
  value: boolean
  color?: ColorChoice
  onChange: (isOn: boolean) => void
}

export interface TextField {
  kind: 'text'
  label: string
  value: string
  onChange: (text: string) => void
}

export type PanelField = ColorsField | ChoicesField | ToggleField | TextField

const fieldLabel = (label: string) => createElement('div', { className: 'qlt-field-label', textContent: label })

const fieldRow = (...children: HTMLElement[]) => {
  const row = createElement('div', { className: 'qlt-field-row' })

  row.append(...children)
  return row
}

export class PropertiesPanel {
  readonly popover: Popover
  #chevronIcon: string
  #collapseOpenPalette: (() => void) | null = null

  constructor(container: HTMLElement, chevronIcon: string) {
    this.popover = new Popover(container, 'qlt-properties')
    this.popover.element.setAttribute('role', 'dialog')
    this.#chevronIcon = chevronIcon
  }

  open(
    title: string,
    fields: PanelField[],
    clientX: number,
    clientY: number,
    elementThatDoesNotClose: HTMLElement | null = null,
  ): void {
    this.#collapseOpenPalette = null
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

  #createField(field: PanelField): HTMLElement {
    if (field.kind === 'colors') return this.#createColorsField(field)
    if (field.kind === 'choices') return this.#createChoicesField(field)
    if (field.kind === 'toggle') return this.#createToggle(field)

    return this.#createTextField(field)
  }

  #colorControl(colorChoice: ColorChoice, onChoose?: () => void): ColorControl {
    return createColorControl(colorChoice, {
      chevronIcon: this.#chevronIcon,
      onExpand: (collapse) => {
        this.#collapseOpenPalette?.()
        this.#collapseOpenPalette = collapse
      },
      onToggle: () => this.popover.refit(),
      onChoose,
    })
  }

  #createColorsField(field: ColorsField): HTMLDivElement {
    const fieldElement = createElement('div', { className: 'qlt-field' })
    const { button, palette } = this.#colorControl(field)

    fieldElement.append(fieldRow(fieldLabel(field.label), button), palette)

    return fieldElement
  }

  #createChoicesField({ label, value, options, color, onChange }: ChoicesField): HTMLDivElement {
    const fieldElement = createElement('div', { className: 'qlt-field' })
    const choiceGroup = createElement('div', { className: 'qlt-choices' }, { role: 'group', 'aria-label': label })
    const colorControl = color && this.#colorControl(color)

    const choiceButtons = options.map((option) => {
      const choiceButton = createElement(
        'button',
        { type: 'button', className: 'qlt-choice', title: option.label, textContent: option.label },
        { 'aria-label': option.label, 'aria-pressed': String(option.value === value) },
      )

      choiceButton.addEventListener('mousedown', (event) => event.preventDefault())
      choiceButton.addEventListener('click', () => {
        for (const button of choiceButtons) button.setAttribute('aria-pressed', String(button === choiceButton))

        onChange(option.value ?? '')
      })

      return choiceButton
    })

    choiceGroup.append(...choiceButtons)
    fieldElement.append(fieldLabel(label), fieldRow(choiceGroup, ...(colorControl ? [colorControl.button] : [])))

    if (colorControl) fieldElement.append(colorControl.palette)

    return fieldElement
  }

  #createToggle({ label, value, color, onChange }: ToggleField): HTMLDivElement {
    const fieldElement = createElement('div', { className: 'qlt-field' })
    const toggleElement = createElement('label', { className: 'qlt-toggle' })
    const checkbox = createElement('input', { type: 'checkbox', checked: value })
    const colorControl =
      color &&
      this.#colorControl(color, () => {
        checkbox.checked = true
      })

    checkbox.addEventListener('change', () => onChange(checkbox.checked))
    toggleElement.append(checkbox, createElement('span', { textContent: label }))
    fieldElement.append(fieldRow(toggleElement, ...(colorControl ? [colorControl.button] : [])))

    if (colorControl) fieldElement.append(colorControl.palette)

    return fieldElement
  }

  #createTextField({ label, value, onChange }: TextField): HTMLLabelElement {
    const fieldElement = createElement('label', { className: 'qlt-field' })
    const textInput = createElement('input', { type: 'text', className: 'qlt-text-input', value })

    textInput.addEventListener('change', () => onChange(textInput.value))
    textInput.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return

      event.preventDefault()
      onChange(textInput.value)
    })
    fieldElement.append(fieldLabel(label), textInput)

    return fieldElement
  }
}

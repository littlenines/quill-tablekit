import { createColorControl, type ColorChoice, type ColorControl, type PanelOption } from './ColorField'
import { createElement } from './dom'
import { Popover } from './Popover'

export type { ColorChoice, CustomColorLabels, PanelOption } from './ColorField'

export interface ColorsField extends ColorChoice {
  kind: 'colors'
}

export interface ChoiceGroup {
  label: string
  value: string
  options: PanelOption[]
  onChange: (value: string) => void
}

export interface ChoicesField extends ChoiceGroup {
  kind: 'choices'
  color?: ColorChoice
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
  choices?: ChoiceGroup
  onChange: (text: string) => void
}

export type PanelField = ColorsField | ChoicesField | ToggleField | TextField

const PALETTE_MOTION_MS = 200

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
  #refitFrame = 0

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
      onToggle: () => this.#refitWhilePaletteMoves(),
      onChoose,
    })
  }

  // The palette grows and shrinks over a few frames, and the panel has to stay inside the editor the whole time
  #refitWhilePaletteMoves(): void {
    cancelAnimationFrame(this.#refitFrame)

    const stopAt = performance.now() + PALETTE_MOTION_MS + 50

    const refit = () => {
      this.popover.refit()

      if (performance.now() < stopAt) this.#refitFrame = requestAnimationFrame(refit)
    }

    refit()
  }

  #createColorsField(field: ColorsField): HTMLDivElement {
    const fieldElement = createElement('div', { className: 'qlt-field' })
    const { button, palette } = this.#colorControl(field)

    fieldElement.append(fieldRow(fieldLabel(field.label), button), palette)

    return fieldElement
  }

  #createChoicesField(field: ChoicesField): HTMLDivElement {
    const fieldElement = createElement('div', { className: 'qlt-field' })
    const colorControl = field.color && this.#colorControl(field.color)

    fieldElement.append(
      fieldLabel(field.label),
      fieldRow(this.#choiceGroup(field), ...(colorControl ? [colorControl.button] : [])),
    )

    if (colorControl) fieldElement.append(colorControl.palette)

    return fieldElement
  }

  #choiceGroup({ label, value, options, onChange }: ChoiceGroup): HTMLDivElement {
    const choiceGroup = createElement('div', { className: 'qlt-choices' }, { role: 'group', 'aria-label': label })

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

    return choiceGroup
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

  #createTextField({ label, value, choices, onChange }: TextField): HTMLDivElement {
    const fieldElement = createElement('div', { className: 'qlt-field' })
    const textInput = createElement(
      'input',
      { type: 'text', className: 'qlt-text-input', value },
      { 'aria-label': label },
    )

    textInput.addEventListener('change', () => onChange(textInput.value))
    textInput.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return

      event.preventDefault()
      onChange(textInput.value)
    })
    fieldElement.append(fieldLabel(label), fieldRow(textInput, ...(choices ? [this.#choiceGroup(choices)] : [])))

    return fieldElement
  }
}

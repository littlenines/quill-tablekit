import type { ResolvedTableKitOptions } from '../config/options'
import { createElement } from './dom'
import { Popover } from './Popover'

const ARROW_KEY_STEPS: Record<string, [rowStep: number, columnStep: number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
}

const DEFAULT_CUSTOM_SIZE = '3'

const clamp = (number: number, min: number, max: number) => Math.min(max, Math.max(min, number))

export class TablePicker {
  readonly popover: Popover
  #options: ResolvedTableKitOptions
  #onSelect: (rowCount: number, columnCount: number) => void
  #gridButtons: HTMLButtonElement[] = []
  #sizeLabel: HTMLDivElement
  #rowsInput: HTMLInputElement
  #columnsInput: HTMLInputElement

  constructor(
    container: HTMLElement,
    options: ResolvedTableKitOptions,
    onSelect: (rowCount: number, columnCount: number) => void,
  ) {
    this.#options = options
    this.#onSelect = onSelect

    const { labels, pickerRows, pickerColumns, maxRows, maxColumns } = options

    this.popover = new Popover(container, 'qlt-picker')
    this.popover.element.setAttribute('role', 'dialog')
    this.popover.element.setAttribute('aria-label', labels.insertTable)

    const grid = createElement('div', { className: 'qlt-picker-grid' })

    grid.style.gridTemplateColumns = `repeat(${pickerColumns}, 1fr)`

    for (let rowCount = 1; rowCount <= pickerRows; rowCount++) {
      for (let columnCount = 1; columnCount <= pickerColumns; columnCount++) {
        grid.append(this.#createGridButton(rowCount, columnCount))
      }
    }

    grid.addEventListener('mouseleave', () => this.#highlightSize(0, 0))

    this.#sizeLabel = createElement('div', { className: 'qlt-picker-label', textContent: labels.insertTable })
    this.#rowsInput = this.#createNumberInput(labels.rowsInput, maxRows)
    this.#columnsInput = this.#createNumberInput(labels.columnsInput, maxColumns)

    const customSizeForm = createElement(
      'form',
      { className: 'qlt-picker-custom' },
      { 'aria-label': labels.customSize },
    )

    customSizeForm.append(
      this.#rowsInput,
      createElement('span', { className: 'qlt-picker-times', textContent: '×' }),
      this.#columnsInput,
      createElement('button', { type: 'submit', className: 'qlt-button', textContent: labels.insertButton }),
    )
    customSizeForm.addEventListener('submit', (event) => {
      event.preventDefault()
      this.#choose(
        this.#readNumberInput(this.#rowsInput, maxRows),
        this.#readNumberInput(this.#columnsInput, maxColumns),
      )
    })

    this.popover.element.append(grid, this.#sizeLabel, customSizeForm)
  }

  open(toolbarButton: HTMLElement): void {
    const { left, bottom } = toolbarButton.getBoundingClientRect()

    this.#rowsInput.value = DEFAULT_CUSTOM_SIZE
    this.#columnsInput.value = DEFAULT_CUSTOM_SIZE
    this.#highlightSize(0, 0)
    this.popover.open(left, bottom + 4, toolbarButton)
  }

  close(): void {
    this.popover.close()
  }

  #createGridButton(rowCount: number, columnCount: number): HTMLButtonElement {
    const isFirstButton = rowCount === 1 && columnCount === 1
    const gridButton = createElement(
      'button',
      { type: 'button', className: 'qlt-picker-cell', tabIndex: isFirstButton ? 0 : -1 },
      {
        'aria-label': `${rowCount} × ${columnCount}`,
        'data-rows': String(rowCount),
        'data-columns': String(columnCount),
      },
    )

    gridButton.addEventListener('mousedown', (event) => event.preventDefault())
    gridButton.addEventListener('mouseenter', () => this.#highlightSize(rowCount, columnCount))
    gridButton.addEventListener('focus', () => this.#highlightSize(rowCount, columnCount))
    gridButton.addEventListener('click', () => this.#choose(rowCount, columnCount))
    gridButton.addEventListener('keydown', (event) => this.#moveFocusWithArrows(event, rowCount, columnCount))
    this.#gridButtons.push(gridButton)

    return gridButton
  }

  #createNumberInput(label: string, max: number): HTMLInputElement {
    return createElement(
      'input',
      { type: 'number', className: 'qlt-picker-input', min: '1', max: String(max), required: true, title: label },
      { 'aria-label': label },
    )
  }

  #readNumberInput(input: HTMLInputElement, max: number): number {
    const enteredNumber = Number.parseInt(input.value, 10)

    return clamp(Number.isFinite(enteredNumber) ? enteredNumber : 1, 1, max)
  }

  #highlightSize(rowCount: number, columnCount: number): void {
    for (const gridButton of this.#gridButtons) {
      const isInsideSize =
        Number(gridButton.dataset.rows) <= rowCount && Number(gridButton.dataset.columns) <= columnCount

      gridButton.classList.toggle('is-active', isInsideSize)
    }

    this.#sizeLabel.textContent = rowCount > 0 ? `${rowCount} × ${columnCount}` : this.#options.labels.insertTable
  }

  #choose(rowCount: number, columnCount: number): void {
    this.close()
    this.#onSelect(rowCount, columnCount)
  }

  #moveFocusWithArrows(event: KeyboardEvent, rowCount: number, columnCount: number): void {
    const arrowStep = ARROW_KEY_STEPS[event.key]

    if (!arrowStep) return

    event.preventDefault()

    const [rowStep, columnStep] = arrowStep
    const { pickerRows, pickerColumns } = this.#options
    const nextRowCount = clamp(rowCount + rowStep, 1, pickerRows)
    const nextColumnCount = clamp(columnCount + columnStep, 1, pickerColumns)
    const nextButton = this.#gridButtons[(nextRowCount - 1) * pickerColumns + (nextColumnCount - 1)]

    for (const gridButton of this.#gridButtons) gridButton.tabIndex = gridButton === nextButton ? 0 : -1

    nextButton.focus()
  }
}

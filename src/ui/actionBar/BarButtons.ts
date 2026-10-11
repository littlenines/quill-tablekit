import type { TableKitLabels } from '../../config/labels'
import type { TableKitIcons, TableMenuItemName } from '../../config/options'
import { createElement } from '../dom'
import { TOGGLE_ATTRIBUTES, type ButtonSpec } from './buttonSpecs'
import type { RovingFocus } from './rovingFocus'

export interface ActionBarHandlers {
  openItems: (itemNames: TableMenuItemName[], anchor: HTMLElement) => void
  runItem: (itemName: TableMenuItemName, anchor: HTMLElement) => void
  isOpenFrom: (anchor: HTMLElement) => boolean
  isAnythingOpen: () => boolean
  closeAll: () => void
  focusOpened: () => void
  onMoved: () => void
}

interface BarButtonSettings {
  labels: TableKitLabels
  icons: TableKitIcons
  handlers: ActionBarHandlers
  rovingFocus: RovingFocus
}

export class BarButtons {
  #labels: TableKitLabels
  #icons: TableKitIcons
  #handlers: ActionBarHandlers
  #rovingFocus: RovingFocus
  #mergeButton: HTMLButtonElement | null = null
  #toggleButtons: [button: HTMLButtonElement, tableAttribute: string][] = []

  constructor({ labels, icons, handlers, rovingFocus }: BarButtonSettings) {
    this.#labels = labels
    this.#icons = icons
    this.#handlers = handlers
    this.#rovingFocus = rovingFocus
  }

  create(spec: ButtonSpec, menu: TableMenuItemName[]): HTMLElement {
    if (spec.kind === 'separator') return createElement('span', { className: 'qlt-action-separator' })

    const button = createElement('button', { type: 'button', className: 'qlt-action-button' })

    button.addEventListener('mousedown', (event) => event.preventDefault())

    if (spec.kind === 'items') {
      const visibleItems = spec.items.filter((item) => menu.includes(item))

      this.#describe(button, this.#labels[spec.label], `${this.#icons[spec.icon]}${this.#icons.chevron}`)
      button.setAttribute('aria-haspopup', 'menu')
      button.addEventListener('click', (event) =>
        this.#toggle(button, event, () => this.#handlers.openItems(visibleItems, button)),
      )
    } else if (spec.kind === 'item') {
      this.#describe(button, this.#labels[spec.item], this.#icons[spec.icon])
      button.classList.toggle('is-danger', spec.danger === true)
      button.addEventListener('click', (event) =>
        this.#toggle(button, event, () => this.#handlers.runItem(spec.item, button)),
      )

      const tableAttribute = TOGGLE_ATTRIBUTES[spec.item]

      if (tableAttribute) {
        this.#toggleButtons.push([button, tableAttribute])
        button.setAttribute('aria-pressed', 'false')
      }
    } else {
      this.#mergeButton = button
      button.addEventListener('click', () => {
        const itemName = button.dataset.action === 'split' ? 'splitCell' : 'mergeCells'

        this.#handlers.runItem(itemName, button)
      })
    }

    return button
  }

  showTableState(tableElement: HTMLTableElement, spansSeveralCells: boolean, isMergedCell: boolean): void {
    this.#showMergeState(spansSeveralCells, isMergedCell)

    for (const [button, tableAttribute] of this.#toggleButtons) {
      button.setAttribute('aria-pressed', String(tableElement.hasAttribute(tableAttribute)))
    }
  }

  #describe(button: HTMLButtonElement, label: string, iconMarkup: string): void {
    button.innerHTML = iconMarkup
    button.setAttribute('aria-label', label)
    button.dataset.tooltip = label
  }

  #toggle(button: HTMLButtonElement, event: MouseEvent, open: () => void): void {
    if (this.#handlers.isOpenFrom(button)) {
      this.#handlers.closeAll()
      return
    }

    open()

    const isKeyboardClick = event.detail === 0

    if (isKeyboardClick && this.#handlers.isOpenFrom(button)) this.#handlers.focusOpened()
  }

  // The same button merges a selection, or splits the merged cell the cursor is in
  #showMergeState(spansSeveralCells: boolean, isMergedCell: boolean): void {
    const button = this.#mergeButton

    if (!button) return

    const showsSplit = !spansSeveralCells && isMergedCell
    const action = showsSplit ? 'split' : 'merge'

    if (button.dataset.action !== action) {
      button.dataset.action = action
      this.#describe(
        button,
        showsSplit ? this.#labels.splitCell : this.#labels.mergeCells,
        showsSplit ? this.#icons.split : this.#icons.merge,
      )
    }

    button.disabled = !spansSeveralCells && !isMergedCell

    if (button.disabled && button.tabIndex === 0) this.#rovingFocus.makeFocusable(this.#rovingFocus.enabledButtons()[0])
  }
}

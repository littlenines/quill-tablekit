import type Quill from 'quill'
import type { Range } from 'quill'
import type { ResolvedTableKitOptions, TableKitIcons, TableKitLabels, TableMenuItemName } from '../config/options'
import { lastSelectedLine, lineAt, tableOf } from '../editing/selection'
import { createElement } from './dom'
import { scaleOf, toContainerPosition } from './domGrid'

const GAP = 6

export interface ActionBarHandlers {
  openItems: (itemNames: TableMenuItemName[], anchor: HTMLElement) => void
  runItem: (itemName: TableMenuItemName, anchor: HTMLElement) => void
  isOpenFrom: (anchor: HTMLElement) => boolean
  isAnythingOpen: () => boolean
  closeAll: () => void
  focusOpened: () => void
  onMoved: () => void
}

type ButtonSpec =
  | { kind: 'items'; label: keyof TableKitLabels; icon: keyof TableKitIcons; items: TableMenuItemName[] }
  | { kind: 'item'; item: TableMenuItemName; icon: keyof TableKitIcons; danger?: boolean }
  | { kind: 'merge' }
  | { kind: 'separator' }

const BUTTON_SPECS: ButtonSpec[] = [
  {
    kind: 'items',
    label: 'rowsGroup',
    icon: 'rows',
    items: [
      'insertRowAbove',
      'insertRowBelow',
      'moveRowUp',
      'moveRowDown',
      'duplicateRow',
      'equalRowHeights',
      'selectRow',
      'deleteRow',
    ],
  },
  {
    kind: 'items',
    label: 'columnsGroup',
    icon: 'columns',
    items: [
      'insertColumnLeft',
      'insertColumnRight',
      'moveColumnLeft',
      'moveColumnRight',
      'duplicateColumn',
      'equalColumnWidths',
      'fitToContent',
      'selectColumn',
      'deleteColumn',
    ],
  },
  { kind: 'merge' },
  { kind: 'separator' },
  { kind: 'item', item: 'headerRow', icon: 'headerRow' },
  { kind: 'item', item: 'headerColumn', icon: 'headerColumn' },
  { kind: 'item', item: 'cellProperties', icon: 'cellProperties' },
  { kind: 'item', item: 'tableProperties', icon: 'tableProperties' },
  { kind: 'separator' },
  {
    kind: 'items',
    label: 'moreGroup',
    icon: 'more',
    items: ['insertParagraphAbove', 'insertParagraphBelow', 'fitToWidth', 'copyTable'],
  },
  { kind: 'item', item: 'deleteTable', icon: 'deleteTable', danger: true },
]

const isAllowed = (spec: ButtonSpec, menu: TableMenuItemName[]): boolean => {
  if (spec.kind === 'items') return spec.items.some((item) => menu.includes(item))
  if (spec.kind === 'item') return menu.includes(spec.item)
  if (spec.kind === 'merge') return menu.includes('mergeCells') || menu.includes('splitCell')

  return true
}

const withoutLooseSeparators = (specs: ButtonSpec[]): ButtonSpec[] => {
  const keptSpecs: ButtonSpec[] = []

  for (const spec of specs) {
    const previous = keptSpecs.at(-1)

    if (spec.kind === 'separator' && (!previous || previous.kind === 'separator')) continue

    keptSpecs.push(spec)
  }

  if (keptSpecs.at(-1)?.kind === 'separator') keptSpecs.pop()

  return keptSpecs
}

const TOGGLE_ATTRIBUTES: Partial<Record<TableMenuItemName, string>> = {
  headerRow: 'data-header',
  headerColumn: 'data-header-column',
}

const NEXT_BUTTON_KEYS: Record<string, (position: number, count: number) => number> = {
  ArrowRight: (position, count) => (position + 1) % count,
  ArrowLeft: (position, count) => (position - 1 + count) % count,
  Home: () => 0,
  End: (_position, count) => count - 1,
}

const fitsOnScreen = (top: number, height: number, visibleTop: number, visibleBottom: number) =>
  top >= visibleTop && top + height <= visibleBottom

export class ActionBar {
  #quill: Quill
  #container: HTMLElement
  #labels: TableKitLabels
  #icons: TableKitIcons
  #handlers: ActionBarHandlers
  #bar: HTMLDivElement
  #mergeButton: HTMLButtonElement | null = null
  #toggleButtons: [button: HTMLButtonElement, tableAttribute: string][] = []
  #tableElement: HTMLTableElement | null = null
  #activeCell: HTMLTableCellElement | null = null
  #dismissedCell: HTMLTableCellElement | null = null
  #frameId = 0

  constructor(
    quill: Quill,
    container: HTMLElement,
    { labels, menu, icons }: Pick<ResolvedTableKitOptions, 'labels' | 'menu' | 'icons'>,
    handlers: ActionBarHandlers,
    signal: AbortSignal,
  ) {
    this.#quill = quill
    this.#container = container
    this.#labels = labels
    this.#icons = icons
    this.#handlers = handlers
    this.#bar = createElement(
      'div',
      { className: 'qlt-action-bar' },
      { role: 'toolbar', 'aria-label': labels.actionBar, 'aria-keyshortcuts': 'Alt+F10' },
    )

    const allowedSpecs = withoutLooseSeparators(BUTTON_SPECS.filter((spec) => isAllowed(spec, menu)))

    this.#bar.append(...allowedSpecs.map((spec) => this.#createButton(spec, menu)))
    this.#bar.addEventListener('keydown', (event) => this.#handleBarKeydown(event), { signal })
    this.#makeFocusable(this.#buttons()[0])
    container.append(this.#bar)

    const repositionSoon = () => this.#repositionSoon()
    const listenerOptions = { signal, passive: true }

    container.addEventListener('scroll', repositionSoon, listenerOptions)
    quill.root.addEventListener('scroll', repositionSoon, listenerOptions)
    window.addEventListener('scroll', repositionSoon, { ...listenerOptions, capture: true })
    window.addEventListener('resize', repositionSoon, listenerOptions)
    quill.root.addEventListener('keydown', (event) => this.#handleEditorKeydown(event), { signal })
    signal.addEventListener('abort', () => {
      cancelAnimationFrame(this.#frameId)
      this.#bar.remove()
    })
  }

  get element(): HTMLDivElement {
    return this.#bar
  }

  update(range: Range | null): void {
    const startLine = range && this.#quill.isEnabled() ? lineAt(this.#quill, range.index) : null
    const tableBlot = startLine && tableOf(startLine)

    if (!range || !startLine || !tableBlot) {
      const keepsFocus = this.#handlers.isAnythingOpen() || this.#bar.contains(document.activeElement)

      if (!range && keepsFocus) return

      this.hide()
      return
    }

    const tableElement = tableBlot.domNode as HTMLTableElement
    const endLine = lastSelectedLine(this.#quill, range)
    const spansSeveralCells = endLine != null && endLine.cellValue.cell !== startLine.cellValue.cell
    const startCellElement = (startLine.domNode as HTMLElement).closest('td')
    const isMergedCell = startCellElement != null && (startCellElement.rowSpan > 1 || startCellElement.colSpan > 1)

    if (this.#dismissedCell && this.#dismissedCell === startCellElement) return

    const movedToAnotherCell = this.#bar.style.display === 'flex' && this.#activeCell !== startCellElement

    this.#dismissedCell = null
    this.#activeCell = startCellElement
    this.#tableElement = tableElement
    this.#showMergeState(spansSeveralCells, isMergedCell)

    for (const [button, tableAttribute] of this.#toggleButtons) {
      button.setAttribute('aria-pressed', String(tableElement.hasAttribute(tableAttribute)))
    }

    this.#bar.style.display = 'flex'
    this.#reposition(movedToAnotherCell && !this.#handlers.isAnythingOpen())
  }

  hide(): void {
    this.#tableElement = null
    this.#bar.style.display = 'none'
  }

  focus(): void {
    const focusableButton = this.#buttons().find((button) => button.tabIndex === 0) ?? this.#buttons()[0]

    focusableButton?.focus()
  }

  #handleEditorKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || this.#bar.style.display !== 'flex') return

    if (event.key === 'F10' && event.altKey) {
      event.preventDefault()
      this.focus()
    } else if (event.key === 'Escape') {
      this.#dismissedCell = this.#activeCell
      this.hide()
    }
  }

  #handleBarKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented) return

    if (event.key === 'Escape') {
      event.preventDefault()
      this.#quill.focus()
      return
    }

    const nextPosition = NEXT_BUTTON_KEYS[event.key]
    const buttons = this.#buttons()
    const focusedPosition = buttons.indexOf(document.activeElement as HTMLButtonElement)

    if (!nextPosition || focusedPosition < 0) return

    event.preventDefault()

    const nextButton = buttons[nextPosition(focusedPosition, buttons.length)]

    this.#makeFocusable(nextButton)
    nextButton.focus()
  }

  #buttons(): HTMLButtonElement[] {
    return [...this.#bar.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')]
  }

  #makeFocusable(focusableButton: HTMLButtonElement | undefined): void {
    for (const button of this.#bar.querySelectorAll('button')) button.tabIndex = button === focusableButton ? 0 : -1
  }

  #createButton(spec: ButtonSpec, menu: TableMenuItemName[]): HTMLElement {
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

    if (button.disabled && button.tabIndex === 0) this.#makeFocusable(this.#buttons()[0])
  }

  #activeRowBox(): { top: number; bottom: number } | null {
    const cellElement = this.#activeCell?.isConnected ? this.#activeCell : null
    const rowElement = cellElement?.parentElement

    if (!cellElement || !rowElement) return null

    const cellBox = cellElement.getBoundingClientRect()
    const rowBox = rowElement.getBoundingClientRect()
    const isFirstRow = rowElement.previousElementSibling == null
    const captionTop = isFirstRow && this.#tableElement ? this.#tableElement.getBoundingClientRect().top : Infinity

    return { top: Math.min(cellBox.top, rowBox.top, captionTop), bottom: Math.max(cellBox.bottom, rowBox.bottom) }
  }

  #repositionSoon(): void {
    if (!this.#tableElement || this.#frameId) return

    this.#frameId = requestAnimationFrame(() => {
      this.#frameId = 0
      this.#reposition()
    })
  }

  #reposition(animate = false): void {
    const tableElement = this.#tableElement

    if (!tableElement?.isConnected) {
      this.hide()
      return
    }

    const containerBox = this.#container.getBoundingClientRect()
    const tableBox = tableElement.getBoundingClientRect()
    const clipsOverflow = getComputedStyle(this.#container).overflowY !== 'visible'
    const visibleTop = Math.max(containerBox.top, 0)
    const visibleBottom = Math.min(clipsOverflow ? containerBox.bottom : Infinity, window.innerHeight)
    const scale = scaleOf(this.#container)
    const barWidth = this.#bar.offsetWidth * scale
    const barHeight = this.#bar.offsetHeight * scale
    const gap = GAP * scale
    const isTableVisible = tableBox.bottom > visibleTop && tableBox.top < visibleBottom

    this.#bar.style.visibility = isTableVisible ? '' : 'hidden'

    const fits = (top: number) => fitsOnScreen(top, barHeight, visibleTop, visibleBottom)
    const rowBox = this.#activeRowBox() ?? tableBox
    const aboveRow = rowBox.top - barHeight - gap
    const belowRow = rowBox.bottom + gap
    const nearestEdgeTop = rowBox.top >= visibleBottom ? visibleBottom - barHeight - gap : visibleTop + gap
    const clientTop = [aboveRow, belowRow].find(fits) ?? nearestEdgeTop
    const cellLeft = this.#activeCell?.isConnected ? this.#activeCell.getBoundingClientRect().left : tableBox.left
    const maxLeft = containerBox.left + this.#container.clientWidth * scale - barWidth - gap
    const clientLeft = Math.max(containerBox.left + gap, Math.min(cellLeft, maxLeft))
    const { left, top } = toContainerPosition(this.#container, clientLeft, clientTop)
    const hasMoved = this.#bar.style.left !== `${left}px` || this.#bar.style.top !== `${top}px`

    this.#bar.classList.toggle('is-following', animate)
    this.#bar.style.left = `${left}px`
    this.#bar.style.top = `${top}px`

    if (hasMoved) this.#handlers.onMoved()
  }
}

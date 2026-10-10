import type Quill from 'quill'
import type { Range } from 'quill'
import type { ResolvedTableKitOptions, TableKitLabels, TableMenuItemName } from '../config/options'
import { lastSelectedLine, lineAt, tableOf } from '../editing/selection'
import { createElement } from './dom'
import { toContainerPosition } from './domGrid'
import { ICONS } from './icons'

const GAP = 6

export interface ActionBarHandlers {
  openItems: (itemNames: TableMenuItemName[], anchor: HTMLElement) => void
  runItem: (itemName: TableMenuItemName, anchor: HTMLElement) => void
  isOpenFrom: (anchor: HTMLElement) => boolean
  isAnythingOpen: () => boolean
  closeAll: () => void
  onMoved: () => void
}

type ButtonSpec =
  | { kind: 'items'; label: keyof TableKitLabels; icon: string; items: TableMenuItemName[] }
  | { kind: 'item'; item: TableMenuItemName; icon: string; danger?: boolean }
  | { kind: 'merge' }
  | { kind: 'separator' }

const BUTTON_SPECS: ButtonSpec[] = [
  {
    kind: 'items',
    label: 'rowsGroup',
    icon: ICONS.rows,
    items: ['insertRowAbove', 'insertRowBelow', 'selectRow', 'deleteRow'],
  },
  {
    kind: 'items',
    label: 'columnsGroup',
    icon: ICONS.columns,
    items: ['insertColumnLeft', 'insertColumnRight', 'selectColumn', 'deleteColumn'],
  },
  { kind: 'merge' },
  { kind: 'separator' },
  { kind: 'item', item: 'headerRow', icon: ICONS.headerRow },
  { kind: 'item', item: 'cellProperties', icon: ICONS.cellProperties },
  { kind: 'item', item: 'tableProperties', icon: ICONS.tableProperties },
  { kind: 'separator' },
  {
    kind: 'items',
    label: 'moreGroup',
    icon: ICONS.more,
    items: ['insertParagraphAbove', 'insertParagraphBelow', 'copyTable'],
  },
  { kind: 'item', item: 'deleteTable', icon: ICONS.deleteTable, danger: true },
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

const fitsOnScreen = (top: number, height: number, visibleTop: number, visibleBottom: number) =>
  top >= visibleTop && top + height <= visibleBottom

export class ActionBar {
  #quill: Quill
  #container: HTMLElement
  #labels: TableKitLabels
  #handlers: ActionBarHandlers
  #bar: HTMLDivElement
  #mergeButton: HTMLButtonElement | null = null
  #headerButton: HTMLButtonElement | null = null
  #tableElement: HTMLTableElement | null = null
  #activeCell: HTMLTableCellElement | null = null
  #dismissedCell: HTMLTableCellElement | null = null
  #frameId = 0

  constructor(
    quill: Quill,
    container: HTMLElement,
    { labels, menu }: Pick<ResolvedTableKitOptions, 'labels' | 'menu'>,
    handlers: ActionBarHandlers,
    signal: AbortSignal,
  ) {
    this.#quill = quill
    this.#container = container
    this.#labels = labels
    this.#handlers = handlers
    this.#bar = createElement(
      'div',
      { className: 'qlt-action-bar' },
      { role: 'toolbar', 'aria-label': labels.actionBar },
    )

    const allowedSpecs = withoutLooseSeparators(BUTTON_SPECS.filter((spec) => isAllowed(spec, menu)))

    this.#bar.append(...allowedSpecs.map((spec) => this.#createButton(spec, menu)))
    container.append(this.#bar)

    const repositionSoon = () => this.#repositionSoon()
    const listenerOptions = { signal, passive: true }

    container.addEventListener('scroll', repositionSoon, listenerOptions)
    quill.root.addEventListener('scroll', repositionSoon, listenerOptions)
    window.addEventListener('scroll', repositionSoon, { ...listenerOptions, capture: true })
    window.addEventListener('resize', repositionSoon, listenerOptions)
    quill.root.addEventListener('keydown', (event) => this.#dismissOnEscape(event), { signal })
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
      if (!range && this.#handlers.isAnythingOpen()) return

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
    this.#headerButton?.setAttribute('aria-pressed', String(tableElement.hasAttribute('data-header')))
    this.#bar.style.display = 'flex'
    this.#reposition(movedToAnotherCell && !this.#handlers.isAnythingOpen())
  }

  hide(): void {
    this.#tableElement = null
    this.#bar.style.display = 'none'
  }

  #dismissOnEscape(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || event.defaultPrevented || this.#bar.style.display !== 'flex') return

    this.#dismissedCell = this.#activeCell
    this.hide()
  }

  #createButton(spec: ButtonSpec, menu: TableMenuItemName[]): HTMLElement {
    if (spec.kind === 'separator') return createElement('span', { className: 'qlt-action-separator' })

    const button = createElement('button', { type: 'button', className: 'qlt-action-button' })

    button.addEventListener('mousedown', (event) => event.preventDefault())

    if (spec.kind === 'items') {
      const visibleItems = spec.items.filter((item) => menu.includes(item))

      this.#describe(button, this.#labels[spec.label], `${spec.icon}${ICONS.chevron}`)
      button.setAttribute('aria-haspopup', 'menu')
      button.addEventListener('click', () => this.#toggle(button, () => this.#handlers.openItems(visibleItems, button)))
    } else if (spec.kind === 'item') {
      this.#describe(button, this.#labels[spec.item], spec.icon)
      button.classList.toggle('is-danger', spec.danger === true)
      button.addEventListener('click', () => this.#toggle(button, () => this.#handlers.runItem(spec.item, button)))

      if (spec.item === 'headerRow') {
        this.#headerButton = button
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

  #toggle(button: HTMLButtonElement, open: () => void): void {
    if (this.#handlers.isOpenFrom(button)) this.#handlers.closeAll()
    else open()
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
        showsSplit ? ICONS.split : ICONS.merge,
      )
    }

    button.disabled = !spansSeveralCells && !isMergedCell
  }

  #activeRowBox(): { top: number; bottom: number } | null {
    const cellElement = this.#activeCell?.isConnected ? this.#activeCell : null
    const rowElement = cellElement?.parentElement

    if (!cellElement || !rowElement) return null

    const cellBox = cellElement.getBoundingClientRect()
    const rowBox = rowElement.getBoundingClientRect()

    return { top: Math.min(cellBox.top, rowBox.top), bottom: Math.max(cellBox.bottom, rowBox.bottom) }
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
    const { offsetWidth: barWidth, offsetHeight: barHeight } = this.#bar
    const isTableVisible = tableBox.bottom > visibleTop && tableBox.top < visibleBottom

    this.#bar.style.visibility = isTableVisible ? '' : 'hidden'

    const fits = (top: number) => fitsOnScreen(top, barHeight, visibleTop, visibleBottom)
    const rowBox = this.#activeRowBox() ?? tableBox
    const aboveRow = rowBox.top - barHeight - GAP
    const belowRow = rowBox.bottom + GAP
    const nearestEdgeTop = rowBox.top >= visibleBottom ? visibleBottom - barHeight - GAP : visibleTop + GAP
    const clientTop = [aboveRow, belowRow].find(fits) ?? nearestEdgeTop
    const cellLeft = this.#activeCell?.isConnected ? this.#activeCell.getBoundingClientRect().left : tableBox.left
    const maxLeft = containerBox.left + this.#container.clientWidth - barWidth - GAP
    const clientLeft = Math.max(containerBox.left + GAP, Math.min(cellLeft, maxLeft))
    const { left, top } = toContainerPosition(this.#container, clientLeft, clientTop)
    const hasMoved = this.#bar.style.left !== `${left}px` || this.#bar.style.top !== `${top}px`

    this.#bar.classList.toggle('is-following', animate)
    this.#bar.style.left = `${left}px`
    this.#bar.style.top = `${top}px`

    if (hasMoved) this.#handlers.onMoved()
  }
}

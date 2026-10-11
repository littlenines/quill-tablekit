import type Quill from 'quill'
import type { Range } from 'quill'
import type { ResolvedTableKitOptions } from '../../config/options'
import { lastSelectedLine, lineAt, tableOf } from '../../editing/selection'
import { createElement } from '../dom'
import { barPosition } from './barPosition'
import { BarButtons, type ActionBarHandlers } from './BarButtons'
import { allowedButtonSpecs } from './buttonSpecs'
import { RovingFocus } from './rovingFocus'

export type { ActionBarHandlers } from './BarButtons'

export class ActionBar {
  #quill: Quill
  #container: HTMLElement
  #handlers: ActionBarHandlers
  #bar: HTMLDivElement
  #rovingFocus: RovingFocus
  #buttons: BarButtons
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
    this.#handlers = handlers
    this.#bar = createElement(
      'div',
      { className: 'qlt-action-bar' },
      { role: 'toolbar', 'aria-label': labels.actionBar, 'aria-keyshortcuts': 'Alt+F10' },
    )
    this.#rovingFocus = new RovingFocus(this.#bar)
    this.#buttons = new BarButtons({ labels, icons, handlers, rovingFocus: this.#rovingFocus })
    this.#bar.append(...allowedButtonSpecs(menu).map((spec) => this.#buttons.create(spec, menu)))
    this.#bar.addEventListener('keydown', (event) => this.#handleBarKeydown(event), { signal })
    this.#rovingFocus.makeFocusable(this.#rovingFocus.enabledButtons()[0])
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
    this.#buttons.showTableState(tableElement, spansSeveralCells, isMergedCell)
    this.#bar.style.display = 'flex'
    this.#reposition(movedToAnotherCell && !this.#handlers.isAnythingOpen())
  }

  hide(): void {
    this.#tableElement = null
    this.#bar.style.display = 'none'
  }

  focus(): void {
    this.#rovingFocus.focus()
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

    this.#rovingFocus.moveWithKey(event)
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

    const activeCell = this.#activeCell?.isConnected ? this.#activeCell : null
    const { left, top, isTableVisible } = barPosition(this.#container, this.#bar, tableElement, activeCell)
    const hasMoved = this.#bar.style.left !== `${left}px` || this.#bar.style.top !== `${top}px`

    this.#bar.style.visibility = isTableVisible ? '' : 'hidden'
    this.#bar.classList.toggle('is-following', animate)
    this.#bar.style.left = `${left}px`
    this.#bar.style.top = `${top}px`

    if (hasMoved) this.#handlers.onMoved()
  }
}

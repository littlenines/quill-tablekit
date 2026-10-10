import { createElement } from './dom'
import { toContainerPosition } from './domGrid'

export class Popover {
  readonly element: HTMLDivElement
  #container: HTMLElement
  #elementThatDoesNotClose: HTMLElement | null = null
  #documentListeners: AbortController | null = null

  constructor(container: HTMLElement, className: string) {
    this.#container = container
    this.element = createElement('div', { className: `qlt-popover ${className}` })
  }

  get isOpen(): boolean {
    return this.element.isConnected
  }

  open(clientX: number, clientY: number, elementThatDoesNotClose: HTMLElement | null = null): void {
    this.close()
    this.#elementThatDoesNotClose = elementThatDoesNotClose
    this.#container.append(this.element)
    this.moveTo(clientX, clientY)
    this.#documentListeners = new AbortController()

    const listenerOptions = { capture: true, signal: this.#documentListeners.signal }

    document.addEventListener('mousedown', this.#closeOnOutsideClick, listenerOptions)
    document.addEventListener('keydown', this.#closeOnEscape, listenerOptions)
  }

  moveTo(clientX: number, clientY: number): void {
    const { left, top } = toContainerPosition(this.#container, clientX, clientY)
    const maxLeft = Math.max(0, this.#container.clientWidth - this.element.offsetWidth - 4)

    this.element.style.left = `${Math.max(0, Math.min(left, maxLeft))}px`
    this.element.style.top = `${this.#fitInsideClippingContainer(top)}px`
  }

  close(): void {
    this.#documentListeners?.abort()
    this.#documentListeners = null
    this.element.remove()
  }

  #fitInsideClippingContainer(top: number): number {
    const { scrollTop, clientHeight } = this.#container
    const clipsOverflow = getComputedStyle(this.#container).overflowY !== 'visible'

    this.element.style.maxHeight = ''

    if (!clipsOverflow || clientHeight === 0) return top

    this.element.style.maxHeight = `${clientHeight - 8}px`

    const lowestTop = scrollTop + clientHeight - this.element.offsetHeight - 4

    return Math.max(scrollTop + 4, Math.min(top, lowestTop))
  }

  #closeOnOutsideClick = (event: MouseEvent): void => {
    const clickedNode = event.target as Node | null
    const isInside = this.element.contains(clickedNode) || this.#elementThatDoesNotClose?.contains(clickedNode)

    if (clickedNode && isInside) return

    this.close()
  }

  #closeOnEscape = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') return

    event.preventDefault()
    this.close()
  }
}

export const focusAdjacentButton = (buttons: HTMLElement[], focusedButton: HTMLElement, direction: 1 | -1): void => {
  const enabledButtons = buttons.filter((button) => !button.hasAttribute('disabled'))

  if (enabledButtons.length === 0) return

  const focusedPosition = enabledButtons.indexOf(focusedButton)

  enabledButtons.at((focusedPosition + direction) % enabledButtons.length)?.focus()
}

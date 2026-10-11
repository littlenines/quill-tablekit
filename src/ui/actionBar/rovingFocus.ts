const NEXT_BUTTON_KEYS: Record<string, (position: number, count: number) => number> = {
  ArrowRight: (position, count) => (position + 1) % count,
  ArrowLeft: (position, count) => (position - 1 + count) % count,
  Home: () => 0,
  End: (_position, count) => count - 1,
}

// Only one button of a toolbar is in the Tab order, and the arrow keys move between the buttons
export class RovingFocus {
  #toolbar: HTMLElement

  constructor(toolbar: HTMLElement) {
    this.#toolbar = toolbar
  }

  enabledButtons(): HTMLButtonElement[] {
    return [...this.#toolbar.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')]
  }

  makeFocusable(focusableButton: HTMLButtonElement | undefined): void {
    for (const button of this.#toolbar.querySelectorAll('button')) {
      button.tabIndex = button === focusableButton ? 0 : -1
    }
  }

  focus(): void {
    const buttons = this.enabledButtons()

    ;(buttons.find((button) => button.tabIndex === 0) ?? buttons[0])?.focus()
  }

  moveWithKey(event: KeyboardEvent): void {
    const nextPosition = NEXT_BUTTON_KEYS[event.key]
    const buttons = this.enabledButtons()
    const focusedPosition = buttons.indexOf(document.activeElement as HTMLButtonElement)

    if (!nextPosition || focusedPosition < 0) return

    event.preventDefault()

    const nextButton = buttons[nextPosition(focusedPosition, buttons.length)]

    this.makeFocusable(nextButton)
    nextButton.focus()
  }
}

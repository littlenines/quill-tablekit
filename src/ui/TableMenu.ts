import { createElement } from './dom'
import { focusAdjacentButton, Popover } from './Popover'

export interface MenuItem {
  label: string
  enabled: boolean
  run: () => void
}

export class TableMenu {
  readonly popover: Popover

  constructor(container: HTMLElement) {
    this.popover = new Popover(container, 'qlt-menu')
    this.popover.element.setAttribute('role', 'menu')
  }

  open(
    menuGroups: MenuItem[][],
    clientX: number,
    clientY: number,
    elementThatDoesNotClose: HTMLElement | null = null,
  ): void {
    const buttonGroups = menuGroups.map((menuGroup) => menuGroup.map((menuItem) => this.#createButton(menuItem)))
    const allButtons = buttonGroups.flat()

    for (const button of allButtons) {
      button.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return

        event.preventDefault()
        focusAdjacentButton(allButtons, button, event.key === 'ArrowDown' ? 1 : -1)
      })
    }

    const createSeparator = () => createElement('div', { className: 'qlt-menu-separator' }, { role: 'separator' })
    const menuContent = buttonGroups.flatMap((buttonGroup, groupIndex) =>
      groupIndex > 0 ? [createSeparator(), ...buttonGroup] : buttonGroup,
    )

    this.popover.element.replaceChildren(...menuContent)
    this.popover.open(clientX, clientY, elementThatDoesNotClose)
  }

  close(): void {
    this.popover.close()
  }

  #createButton({ label, enabled, run }: MenuItem): HTMLButtonElement {
    const button = createElement(
      'button',
      { type: 'button', className: 'qlt-menu-item', textContent: label, disabled: !enabled },
      { role: 'menuitem' },
    )

    button.addEventListener('mousedown', (event) => event.preventDefault())
    button.addEventListener('click', () => {
      this.close()
      run()
    })

    return button
  }
}

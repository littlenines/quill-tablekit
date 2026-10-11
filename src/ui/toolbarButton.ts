import Quill from 'quill'
import type Toolbar from 'quill/modules/toolbar.js'

export const setupToolbarButton = (
  quill: Quill,
  ariaLabel: string,
  icon: string,
  onClick: () => void,
  signal: AbortSignal,
): HTMLButtonElement | null => {
  const toolbar = quill.getModule('toolbar') as Toolbar | undefined
  const tableButton = toolbar?.container?.querySelector<HTMLButtonElement>('button.ql-table')

  if (!toolbar || !tableButton) return null

  // Quill only wires the button itself when 'table' is a registered format
  const previousHandler = toolbar.handlers.table
  const isWiredByQuill = previousHandler != null || quill.scroll.query('table') != null

  toolbar.addHandler('table', onClick)
  
  signal.addEventListener('abort', () => {
    if (toolbar.handlers.table !== onClick) return

    if (previousHandler) toolbar.handlers.table = previousHandler
    else delete toolbar.handlers.table
  })

  if (!isWiredByQuill) {
    tableButton.addEventListener(
      'click',
      (event) => {
        event.preventDefault()
        onClick()
      },
      { signal },
    )
  }

  if (icon) {
    tableButton.innerHTML = icon
  } else if (!tableButton.innerHTML.trim()) {
    const quillIcons = Quill.import('ui/icons') as Record<string, string>

    tableButton.innerHTML = quillIcons.table ?? '▦'
  }

  tableButton.setAttribute('aria-label', ariaLabel)
  tableButton.setAttribute('aria-haspopup', 'true')

  return tableButton
}

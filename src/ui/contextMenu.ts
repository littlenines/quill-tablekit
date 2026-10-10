import Quill from 'quill'
import { TableCellLine } from '../blots'
import { CLASS_NAMES } from '../config/constants'
import { lastSelectedLine } from '../editing/selection'

const selectionIncludesCell = (quill: Quill, cellElement: HTMLElement): boolean => {
  const range = quill.getSelection()

  if (!range) return false

  const selectedLines = [...quill.getLines(range.index, Math.max(1, range.length)), lastSelectedLine(quill, range)]

  return selectedLines.some((line) => line != null && cellElement.contains(line.domNode))
}

export const installContextMenu = (
  quill: Quill,
  openMenu: (clientX: number, clientY: number) => void,
  signal: AbortSignal,
): void => {
  quill.root.addEventListener(
    'contextmenu',
    (event) => {
      if (!quill.isEnabled()) return

      const clickedElement = event.target instanceof Element ? event.target : null
      const cellElement = clickedElement?.closest<HTMLElement>(`td.${CLASS_NAMES.cell}`)

      if (!cellElement || !quill.root.contains(cellElement)) return

      event.preventDefault()

      if (!selectionIncludesCell(quill, cellElement)) {
        const firstLineBlot = Quill.find(cellElement.querySelector(`.${CLASS_NAMES.cellLine}`) as Node)

        if (firstLineBlot instanceof TableCellLine) quill.setSelection(quill.getIndex(firstLineBlot), 0, 'user')
      }

      openMenu(event.clientX, event.clientY)
    },
    { signal },
  )
}

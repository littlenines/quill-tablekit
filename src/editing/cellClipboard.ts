import { cellAreaHTML } from '../blots/html'
import { cellAreas, type CellArea } from '../model/grid'
import type { TableModel } from '../model/TableModel'
import { indexes } from '../utils/array'
import type { Delta } from '../utils/quill'
import type { TableContext } from './context'

export interface ClipboardContent {
  html: string
  text: string
}

const cellText = (content: Delta): string =>
  content.ops
    .map(({ insert }) => (typeof insert === 'string' ? insert : ''))
    .join('')
    .replace(/\n$/, '')
    .replaceAll('\n', ' ')

const tabSeparatedText = (model: TableModel, area: CellArea): string => {
  const areas = cellAreas(model.grid)

  const rowText = (rowIndex: number) =>
    indexes(area.right - area.left)
      .map((columnOffset) => {
        const columnIndex = area.left + columnOffset
        const cell = model.grid[rowIndex][columnIndex]
        const cellArea = areas.get(cell)
        const startsHere = cellArea?.top === rowIndex && cellArea.left === columnIndex

        return startsHere ? cellText(cell.content) : ''
      })
      .join('\t')

  return indexes(area.bottom - area.top)
    .map((rowOffset) => rowText(area.top + rowOffset))
    .join('\n')
}

export const clipboardContentOf = ({ tableBlot, model }: TableContext, area: CellArea): ClipboardContent => ({
  html: cellAreaHTML(tableBlot, model, area),
  text: tabSeparatedText(model, area),
})

export const wholeTableArea = (model: TableModel): CellArea => ({
  top: 0,
  left: 0,
  bottom: model.rowCount,
  right: model.columnCount,
})

const copyWithCopyEvent = ({ html, text }: ClipboardContent): boolean => {
  const fillClipboard = (event: ClipboardEvent) => {
    event.clipboardData?.setData('text/html', html)
    event.clipboardData?.setData('text/plain', text)
    event.preventDefault()
    event.stopImmediatePropagation()
  }

  document.addEventListener('copy', fillClipboard, { capture: true })

  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    document.removeEventListener('copy', fillClipboard, { capture: true })
  }
}

export const writeToClipboard = async (clipboardContent: ClipboardContent): Promise<boolean> => {
  const { html, text } = clipboardContent

  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    try {
      const clipboardItem = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' }),
      })

      await navigator.clipboard.write([clipboardItem])
      return true
    } catch {
      return copyWithCopyEvent(clipboardContent)
    }
  }

  return copyWithCopyEvent(clipboardContent)
}

import type Quill from 'quill'
import type { Range } from 'quill'
import type { PasteLimits } from '../model/paste'
import { Delta } from '../utils/quill'
import { clipboardContentOf, type ClipboardContent } from './cellClipboard'
import { hasTableLines, toCellLines } from './clipboard'
import { deleteSelectedContent, pasteTableIntoCells, selectedCellsContext } from './commands'
import { getTableContext } from './context'
import { lastSelectedLine, lineAt, needsTableAwareDelete, pickFormats, tableOf } from './selection'

const HTML_TABLE_CELL = /<t[dh][\s>]/i

export const installInputGuards = (
  quill: Quill,
  container: HTMLElement,
  pasteLimits: PasteLimits,
  signal: AbortSignal,
): void => {
  const listenerOptions = { capture: true, signal }

  container.addEventListener('copy', (event) => handleCopy(quill, event), listenerOptions)
  container.addEventListener('cut', (event) => handleCut(quill, event), listenerOptions)
  container.addEventListener('paste', (event) => handlePaste(quill, event, pasteLimits), listenerOptions)
  container.addEventListener('beforeinput', (event) => handleBeforeInput(quill, event), listenerOptions)
}

const putOnClipboard = (event: ClipboardEvent, { html, text }: ClipboardContent): void => {
  event.preventDefault()
  event.clipboardData?.setData('text/plain', text)
  event.clipboardData?.setData('text/html', html)
}

const handleCopy = (quill: Quill, event: ClipboardEvent): void => {
  if (event.defaultPrevented) return

  const range = quill.getSelection()
  const tableContext = range && selectedCellsContext(quill, range)

  if (tableContext) putOnClipboard(event, clipboardContentOf(tableContext, tableContext.selectedArea))
}

const handleCut = (quill: Quill, event: ClipboardEvent): void => {
  if (event.defaultPrevented || !quill.isEnabled()) return

  const range = quill.getSelection()

  if (!range) return

  const tableContext = selectedCellsContext(quill, range)

  if (tableContext) {
    putOnClipboard(event, clipboardContentOf(tableContext, tableContext.selectedArea))
    deleteSelectedContent(quill, range)

    return
  }

  if (!needsTableAwareDelete(quill, range)) return

  putOnClipboard(event, quill.clipboard.onCopy(range, true))
  deleteSelectedContent(quill, range)
}

const tableContextForPaste = (quill: Quill, range: Range) => {
  const startLine = lineAt(quill, range.index)
  const endLine = lastSelectedLine(quill, range)

  if (!startLine || !endLine || tableOf(startLine) !== tableOf(endLine)) return null

  return getTableContext(quill, range)
}

const handlePaste = (quill: Quill, event: ClipboardEvent, pasteLimits: PasteLimits): void => {
  if (event.defaultPrevented || !quill.isEnabled()) return

  const range = quill.getSelection()

  if (!range) return

  const pastedHTML = event.clipboardData?.getData('text/html') ?? ''
  const pastedText = event.clipboardData?.getData('text/plain') ?? ''

  if (!pastedHTML && !pastedText) return

  const isPastingIntoTable = lineAt(quill, range.index) != null || needsTableAwareDelete(quill, range)

  if (!isPastingIntoTable && !HTML_TABLE_CELL.test(pastedHTML)) return

  event.preventDefault()

  const pastedContent = quill.clipboard.convert({ html: pastedHTML, text: pastedText })
  const targetTable = hasTableLines(pastedContent) ? tableContextForPaste(quill, range) : null

  if (targetTable) {
    pasteTableIntoCells(quill, targetTable, pastedContent, pasteLimits)
    quill.scrollSelectionIntoView()

    return
  }

  if (range.length > 0 && !deleteSelectedContent(quill, range)) quill.deleteText(range, 'user')

  const pasteIndex = quill.getSelection()?.index ?? range.index
  const cellLine = lineAt(quill, pasteIndex)
  let contentToInsert: Delta

  if (cellLine) {
    const cellLines = toCellLines(pastedContent, cellLine.cellValue, quill.scroll)

    contentToInsert = cellLines.compose(new Delta().retain(cellLines.length() - 1).delete(1))
  } else {
    contentToInsert = pastedContent

    const [currentLine, offsetInLine] = quill.getLine(pasteIndex)

    if (hasTableLines(contentToInsert) && currentLine && offsetInLine > 0) {
      const lineFormats = pickFormats(quill, quill.getFormat(pasteIndex), true)

      contentToInsert = new Delta().insert('\n', lineFormats).concat(contentToInsert)
    }
  }

  quill.updateContents(new Delta().retain(pasteIndex).concat(contentToInsert), 'user')
  quill.setSelection(pasteIndex + contentToInsert.length(), 0, 'silent')
  quill.scrollSelectionIntoView()
}

const handleBeforeInput = (quill: Quill, event: InputEvent): void => {
  if (event.defaultPrevented || !quill.isEnabled()) return
  if (!event.inputType.startsWith('insert') && !event.inputType.startsWith('delete')) return

  const range = quill.getSelection()

  if (!range || range.length === 0) return

  const inlineFormats = pickFormats(quill, quill.getFormat(range.index, 1), false)

  if (!deleteSelectedContent(quill, range)) return

  event.preventDefault()

  const typedText = event.inputType === 'insertText' ? event.data : null
  const caretIndex = quill.getSelection()?.index ?? range.index

  if (typedText) {
    quill.insertText(caretIndex, typedText, inlineFormats, 'user')
    quill.setSelection(caretIndex + typedText.length, 0, 'silent')
  }
}

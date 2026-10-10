import type Quill from 'quill'
import { Delta } from '../utils/quill'
import { hasTableLines, toCellLines } from './clipboard'
import { deleteSelection, lineAt, needsTableAwareDelete, pickFormats } from './selection'

const HTML_TABLE_CELL = /<t[dh][\s>]/i

export const installInputGuards = (quill: Quill, container: HTMLElement, signal: AbortSignal): void => {
  const listenerOptions = { capture: true, signal }

  container.addEventListener('paste', (event) => handlePaste(quill, event), listenerOptions)
  container.addEventListener('cut', (event) => handleCut(quill, event), listenerOptions)
  container.addEventListener('beforeinput', (event) => handleBeforeInput(quill, event), listenerOptions)
}

const handlePaste = (quill: Quill, event: ClipboardEvent): void => {
  if (event.defaultPrevented || !quill.isEnabled()) return

  const range = quill.getSelection()

  if (!range) return

  const pastedHTML = event.clipboardData?.getData('text/html') ?? ''
  const pastedText = event.clipboardData?.getData('text/plain') ?? ''

  if (!pastedHTML && !pastedText) return

  const isPastingIntoTable = lineAt(quill, range.index) != null || needsTableAwareDelete(quill, range)

  if (!isPastingIntoTable && !HTML_TABLE_CELL.test(pastedHTML)) return

  event.preventDefault()

  if (range.length > 0) {
    if (needsTableAwareDelete(quill, range)) deleteSelection(quill, range)
    else quill.deleteText(range, 'user')
  }

  const pasteIndex = range.index
  const pastedContent = quill.clipboard.convert({ html: pastedHTML, text: pastedText })
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

const handleCut = (quill: Quill, event: ClipboardEvent): void => {
  if (event.defaultPrevented || !quill.isEnabled()) return

  const range = quill.getSelection()

  if (!range || !needsTableAwareDelete(quill, range)) return

  event.preventDefault()

  const { html: copiedHTML, text: copiedText } = quill.clipboard.onCopy(range, true)

  event.clipboardData?.setData('text/plain', copiedText)
  event.clipboardData?.setData('text/html', copiedHTML)
  deleteSelection(quill, range)
}

const handleBeforeInput = (quill: Quill, event: InputEvent): void => {
  if (event.defaultPrevented || !quill.isEnabled()) return
  if (!event.inputType.startsWith('insert') && !event.inputType.startsWith('delete')) return

  const range = quill.getSelection()

  if (!range || !needsTableAwareDelete(quill, range)) return

  event.preventDefault()

  const inlineFormats = pickFormats(quill, quill.getFormat(range.index, 1), false)
  const typedText = event.inputType === 'insertText' ? event.data : null

  deleteSelection(quill, range)

  if (typedText) {
    quill.insertText(range.index, typedText, inlineFormats, 'user')
    quill.setSelection(range.index + typedText.length, 0, 'silent')
  }
}

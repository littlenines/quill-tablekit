import type Quill from 'quill'
import type { Range } from 'quill'
import type Keyboard from 'quill/modules/keyboard.js'
import { TableCellLine } from '../../blots'
import { deleteSelectedContent } from '../selectedCells'
import { isInTable, lineAt } from '../selection'
import { moveVertically } from './verticalNavigation'

type KeyBinding = Exclude<Parameters<Keyboard['addBinding']>[0], string | number> & { key: string }

const WITH_ANY_MODIFIER_KEYS = { shiftKey: null, altKey: null, ctrlKey: null, metaKey: null }

const LIST_SHORTCUT_PREFIX = /^\s*?(\d+\.|-|\*|\[ ?\]|\[x\])$/

const priorityBindings = (keyboard: Keyboard, signal: AbortSignal) => {
  const addedBindings: [key: string, binding: Keyboard['bindings'][string][number]][] = []

  signal.addEventListener('abort', () => {
    for (const [key, binding] of addedBindings) {
      const bindingsForKey = keyboard.bindings[key] ?? []
      const bindingIndex = bindingsForKey.indexOf(binding)

      if (bindingIndex >= 0) bindingsForKey.splice(bindingIndex, 1)
    }
  })

  return (binding: KeyBinding): void => {
    keyboard.addBinding(binding)

    const bindingsForKey = keyboard.bindings[binding.key]
    const addedBinding = bindingsForKey?.pop()

    if (!bindingsForKey || !addedBinding) return

    bindingsForKey.unshift(addedBinding)
    addedBindings.push([binding.key, addedBinding])
  }
}

export const installKeyboard = (
  quill: Quill,
  moveToCell: (direction: 1 | -1) => boolean,
  signal: AbortSignal,
): void => {
  const addPriorityBinding = priorityBindings(quill.keyboard, signal)

  const deleteSelectionIfItSpansCells = (range: Range): boolean => !deleteSelectedContent(quill, range)

  addPriorityBinding({ key: 'Tab', shiftKey: false, handler: (range) => !(isInTable(quill, range) && moveToCell(1)) })

  addPriorityBinding({ key: 'Tab', shiftKey: true, handler: (range) => !(isInTable(quill, range) && moveToCell(-1)) })

  for (const [key, direction] of [
    ['ArrowUp', -1],
    ['ArrowDown', 1],
  ] as const) {
    addPriorityBinding({
      key,
      collapsed: true,
      shiftKey: false,
      handler: (range) => !moveVertically(quill, range, direction),
    })
  }

  addPriorityBinding({
    key: 'Backspace',
    ...WITH_ANY_MODIFIER_KEYS,
    handler: (range) => {
      if (range.length > 0) return deleteSelectionIfItSpansCells(range)

      const [line, offsetInLine] = quill.getLine(range.index)

      if (!line || offsetInLine !== 0) return true
      if (line instanceof TableCellLine) return line.prev != null

      const isRightAfterTable = range.index > 0 && lineAt(quill, range.index - 1) != null

      if (isRightAfterTable) {
        if (line.length() <= 1 && line.next != null) quill.deleteText(range.index, 1, 'user')

        quill.setSelection(range.index - 1, 0, 'user')
        return false
      }

      return true
    },
  })

  addPriorityBinding({
    key: 'Delete',
    ...WITH_ANY_MODIFIER_KEYS,
    handler: (range) => {
      if (range.length > 0) return deleteSelectionIfItSpansCells(range)

      const [line, offsetInLine] = quill.getLine(range.index)

      if (!line || offsetInLine < line.length() - 1) return true
      if (line instanceof TableCellLine) return line.next != null

      const isRightBeforeTable = lineAt(quill, range.index + 1) != null

      if (isRightBeforeTable) {
        if (line.length() <= 1) quill.deleteText(range.index, 1, 'user')
        return false
      }

      return true
    },
  })

  addPriorityBinding({ key: 'Enter', shiftKey: null, collapsed: false, handler: deleteSelectionIfItSpansCells })

  addPriorityBinding({
    key: ' ',
    shiftKey: null,
    collapsed: true,
    prefix: LIST_SHORTCUT_PREFIX,
    handler: (range) => {
      if (!isInTable(quill, range)) return true

      quill.insertText(range.index, ' ', 'user')
      quill.setSelection(range.index + 1, 0, 'silent')
      return false
    },
  })
}

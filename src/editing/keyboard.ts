import type Quill from 'quill'
import type { Range } from 'quill'
import type Keyboard from 'quill/modules/keyboard'
import { TableCellLine } from '../blots'
import { deleteSelection, isInTable, lineAt, needsTableAwareDelete } from './selection'

type KeyBinding = Exclude<Parameters<Keyboard['addBinding']>[0], string | number> & { key: string }

const WITH_ANY_MODIFIER_KEYS = { shiftKey: null, altKey: null, ctrlKey: null, metaKey: null }

const LIST_SHORTCUT_PREFIX = /^\s*?(\d+\.|-|\*|\[ ?\]|\[x\])$/

// Quill's default bindings for these keys would run first otherwise
const addPriorityBinding = (keyboard: Keyboard, binding: KeyBinding): void => {
  keyboard.addBinding(binding)

  const bindingsForKey = keyboard.bindings[binding.key]

  if (bindingsForKey && bindingsForKey.length > 1) {
    bindingsForKey.unshift(bindingsForKey.pop() as (typeof bindingsForKey)[number])
  }
}

export const installKeyboard = (quill: Quill, moveToCell: (direction: 1 | -1) => boolean): void => {
  const { keyboard } = quill

  const deleteSelectionIfItSpansCells = (range: Range): boolean => {
    if (!needsTableAwareDelete(quill, range)) return true

    deleteSelection(quill, range)
    return false
  }

  addPriorityBinding(keyboard, {
    key: 'Tab',
    shiftKey: false,
    handler: (range) => !(isInTable(quill, range) && moveToCell(1)),
  })

  addPriorityBinding(keyboard, {
    key: 'Tab',
    shiftKey: true,
    handler: (range) => !(isInTable(quill, range) && moveToCell(-1)),
  })

  addPriorityBinding(keyboard, {
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

  addPriorityBinding(keyboard, {
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

  addPriorityBinding(keyboard, {
    key: 'Enter',
    shiftKey: null,
    collapsed: false,
    handler: deleteSelectionIfItSpansCells,
  })

  addPriorityBinding(keyboard, {
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

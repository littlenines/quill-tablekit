import type Quill from 'quill'
import type { Range } from 'quill'
import { registerBlots, type TableContainer } from './blots'
import { CELL_FORMAT } from './config/constants'
import { resolveOptions, type ResolvedTableKitOptions, type TableKitOptions } from './config/options'
import { matchTableCell, matchTableRow } from './editing/clipboard'
import * as commands from './editing/commands'
import { canMerge, canSplit, getTableContext, type TableContext } from './editing/context'
import * as edits from './editing/edits'
import { installInputGuards } from './editing/inputGuards'
import { installKeyboard } from './editing/keyboard'
import { isInTable } from './editing/selection'
import { injectStyles } from './styles/injectStyles'
import { CellSelection } from './ui/CellSelection'
import { ColumnResizer } from './ui/ColumnResizer'
import { installContextMenu } from './ui/contextMenu'
import { TableMenu } from './ui/TableMenu'
import { tableMenuItems } from './ui/tableMenuItems'
import { TablePicker } from './ui/TablePicker'
import { setupToolbarButton } from './ui/toolbarButton'
import { Module } from './utils/quill'
import { isSupportedQuill, warnUnsupported } from './utils/support'

export type { TableContext }

class TableKit extends Module<TableKitOptions> {
  static register(): void {
    if (!isSupportedQuill()) {
      warnUnsupported()
      return
    }

    registerBlots()
    injectStyles()
  }

  #settings: ResolvedTableKitOptions
  #listeners = new AbortController()
  #picker: TablePicker | null = null
  #menu: TableMenu | null = null
  #cellSelection: CellSelection | null = null
  #resizer: ColumnResizer | null = null
  #toolbarButton: HTMLButtonElement | null = null
  #lastRange: Range | null = null

  constructor(quill: Quill, userOptions: Partial<TableKitOptions> = {}) {
    super(quill, userOptions)
    this.#settings = resolveOptions(userOptions)

    if (!isSupportedQuill()) {
      warnUnsupported()
      return
    }

    if (!quill.scroll.query(CELL_FORMAT)) registerBlots()

    injectStyles()

    const container = quill.root.parentNode

    if (!(container instanceof HTMLElement)) throw new Error('TableKit: quill.root has no parentNode')

    const { signal } = this.#listeners

    this.#picker = new TablePicker(container, this.#settings, (rowCount, columnCount) =>
      this.insertTable(rowCount, columnCount),
    )
    this.#menu = new TableMenu(container)
    this.#cellSelection = new CellSelection(quill, container)

    if (this.#settings.resizable) {
      this.#resizer = new ColumnResizer(quill, container, this.#settings.minColumnWidth, (tableElement, columnWidths) =>
        this.setColumnWidths(tableElement, columnWidths),
      )
    }

    quill.clipboard.addMatcher('td, th', matchTableCell)
    quill.clipboard.addMatcher('tr', matchTableRow)
    installKeyboard(quill, (direction) => this.moveToCell(direction))
    installInputGuards(quill, container, signal)

    if (this.#settings.contextMenu)
      installContextMenu(quill, (clientX, clientY) => this.#openMenu(clientX, clientY, null), signal)

    this.#toolbarButton = setupToolbarButton(
      quill,
      this.#settings.labels.insertTable,
      () => this.#handleToolbarClick(),
      signal,
    )

    quill.on('editor-change', this.#handleEditorChange)
    quill.root.addEventListener('scroll', () => this.#cellSelection?.update(quill.getSelection()), { signal })
  }

  insertTable(rowCount: number, columnCount: number): void {
    const { maxRows, maxColumns } = this.#settings
    const documentEnd = { index: this.quill.getLength() - 1, length: 0 }
    const range = this.#currentRange() ?? documentEnd
    const limitTo = (count: number, max: number) => Math.min(max, Math.max(1, Math.floor(count)))

    commands.insertTable(this.quill, range, limitTo(rowCount, maxRows), limitTo(columnCount, maxColumns))
  }

  insertRowAbove(): void {
    this.#edit(edits.insertRow('above'))
  }

  insertRowBelow(): void {
    this.#edit(edits.insertRow('below'))
  }

  insertColumnLeft(): void {
    this.#edit(edits.insertColumn('left', this.#settings.minColumnWidth))
  }

  insertColumnRight(): void {
    this.#edit(edits.insertColumn('right', this.#settings.minColumnWidth))
  }

  deleteRow(): void {
    this.#edit(edits.deleteRows)
  }

  deleteColumn(): void {
    this.#edit(edits.deleteColumns)
  }

  deleteTable(): void {
    this.#edit(edits.deleteTable)
  }

  mergeCells(): void {
    this.#edit(edits.mergeCells)
  }

  splitCell(): void {
    this.#edit(edits.splitCell)
  }

  canMergeCells(): boolean {
    const tableContext = this.getContext()

    return tableContext != null && canMerge(tableContext)
  }

  canSplitCell(): boolean {
    const tableContext = this.getContext()

    return tableContext != null && canSplit(tableContext)
  }

  isInTable(range: Range | null = this.#currentRange()): boolean {
    return isInTable(this.quill, range)
  }

  setColumnWidths(table: HTMLTableElement | TableContainer, columnWidths: number[] | null): void {
    commands.setColumnWidths(this.quill, table, columnWidths)
  }

  moveToCell(direction: 1 | -1): boolean {
    return commands.moveToCell(this.quill, this.#currentRange(), direction)
  }

  getContext(range: Range | null = this.#currentRange()): TableContext | null {
    return getTableContext(this.quill, range)
  }

  destroy(): void {
    this.#listeners.abort()
    this.quill.off('editor-change', this.#handleEditorChange)
    this.#picker?.close()
    this.#menu?.close()
    this.#cellSelection?.destroy()
    this.#resizer?.destroy()
    this.#picker = null
    this.#menu = null
    this.#cellSelection = null
    this.#resizer = null
  }

  #edit(tableEdit: edits.TableEdit): void {
    commands.runEdit(this.quill, this.#currentRange(), tableEdit)
  }

  #currentRange(): Range | null {
    return this.quill.getSelection() ?? this.#lastRange
  }

  #handleEditorChange = (): void => {
    const range = this.quill.getSelection()

    if (range) this.#lastRange = range

    this.#cellSelection?.update(range)
  }

  #handleToolbarClick(): void {
    const toolbarButton = this.#toolbarButton

    if (!toolbarButton || !this.quill.isEnabled()) return
    if (this.#picker?.popover.isOpen || this.#menu?.popover.isOpen) {
      this.#picker?.close()
      this.#menu?.close()

      return
    }

    if (this.isInTable()) {
      const { left, bottom } = toolbarButton.getBoundingClientRect()

      this.#openMenu(left, bottom + 4, toolbarButton)
    } else {
      this.#picker?.open(toolbarButton)
    }
  }

  #openMenu(clientX: number, clientY: number, toolbarButton: HTMLElement | null): void {
    const tableContext = this.getContext()

    if (!tableContext) return

    const menuGroups = tableMenuItems(tableContext, this.#settings.labels, this)

    this.#menu?.open(menuGroups, clientX, clientY, toolbarButton)
  }
}

export default TableKit

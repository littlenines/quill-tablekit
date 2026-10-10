import type Quill from 'quill'
import type { Range } from 'quill'
import { registerBlots, type TableContainer } from './blots'
import { CELL_FORMAT } from './config/constants'
import { resolveOptions, type ResolvedTableKitOptions, type TableKitOptions } from './config/options'
import { clipboardContentOf, wholeTableArea, writeToClipboard } from './editing/cellClipboard'
import { matchTableCell, matchTableRow } from './editing/clipboard'
import * as commands from './editing/commands'
import { canMerge, canSplit, getTableContext, type TableContext } from './editing/context'
import * as edits from './editing/edits'
import { installInputGuards } from './editing/inputGuards'
import { installKeyboard } from './editing/keyboard'
import {
  changeCellProperties,
  changeTableProperties,
  readCellProperties,
  readTableProperties,
} from './editing/properties'
import { isInTable } from './editing/selection'
import type { CellProperties, TableProperties } from './model/properties'
import { injectStyles } from './styles/injectStyles'
import { CellSelection } from './ui/CellSelection'
import { ColumnResizer } from './ui/ColumnResizer'
import { RowResizer } from './ui/RowResizer'
import { TableControls } from './ui/TableControls'
import { TableResizer } from './ui/TableResizer'
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
  #controls: TableControls | null = null
  #cellSelection: CellSelection | null = null
  #resizers: (ColumnResizer | RowResizer | TableResizer)[] = []
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

    this.#controls = new TableControls(quill, container, this.#settings, this, signal)
    this.#cellSelection = new CellSelection(quill, container)

    if (this.#settings.resizable) {
      const { minColumnWidth } = this.#settings

      this.#resizers = [
        new ColumnResizer(quill, container, minColumnWidth, (tableElement, columnWidths) =>
          this.setColumnWidths(tableElement, columnWidths),
        ),
        new RowResizer(quill, container, (tableElement, rowHeights) => this.setRowHeights(tableElement, rowHeights)),
        new TableResizer(quill, container, minColumnWidth, (tableElement, layout) =>
          commands.setTableLayout(quill, tableElement, layout),
        ),
      ]
    }

    quill.clipboard.addMatcher('td, th', matchTableCell)
    quill.clipboard.addMatcher('tr', matchTableRow)
    installKeyboard(quill, (direction) => this.moveToCell(direction))
    installInputGuards(quill, container, this.#settings, signal)
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

  insertParagraphAbove(): void {
    commands.insertParagraph(this.quill, this.#currentRange(), 'above')
  }

  insertParagraphBelow(): void {
    commands.insertParagraph(this.quill, this.#currentRange(), 'below')
  }

  selectRow(): void {
    commands.selectCells(this.quill, this.#currentRange(), 'rows')
  }

  selectColumn(): void {
    commands.selectCells(this.quill, this.#currentRange(), 'columns')
  }

  async copyTable(): Promise<boolean> {
    const tableContext = this.getContext()

    if (!tableContext) return false

    return writeToClipboard(clipboardContentOf(tableContext, wholeTableArea(tableContext.model)))
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

  getCellProperties(): CellProperties | null {
    const tableContext = this.getContext()

    return tableContext && readCellProperties(tableContext)
  }

  setCellProperties(changes: Partial<CellProperties>): void {
    commands.changeTable(this.quill, this.#currentRange(), changeCellProperties(changes))
  }

  getTableProperties(): TableProperties | null {
    const tableContext = this.getContext()

    return tableContext && readTableProperties(tableContext)
  }

  setTableProperties(changes: Partial<TableProperties>): void {
    commands.changeTable(this.quill, this.#currentRange(), changeTableProperties(changes))
  }

  isInTable(range: Range | null = this.#currentRange()): boolean {
    return isInTable(this.quill, range)
  }

  setColumnWidths(table: HTMLTableElement | TableContainer, columnWidths: number[] | null): void {
    commands.setTableLayout(this.quill, table, { columnWidths })
  }

  setRowHeights(table: HTMLTableElement | TableContainer, rowHeights: (number | null)[] | null): void {
    commands.setTableLayout(this.quill, table, { rowHeights })
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
    this.#controls?.closeAll()
    this.#cellSelection?.destroy()

    for (const resizer of this.#resizers) resizer.destroy()

    this.#controls = null
    this.#cellSelection = null
    this.#resizers = []
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
    this.#controls?.updateActionBar(range)
  }
}

export default TableKit

import type Quill from 'quill'
import type { Range } from 'quill'
import { registerBlots, type TableContainer } from './blots'
import { CELL_FORMAT } from './config/constants'
import { resolveOptions, type ResolvedTableKitOptions, type TableKitOptions } from './config/options'
import { clipboardContentOf, wholeTableArea, writeToClipboard } from './editing/clipboard/cellClipboard'
import { matchCaption, matchTableCell, matchTableRow } from './editing/clipboard/pasteMatchers'
import * as commands from './editing/commands'
import { moveToCell } from './editing/input/cellNavigation'
import { selectCells } from './editing/selectedCells'
import { canMerge, canSplit, getTableContext, type TableContext } from './editing/context'
import * as edits from './editing/edits'
import { installInputGuards } from './editing/input/inputGuards'
import { installKeyboard } from './editing/input/keyboard'
import {
  changeCellProperties,
  changeTableProperties,
  readCellProperties,
  readTableProperties,
} from './editing/properties'
import { isInTable } from './editing/selection'
import { percentBasis } from './editing/widthUnits'
import type { CellProperties, TableProperties, WidthUnit } from './model/properties'
import type { SortOrder } from './model/operations/sort'
import { fitColumnWidthsWithin } from './model/layout'
import { equalizeColumnWidths, fitToWidth } from './model/operations/widths'
import { tableMarkdown } from './markdown/tableMarkdown'
import { injectStyles } from './styles/injectStyles'
import { CellSelection } from './ui/CellSelection'
import { ColumnResizer } from './ui/resize/ColumnResizer'
import { contentColumnWidths, equalRowHeight } from './ui/resize/fitting'
import { editorContentWidth } from './utils/editorWidth'
import { RowResizer } from './ui/resize/RowResizer'
import { TableControls } from './ui/TableControls'
import { TableResizer } from './ui/resize/TableResizer'
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
          commands.setTableLayout(quill, tableElement, layout, this.#widthUnit),
        ),
      ]
    }

    const pasteMatchers = [matchTableCell, matchTableRow, matchCaption]

    quill.clipboard.addMatcher('td, th', matchTableCell)
    quill.clipboard.addMatcher('tr', matchTableRow)
    quill.clipboard.addMatcher('caption', matchCaption)
    signal.addEventListener('abort', () => {
      quill.clipboard.matchers = quill.clipboard.matchers.filter(([, matcher]) => !pasteMatchers.includes(matcher))
    })
    installKeyboard(quill, (direction) => this.moveToCell(direction), signal)
    installInputGuards(quill, container, this.#settings, signal)
    quill.on('editor-change', this.#handleEditorChange)
    quill.root.addEventListener('scroll', () => this.#updateCellHighlight(), { signal })
    window.addEventListener('resize', () => this.#updateCellHighlight(), { signal })
    document.addEventListener('mousedown', () => this.#updateCellHighlight(), { signal })
    document.addEventListener('focusin', () => this.#updateCellHighlight(), { signal })

    const readOnlyObserver = new MutationObserver(() => this.#handleEditorChange())

    readOnlyObserver.observe(quill.root, { attributes: true, attributeFilter: ['contenteditable'] })
    signal.addEventListener('abort', () => readOnlyObserver.disconnect())
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

  moveRowUp(): void {
    this.#edit(edits.moveRows(-1))
  }

  moveRowDown(): void {
    this.#edit(edits.moveRows(1))
  }

  moveColumnLeft(): void {
    this.#edit(edits.moveColumns(-1))
  }

  moveColumnRight(): void {
    this.#edit(edits.moveColumns(1))
  }

  duplicateRow(): void {
    this.#edit(edits.duplicateRows)
  }

  duplicateColumn(): void {
    this.#edit(edits.duplicateColumns(this.#settings.minColumnWidth))
  }

  sortByColumn(order: SortOrder = 'ascending'): void {
    this.#edit(edits.sortRows(order, this.#language))
  }

  equalizeColumnWidths(): void {
    commands.changeTable(this.quill, this.#currentRange(), ({ model }) => equalizeColumnWidths(model))
  }

  fitTableToWidth(): void {
    commands.changeTable(this.quill, this.#currentRange(), ({ model }) => {
      const tableWidth = model.widthUnit === 'percent' ? percentBasis(this.quill) : editorContentWidth(this.quill)

      fitToWidth(model, tableWidth, this.#settings.minColumnWidth)
    })
  }

  fitColumnsToContent(): void {
    const tableElement = this.#tableElementAtCursor()

    if (!tableElement || !this.quill.isEnabled()) return

    const contentWidths = contentColumnWidths(tableElement, this.quill.container)
    const { minColumnWidth } = this.#settings
    const columnWidths = fitColumnWidthsWithin(contentWidths, editorContentWidth(this.quill), minColumnWidth)

    commands.setTableLayout(this.quill, tableElement, { columnWidths }, this.#widthUnit)
  }

  equalizeRowHeights(): void {
    const tableElement = this.#tableElementAtCursor()

    if (!tableElement || !this.quill.isEnabled()) return

    const rowHeight = equalRowHeight(tableElement)

    commands.setTableLayout(this.quill, tableElement, { rowHeights: Array.from(tableElement.rows, () => rowHeight) })
  }

  insertParagraphAbove(): void {
    commands.insertParagraph(this.quill, this.#currentRange(), 'above')
  }

  insertParagraphBelow(): void {
    commands.insertParagraph(this.quill, this.#currentRange(), 'below')
  }

  selectRow(): void {
    selectCells(this.quill, this.#currentRange(), 'rows')
  }

  selectColumn(): void {
    selectCells(this.quill, this.#currentRange(), 'columns')
  }

  async copyTable(): Promise<boolean> {
    const tableContext = this.getContext()

    if (!tableContext) return false

    return writeToClipboard(clipboardContentOf(tableContext, wholeTableArea(tableContext.model)))
  }

  async copyTableAsMarkdown(): Promise<boolean> {
    const markdown = this.getTableMarkdown()

    return markdown != null && writeToClipboard({ html: '', text: markdown })
  }

  getTableMarkdown(): string | null {
    const tableContext = this.getContext()

    return tableContext && tableMarkdown(tableContext.model)
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
    commands.setTableLayout(this.quill, table, { columnWidths }, this.#widthUnit)
  }

  setRowHeights(table: HTMLTableElement | TableContainer, rowHeights: (number | null)[] | null): void {
    commands.setTableLayout(this.quill, table, { rowHeights })
  }

  moveToCell(direction: 1 | -1): boolean {
    return moveToCell(this.quill, this.#currentRange(), direction)
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

  get #widthUnit(): WidthUnit {
    return this.#settings.responsiveWidths ? 'percent' : 'px'
  }

  get #language(): string {
    return this.quill.root.closest('[lang]')?.getAttribute('lang') || navigator.language
  }

  #tableElementAtCursor(): HTMLTableElement | null {
    return (this.getContext()?.tableBlot.domNode as HTMLTableElement | undefined) ?? null
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

    this.#updateCellHighlight(range)
    this.#controls?.updateActionBar(range)
  }

  // While the panel or the bar has the focus, the cells they change stay highlighted
  #updateCellHighlight(range = this.quill.getSelection()): void {
    const isUsingControls = this.#controls?.isInUse === true

    this.#cellSelection?.update(range ?? (isUsingControls ? this.#lastRange : null))
  }
}

export default TableKit

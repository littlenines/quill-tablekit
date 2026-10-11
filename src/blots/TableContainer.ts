import { BLOT_NAMES, CLASS_NAMES } from '../config/constants'
import { setAttribute } from '../model/cellValue'
import { columnWidthStyles } from '../model/layout'
import { tableGrid } from '../ui/domGrid'
import { setStyle } from '../utils/style'
import { Container, sharesGroupId, splitWhereGroupIdChanges, tableIdOf, type OptimizeContext } from './grouping'
import { tableHTML } from './html'
import { firstLine } from './TableCellLine'

export class TableContainer extends Container {
  static blotName = BLOT_NAMES.table
  static tagName = 'TABLE'
  static className = CLASS_NAMES.table

  checkMerge(): boolean {
    return super.checkMerge() && sharesGroupId(this, this.next, tableIdOf)
  }

  optimize(optimizeContext: OptimizeContext): void {
    super.optimize(optimizeContext)
    splitWhereGroupIdChanges(this, tableIdOf, optimizeContext)
    this.syncLayout()
  }

  syncLayout(): void {
    const cellValue = firstLine(this)?.cellValue
    const tableElement = this.domNode as HTMLTableElement

    if (cellValue) setAttribute(tableElement, 'data-table', cellValue.table)

    setAttribute(tableElement, 'data-header', cellValue?.header ? 'true' : null)
    setAttribute(tableElement, 'data-header-column', cellValue?.headerColumn ? 'true' : null)
    setStyle(tableElement, 'margin-left', cellValue?.tableAlign ? 'auto' : undefined)
    setStyle(tableElement, 'margin-right', cellValue?.tableAlign === 'center' ? 'auto' : undefined)
    setStyle(tableElement, '--qlt-border', cellValue?.borderColor)
    setAttribute(tableElement, 'data-border-style', cellValue?.borderStyle ?? null)
    setAttribute(tableElement, 'data-cell-padding', cellValue?.cellPadding ?? null)
    setAttribute(tableElement, 'data-striped', cellValue?.striped ? 'true' : null)
    setStyle(tableElement, '--qlt-table-stripe', cellValue?.stripeColor)
    setAttribute(tableElement, 'data-caption', cellValue?.caption ?? null)
    setAttribute(tableElement, 'data-caption-side', cellValue?.captionSide ?? null)

    this.#applyColumnWidths(cellValue?.widths ?? null, cellValue?.widthUnit === 'percent')
    this.#markFirstColumn(cellValue?.headerColumn === true)
  }

  // A cell merged down from the row above can push a row's first <td> into the second column,
  // so the first column comes from the grid instead of :first-child
  #markFirstColumn(hasHeaderColumn: boolean): void {
    const tableElement = this.domNode as HTMLTableElement
    const markedCells = tableElement.querySelectorAll<HTMLElement>('td[data-first-column]')

    if (!hasHeaderColumn) {
      for (const cellElement of markedCells) cellElement.removeAttribute('data-first-column')

      return
    }

    const firstColumnCells = new Set(tableGrid(tableElement).map(([firstCell]) => firstCell))

    for (const rowElement of tableElement.rows) {
      for (const cellElement of rowElement.cells) {
        setAttribute(cellElement, 'data-first-column', firstColumnCells.has(cellElement) ? '' : null)
      }
    }
  }

  html(startIndex: number, length: number): string {
    return tableHTML(this, startIndex, length)
  }

  #applyColumnWidths(columnWidths: number[] | null, isPercent: boolean): void {
    const tableElement = this.domNode as HTMLTableElement

    if (!columnWidths?.length) {
      if (this.uiNode) {
        this.uiNode.remove()
        this.uiNode = null
      }

      if (tableElement.style.width) tableElement.style.width = ''

      return
    }

    let colgroup = this.uiNode

    if (!colgroup || colgroup.tagName !== 'COLGROUP') {
      colgroup = document.createElement('colgroup')
      this.attachUI(colgroup)
    }

    while (colgroup.children.length > columnWidths.length) colgroup.lastElementChild?.remove()

    while (colgroup.children.length < columnWidths.length) colgroup.append(document.createElement('col'))

    const widthStyles = columnWidthStyles(columnWidths, isPercent)

    for (const [columnIndex, width] of widthStyles.columns.entries()) {
      setStyle(colgroup.children[columnIndex] as HTMLElement, 'width', width)
    }

    setStyle(tableElement, 'width', widthStyles.table)
  }
}

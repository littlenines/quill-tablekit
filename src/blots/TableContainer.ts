import { BLOT_NAMES, CLASS_NAMES } from '../config/constants'
import { setAttribute } from '../model/cellValue'
import { Container, sharesGroupId, splitWhereGroupIdChanges, tableIdOf, type OptimizeContext } from './grouping'
import { tableHTML } from './html'
import { firstLine } from './TableCellLine'

export class TableContainer extends Container {
  static blotName = BLOT_NAMES.table
  static tagName = 'TABLE'
  static className = CLASS_NAMES.table

  #previewWidths: number[] | null = null

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

    if (cellValue) setAttribute(this.domNode as HTMLTableElement, 'data-table', cellValue.table)

    this.#applyColumnWidths(this.#previewWidths ?? cellValue?.widths ?? null)
  }

  preview(columnWidths: number[] | null): void {
    this.#previewWidths = columnWidths
    this.syncLayout()
  }

  html(startIndex: number, length: number): string {
    return tableHTML(this, startIndex, length)
  }

  #applyColumnWidths(columnWidths: number[] | null): void {
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

    for (const [columnIndex, width] of columnWidths.entries()) {
      const columnElement = colgroup.children[columnIndex] as HTMLElement

      if (columnElement.style.width !== `${width}px`) columnElement.style.width = `${width}px`
    }

    const totalWidth = `${columnWidths.reduce((total, width) => total + width, 0)}px`

    if (tableElement.style.width !== totalWidth) tableElement.style.width = totalWidth
  }
}

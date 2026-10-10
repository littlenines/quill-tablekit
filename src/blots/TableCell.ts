import { BLOT_NAMES, CLASS_NAMES } from '../config/constants'
import { setAttribute } from '../model/cellValue'
import { setStyle } from '../utils/style'
import { cellIdOf, Container, sharesGroupId, splitWhereGroupIdChanges, type OptimizeContext } from './grouping'
import { firstLine } from './TableCellLine'

export class TableCell extends Container {
  static blotName = BLOT_NAMES.cell
  static tagName = 'TD'
  static className = CLASS_NAMES.cell

  checkMerge(): boolean {
    return super.checkMerge() && sharesGroupId(this, this.next, cellIdOf)
  }

  optimize(optimizeContext: OptimizeContext): void {
    super.optimize(optimizeContext)
    splitWhereGroupIdChanges(this, cellIdOf, optimizeContext)

    const cellValue = firstLine(this)?.cellValue

    if (!cellValue) return

    const cellElement = this.domNode as HTMLElement

    setAttribute(cellElement, 'data-cell', cellValue.cell)
    setAttribute(cellElement, 'rowspan', cellValue.rowspan > 1 ? String(cellValue.rowspan) : null)
    setAttribute(cellElement, 'colspan', cellValue.colspan > 1 ? String(cellValue.colspan) : null)
    setStyle(cellElement, 'background-color', cellValue.background)
    setStyle(cellElement, 'vertical-align', cellValue.verticalAlign)
  }
}

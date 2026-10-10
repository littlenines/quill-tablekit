import { BLOT_NAMES, CLASS_NAMES } from '../config/constants'
import { setAttribute } from '../model/cellValue'
import { setStyle } from '../utils/style'
import { Container, rowIdOf, sharesGroupId, splitWhereGroupIdChanges, type OptimizeContext } from './grouping'
import { firstLine } from './TableCellLine'

export class TableRow extends Container {
  static blotName = BLOT_NAMES.row
  static tagName = 'TR'
  static className = CLASS_NAMES.row

  checkMerge(): boolean {
    return super.checkMerge() && sharesGroupId(this, this.next, rowIdOf)
  }

  optimize(optimizeContext: OptimizeContext): void {
    super.optimize(optimizeContext)
    splitWhereGroupIdChanges(this, rowIdOf, optimizeContext)

    const cellValue = firstLine(this)?.cellValue

    if (!cellValue) return

    const rowElement = this.domNode as HTMLElement

    setAttribute(rowElement, 'data-row', cellValue.row)
    setStyle(rowElement, 'height', cellValue.rowHeight ? `${cellValue.rowHeight}px` : undefined)
  }
}

import { BLOT_NAMES, CLASS_NAMES } from '../config/constants'
import { Container, sharesGroupId, splitWhereGroupIdChanges, tableIdOf, type OptimizeContext } from './grouping'

export class TableBody extends Container {
  static blotName = BLOT_NAMES.body
  static tagName = 'TBODY'
  static className = CLASS_NAMES.body

  checkMerge(): boolean {
    return super.checkMerge() && sharesGroupId(this, this.next, tableIdOf)
  }

  optimize(optimizeContext: OptimizeContext): void {
    super.optimize(optimizeContext)
    splitWhereGroupIdChanges(this, tableIdOf, optimizeContext)
  }
}

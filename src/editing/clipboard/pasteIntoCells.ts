import type Quill from 'quill'
import { pasteTable, type PasteLimits } from '../../model/operations/paste'
import { TableModel } from '../../model/TableModel'
import type { Delta } from '../../utils/quill'
import { commitTable } from '../commands'
import type { TableContext } from '../context'

export const pasteTableIntoCells = (
  quill: Quill,
  tableContext: TableContext,
  pastedContent: Delta,
  limits: PasteLimits,
): void => {
  const { model, selectedArea } = tableContext
  const pastedTable = TableModel.fromDelta(pastedContent)
  const pastedArea = pasteTable(model, pastedTable, selectedArea.top, selectedArea.left, limits)

  commitTable(quill, tableContext, model.grid[pastedArea.top][pastedArea.left])
}

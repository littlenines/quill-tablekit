import Quill from 'quill'
import { TableBody } from './TableBody'
import { TableCell } from './TableCell'
import { TableCellLine } from './TableCellLine'
import { TableContainer } from './TableContainer'
import { TableRow } from './TableRow'

export { TableBody, TableCell, TableCellLine, TableContainer, TableRow }
export { firstLine, lastLine } from './TableCellLine'

TableCellLine.requiredContainer = TableCell
TableCell.allowedChildren = [TableCellLine]
TableCell.requiredContainer = TableRow
TableRow.allowedChildren = [TableCell]
TableRow.requiredContainer = TableBody
TableBody.allowedChildren = [TableRow]
TableBody.requiredContainer = TableContainer
TableContainer.allowedChildren = [TableBody]

export const registerBlots = (): void => {
  const tableBlots = [TableCellLine, TableCell, TableRow, TableBody, TableContainer]
  const formatsByPath = Object.fromEntries(tableBlots.map((blotClass) => [`formats/${blotClass.blotName}`, blotClass]))

  Quill.register(formatsByPath, true)
}

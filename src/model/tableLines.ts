import { CELL_FORMAT } from '../config/constants'
import { Delta } from '../utils/quill'
import type { CellData } from './cell'
import { makeId, normalizeCellValue, type TableCellValue } from './cellValue'
import type { SpannedCell } from './grid'
import { withoutEmptyValues, type CellStyle } from './properties'

export interface CellLines {
  cellValue: TableCellValue
  content: Delta
}

export interface TableRows {
  rowIds: string[]
  rowHeights: (number | undefined)[]
  rows: SpannedCell<CellData>[][]
}

const cellStyleOf = ({ background, verticalAlign }: TableCellValue): CellStyle =>
  withoutEmptyValues({ background, verticalAlign })

// A pasted or hand-written Delta can repeat an id, so a repeated one gets a new id
const uniqueId = (usedIds: Set<string>, preferredId: string, prefix: string): string => {
  const chosenId = usedIds.has(preferredId) ? makeId(prefix) : preferredId

  usedIds.add(chosenId)
  return chosenId
}

// Lines that follow each other with the same row and cell id are one cell
export const groupLinesByCell = (tableDelta: Delta): CellLines[] => {
  const cellGroups: CellLines[] = []

  tableDelta.eachLine((lineContent, lineAttributes) => {
    const cellValue = normalizeCellValue(lineAttributes[CELL_FORMAT])

    if (!cellValue) return

    const { [CELL_FORMAT]: _cellFormat, ...otherAttributes } = lineAttributes
    const hasOtherAttributes = Object.keys(otherAttributes).length > 0
    const line = new Delta(lineContent.ops).insert('\n', hasOtherAttributes ? otherAttributes : undefined)
    const previousGroup = cellGroups.at(-1)
    const isSameCell = previousGroup?.cellValue.row === cellValue.row && previousGroup.cellValue.cell === cellValue.cell

    if (previousGroup && isSameCell) previousGroup.content = previousGroup.content.concat(line)
    else cellGroups.push({ cellValue, content: line })
  })

  return cellGroups
}

export const rowsOfCells = (cellGroups: CellLines[]): TableRows => {
  const usedCellIds = new Set<string>()
  const usedRowIds = new Set<string>()
  const tableRows: TableRows = { rowIds: [], rowHeights: [], rows: [] }

  for (const [groupIndex, { cellValue, content }] of cellGroups.entries()) {
    if (cellGroups[groupIndex - 1]?.cellValue.row !== cellValue.row) {
      tableRows.rowIds.push(uniqueId(usedRowIds, cellValue.row, 'row'))
      tableRows.rowHeights.push(cellValue.rowHeight)
      tableRows.rows.push([])
    }

    tableRows.rows
      .at(-1)
      ?.push({
        cell: { id: uniqueId(usedCellIds, cellValue.cell, 'cell'), content, style: cellStyleOf(cellValue) },
        rowspan: cellValue.rowspan,
        colspan: cellValue.colspan,
      })
  }

  return tableRows
}

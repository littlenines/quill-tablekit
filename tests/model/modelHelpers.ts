import { Delta } from 'quill'
import { CELL_FORMAT } from '../../src/config/constants'
import type { TableCellValue } from '../../src/model/cellValue'
import type { CellArea } from '../../src/model/grid'
import { TableModel } from '../../src/model/TableModel'

export const cellValuesIn = (tableDelta: Delta): TableCellValue[] =>
  tableDelta.ops
    .filter((operation) => operation.attributes?.[CELL_FORMAT])
    .map((operation) => operation.attributes?.[CELL_FORMAT] as TableCellValue)

export const tableLine = (text: string, cellValue: Partial<TableCellValue> & { row: string; cell: string }): Delta =>
  new Delta().insert(text).insert('\n', { [CELL_FORMAT]: { table: 't', rowspan: 1, colspan: 1, ...cellValue } })

export const sumOf = (numbers: number[]) => numbers.reduce((total, number) => total + number, 0)

export const tableWithTexts = (rows: string[][]): TableModel => {
  const model = TableModel.create(rows.length, rows[0].length)

  for (const [rowIndex, rowTexts] of rows.entries()) {
    for (const [columnIndex, text] of rowTexts.entries()) {
      model.grid[rowIndex][columnIndex].content = new Delta().insert(`${text}\n`)
    }
  }

  return model
}

export const textsOf = (model: TableModel): string[][] =>
  model.grid.map((row) =>
    row.map((cell) =>
      cell.content.ops
        .map(({ insert }) => insert)
        .join('')
        .trim(),
    ),
  )

export const area = (top: number, left: number, bottom = top + 1, right = left + 1): CellArea => ({
  top,
  left,
  bottom,
  right,
})

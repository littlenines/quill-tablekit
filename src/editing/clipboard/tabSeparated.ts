import { Delta } from '../../utils/quill'
import { TableModel } from '../../model/TableModel'

const splitFields = (text: string): string[][] => {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let isQuoted = false
  let isFieldStart = true

  for (let index = 0; index < text.length; index++) {
    const character = text[index]

    if (isQuoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"'
        index++
      } else if (character === '"') {
        isQuoted = false
      } else {
        field += character
      }

      continue
    }

    if (character === '"' && isFieldStart) {
      isQuoted = true
      isFieldStart = false
    } else if (character === '\t' || character === '\n') {
      row.push(field)
      field = ''
      isFieldStart = true

      if (character === '\n') {
        rows.push(row)
        row = []
      }
    } else {
      field += character
      isFieldStart = false
    }
  }

  row.push(field)
  rows.push(row)

  return rows
}

// Spreadsheets quote a cell that has tabs, line breaks or quotes in it, and double the quotes inside.
// Text only counts as cells when every row has the same number of them, so indented code stays text.
export const parseTabSeparated = (text: string): string[][] | null => {
  const withUnixLineBreaks = text.replace(/\r\n?/g, '\n').replace(/\n$/, '')

  if (!withUnixLineBreaks.includes('\t')) return null

  const rows = splitFields(withUnixLineBreaks)
  const columnCount = rows[0].length
  const hasSameColumns = rows.every((row) => row.length === columnCount)
  const hasFirstColumn = rows.some(([firstField]) => firstField !== '')

  return columnCount > 1 && hasSameColumns && hasFirstColumn ? rows : null
}

export const tableFromTexts = (rows: string[][]): TableModel => {
  const model = TableModel.create(rows.length, rows[0].length)

  for (const [rowIndex, texts] of rows.entries()) {
    for (const [columnIndex, text] of texts.entries()) {
      model.grid[rowIndex][columnIndex].content = new Delta().insert(`${text}\n`)
    }
  }

  return model
}

export type ColumnAlign = 'left' | 'center' | 'right' | undefined

export type MarkdownBlock =
  { kind: 'text'; lines: string[] } | { kind: 'table'; rows: string[][]; aligns: ColumnAlign[] }

const DELIMITER_CELL = /^\s*(:?)-+(:?)\s*$/
const FENCE = /^\s*(```|~~~)/

// Splits on pipes that aren't escaped, without the pipes at the start and the end
export const splitRow = (line: string): string[] => {
  const trimmed = line.trim().replace(/^\|/, '')
  const cells: string[] = []
  let cell = ''

  for (let index = 0; index < trimmed.length; index++) {
    const character = trimmed[index]

    if (character === '\\' && trimmed[index + 1] === '|') {
      cell += '\\|'
      index++
    } else if (character === '|') {
      cells.push(cell.trim())
      cell = ''
    } else {
      cell += character
    }
  }

  if (cell.trim() !== '' || !trimmed.endsWith('|')) cells.push(cell.trim())

  return cells
}

const alignsOf = (delimiterLine: string): ColumnAlign[] | null => {
  if (!delimiterLine.includes('-')) return null

  const delimiterCells = splitRow(delimiterLine)
  const matches = delimiterCells.map((cell) => DELIMITER_CELL.exec(cell))

  if (matches.length === 0 || matches.some((match) => match == null)) return null

  return matches.map((match) => {
    const [, left, right] = match ?? []

    if (left && right) return 'center'
    if (right) return 'right'

    return left ? 'left' : undefined
  })
}

const fitToColumns = (cells: string[], columnCount: number) =>
  Array.from({ length: columnCount }, (_value, columnIndex) => cells[columnIndex] ?? '')

const isTableRow = (line: string | undefined): line is string =>
  line != null && line.trim() !== '' && line.includes('|')

// GitHub's table rules: a header row, a row of dashes with the same number of cells, then rows until a blank line.
// Tables inside ``` code blocks stay text.
export const findMarkdownTables = (text: string): MarkdownBlock[] | null => {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  const blocks: MarkdownBlock[] = []
  let textLines: string[] = []
  let isInCodeBlock = false
  let hasTable = false

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]

    if (FENCE.test(line)) isInCodeBlock = !isInCodeBlock

    const headerCells = !isInCodeBlock && isTableRow(line) ? splitRow(line) : null
    const aligns = headerCells && lines[index + 1] != null ? alignsOf(lines[index + 1]) : null

    if (!headerCells || !aligns || aligns.length !== headerCells.length) {
      textLines.push(line)
      continue
    }

    const rows = [headerCells]
    let rowIndex = index + 2

    while (isTableRow(lines[rowIndex])) {
      rows.push(fitToColumns(splitRow(lines[rowIndex]), aligns.length))
      rowIndex++
    }

    index = rowIndex - 1

    if (textLines.length > 0) blocks.push({ kind: 'text', lines: textLines })

    blocks.push({ kind: 'table', rows, aligns })
    textLines = []
    hasTable = true
  }

  if (textLines.length > 0) blocks.push({ kind: 'text', lines: textLines })

  return hasTable ? blocks : null
}

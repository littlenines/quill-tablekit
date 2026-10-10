import type Quill from 'quill'
import type { Range } from 'quill'
import { TableCellLine, TableContainer } from '../blots'
import { Delta, Parchment } from '../utils/quill'

export const lineAt = (quill: Quill, documentIndex: number): TableCellLine | null => {
  const [line] = quill.getLine(documentIndex)

  return line instanceof TableCellLine ? line : null
}

export const tableOf = (line: TableCellLine): TableContainer | null => {
  let ancestor = line.parent

  while (ancestor && !(ancestor instanceof TableContainer)) ancestor = ancestor.parent

  return ancestor ?? null
}

export const isInTable = (quill: Quill, range: Range | null): boolean =>
  range != null && lineAt(quill, range.index) != null

// A selection that ends in an empty cell ends at its very start, so that cell has no selected character
export const lastSelectedLine = (quill: Quill, { index, length }: Range): TableCellLine | null => {
  if (length === 0) return lineAt(quill, index)

  const lineAtSelectionEnd = lineAt(quill, index + length)

  if (lineAtSelectionEnd && lineAtSelectionEnd.length() <= 1) return lineAtSelectionEnd

  return lineAt(quill, index + length - 1)
}

export const pickFormats = (
  quill: Quill,
  formats: Record<string, unknown>,
  keepBlockFormats: boolean,
): Record<string, unknown> => {
  const isBlockFormat = (formatName: string) => quill.scroll.query(formatName, Parchment.Scope.BLOCK) != null

  return Object.fromEntries(
    Object.entries(formats).filter(([formatName]) => isBlockFormat(formatName) === keepBlockFormats),
  )
}

const isPartiallySelected = (quill: Quill, table: TableContainer, { index, length }: Range): boolean => {
  const tableStart = quill.getIndex(table)
  const tableEnd = tableStart + table.length()

  return !(index <= tableStart && index + length >= tableEnd)
}

export const needsTableAwareDelete = (quill: Quill, range: Range): boolean => {
  if (range.length === 0) return false

  const startLine = lineAt(quill, range.index)
  const endLine = lineAt(quill, range.index + range.length)
  const isInsideOneCell =
    startLine &&
    endLine &&
    startLine.cellValue.cell === endLine.cellValue.cell &&
    tableOf(startLine) === tableOf(endLine)

  if (isInsideOneCell) return false

  return quill.getLines(range.index, range.length).some((line) => {
    const table = line instanceof TableCellLine ? tableOf(line) : null

    return table != null && isPartiallySelected(quill, table, range)
  })
}

export const deleteSelection = (quill: Quill, range: Range): void => {
  const selectionEnd = range.index + range.length
  const removals: [removeIndex: number, removeLength: number][] = []

  for (const line of quill.getLines(range.index, range.length)) {
    const lineStart = quill.getIndex(line)
    const lineBreakIndex = lineStart + line.length() - 1
    const textStart = Math.max(range.index, lineStart)
    const textEnd = Math.min(selectionEnd, lineBreakIndex)

    if (textEnd > textStart) removals.push([textStart, textEnd - textStart])
    if (selectionEnd <= lineBreakIndex) continue

    const lineTable = line instanceof TableCellLine ? tableOf(line) : null
    const lineAfter = lineTable ? null : lineAt(quill, lineBreakIndex + 1)
    const tableToKeep = lineTable ?? (lineAfter ? tableOf(lineAfter) : null)

    if (!tableToKeep || !isPartiallySelected(quill, tableToKeep, range)) removals.push([lineBreakIndex, 1])
  }

  let deletion = new Delta()
  let position = 0

  for (const [removeIndex, removeLength] of removals) {
    deletion = deletion.retain(removeIndex - position).delete(removeLength)
    position = removeIndex + removeLength
  }

  if (deletion.ops.length > 0) quill.updateContents(deletion, 'user')

  quill.setSelection(range.index, 0, 'silent')
}

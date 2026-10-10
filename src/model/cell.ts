import { Delta } from '../utils/quill'
import { makeId } from './cellValue'
import type { CellStyle } from './properties'

export interface CellData {
  id: string
  content: Delta
  style: CellStyle
}

export const emptyCell = (style: CellStyle = {}): CellData => ({
  id: makeId('cell'),
  content: new Delta().insert('\n'),
  style: { ...style },
})

const copyOfCell = (cell: CellData): CellData => ({
  id: makeId('cell'),
  content: cell.content.slice(),
  style: { ...cell.style },
})

// Cells merged across the copied block stay merged in the copy
export const cellCopier = () => {
  const copies = new Map<CellData, CellData>()

  return (cell: CellData): CellData => {
    const copy = copies.get(cell) ?? copyOfCell(cell)

    copies.set(cell, copy)
    return copy
  }
}

export const isEmptyContent = (content: Delta) => content.length() <= 1

export const emptyContentKeepingLineFormat = (content: Delta): Delta => {
  let firstLineAttributes: Record<string, unknown> = {}

  content.eachLine((_lineContent, lineAttributes) => {
    firstLineAttributes = lineAttributes
    return false
  })

  const hasAttributes = Object.keys(firstLineAttributes).length > 0

  return new Delta().insert('\n', hasAttributes ? firstLineAttributes : undefined)
}

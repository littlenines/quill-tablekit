import { cellAreas } from '../model/grid'
import type { TableModel } from '../model/TableModel'
import type { Delta } from '../utils/quill'
import { deltaToInlineMarkdown } from './inlineMarkdown'

type ColumnAlign = 'center' | 'right' | undefined

const alignOf = (content: Delta): ColumnAlign => {
  const align = content.ops.find(
    ({ insert }) => insert === '\n' || (typeof insert === 'string' && insert.endsWith('\n')),
  )?.attributes?.align

  return align === 'center' || align === 'right' ? align : undefined
}

const delimiterOf = (align: ColumnAlign, width: number) => {
  if (align === 'center') return `:${'-'.repeat(width - 2)}:`
  if (align === 'right') return `${'-'.repeat(width - 1)}:`

  return '-'.repeat(width)
}

// Markdown has no merged cells or styles: a merged cell's text goes in its first spot, and the rest stay empty.
// The first row is always the header, since a Markdown table needs one.
export const tableMarkdown = (model: TableModel): string => {
  const areas = cellAreas(model.grid)
  const startsAt = (rowIndex: number, columnIndex: number) => {
    const area = areas.get(model.grid[rowIndex][columnIndex])

    return area?.top === rowIndex && area.left === columnIndex
  }

  const texts = model.grid.map((row, rowIndex) =>
    row.map((cell, columnIndex) => (startsAt(rowIndex, columnIndex) ? deltaToInlineMarkdown(cell.content) : '')),
  )
  const aligns = texts[0].map((_text, columnIndex) => {
    const cellAligns = new Set(
      model.grid
        .filter((_row, rowIndex) => texts[rowIndex][columnIndex] !== '')
        .map((row) => alignOf(row[columnIndex].content)),
    )

    return cellAligns.size === 1 ? [...cellAligns][0] : undefined
  })
  const widths = texts[0].map((_text, columnIndex) => Math.max(3, ...texts.map((row) => row[columnIndex].length)))
  const rowLine = (cells: string[]) =>
    `| ${cells.map((text, columnIndex) => text.padEnd(widths[columnIndex])).join(' | ')} |`
  const delimiterLine = `| ${widths.map((width, columnIndex) => delimiterOf(aligns[columnIndex], width)).join(' | ')} |`

  return [rowLine(texts[0]), delimiterLine, ...texts.slice(1).map(rowLine)].join('\n')
}

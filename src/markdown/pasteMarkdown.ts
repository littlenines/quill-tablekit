import type { PasteLimits } from '../model/operations/paste'
import { TableModel } from '../model/TableModel'
import { Delta } from '../utils/quill'
import { findMarkdownTables, type ColumnAlign, type MarkdownBlock } from './findTables'
import { inlineMarkdownToDelta } from './inlineMarkdown'

export interface MarkdownPaste {
  content: Delta
  isOneTable: boolean
}

type TableBlock = Extract<MarkdownBlock, { kind: 'table' }>

const cellContent = (text: string, align: ColumnAlign): Delta => {
  const lineFormats = align === 'center' || align === 'right' ? { align } : undefined
  let content = new Delta()

  inlineMarkdownToDelta(text)
    .insert('\n')
    .eachLine((lineContent) => {
      content = content.concat(lineContent).insert('\n', lineFormats)
    })

  return content
}

// A table without header text is pasted without a header row
const tableContent = ({ rows, aligns }: TableBlock, { maxRows, maxColumns }: PasteLimits): Delta => {
  const hasHeaderText = rows[0].some((text) => text !== '')
  const keptRows = (hasHeaderText || rows.length === 1 ? rows : rows.slice(1)).slice(0, maxRows)
  const columnCount = Math.min(aligns.length, maxColumns)
  const model = TableModel.create(keptRows.length, columnCount)

  model.header = hasHeaderText

  for (const [rowIndex, texts] of keptRows.entries()) {
    for (const [columnIndex, text] of texts.slice(0, columnCount).entries()) {
      model.grid[rowIndex][columnIndex].content = cellContent(text, aligns[columnIndex])
    }
  }

  return model.toDelta()
}

const withoutBlankEdges = (lines: string[]) => {
  const isBlank = (line: string) => line.trim() === ''
  const first = lines.findIndex((line) => !isBlank(line))

  return first < 0 ? [] : lines.slice(first, lines.findLastIndex((line) => !isBlank(line)) + 1)
}

// The text around the tables stays plain text, and two tables get an empty line between them
export const markdownPaste = (text: string, limits: PasteLimits): MarkdownPaste | null => {
  const blocks = findMarkdownTables(text)

  if (!blocks) return null

  let content = new Delta()
  let tableCount = 0
  let hasText = false

  for (const [blockIndex, block] of blocks.entries()) {
    const nextBlock = blocks[blockIndex + 1]

    if (block.kind === 'table') {
      content = content.concat(tableContent(block, limits))
      tableCount++
      continue
    }

    const lines = withoutBlankEdges(block.lines)

    if (lines.length > 0) {
      hasText = true
      content = content.insert(lines.join('\n') + (nextBlock ? '\n' : ''))
    } else if (blockIndex > 0 && nextBlock) {
      content = content.insert('\n')
    }
  }

  return { content, isOneTable: tableCount === 1 && !hasText }
}

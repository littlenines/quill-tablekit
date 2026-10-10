import type Quill from 'quill'
import { readCellValue } from '../model/cellValue'
import type { TableAlign } from '../model/properties'
import { cellAreas, combineAreas, expandToWholeCells, placeCells, type CellArea } from '../model/grid'
import { indexes } from '../utils/array'

export type DomGrid = (HTMLTableCellElement | null)[][]

const FALLBACK_COLUMN_WIDTH = 100
const TABLE_BORDER_ALLOWANCE = 2

export const tableGrid = (tableElement: HTMLTableElement): DomGrid => {
  const rows = Array.from(tableElement.rows, (rowElement) =>
    Array.from(rowElement.cells, (cellElement) => ({
      cell: cellElement as HTMLTableCellElement | null,
      rowspan: cellElement.rowSpan,
      colspan: cellElement.colSpan,
    })),
  )

  return placeCells(rows, () => null)
}

export const areaBetweenCells = (
  grid: DomGrid,
  startCell: HTMLTableCellElement,
  endCell: HTMLTableCellElement,
): CellArea | null => {
  const areas = cellAreas(grid)
  const startArea = areas.get(startCell)
  const endArea = areas.get(endCell)

  return startArea && endArea ? expandToWholeCells(grid, combineAreas(startArea, endArea), areas) : null
}

export const boundingBoxOf = (cellElements: Iterable<HTMLTableCellElement | null>): DOMRect | null => {
  const cellBoxes = [...cellElements].flatMap((cellElement) =>
    cellElement ? [cellElement.getBoundingClientRect()] : [],
  )

  if (cellBoxes.length === 0) return null

  const left = Math.min(...cellBoxes.map((cellBox) => cellBox.left))
  const top = Math.min(...cellBoxes.map((cellBox) => cellBox.top))
  const right = Math.max(...cellBoxes.map((cellBox) => cellBox.right))
  const bottom = Math.max(...cellBoxes.map((cellBox) => cellBox.bottom))

  return new DOMRect(left, top, right - left, bottom - top)
}

export const toContainerPosition = (
  container: HTMLElement,
  clientX: number,
  clientY: number,
): { left: number; top: number } => {
  const containerBox = container.getBoundingClientRect()

  return {
    left: clientX - containerBox.left - container.clientLeft + container.scrollLeft,
    top: clientY - containerBox.top - container.clientTop + container.scrollTop,
  }
}

export const measureColumnWidths = (grid: DomGrid): number[] => {
  const columnCount = grid[0]?.length ?? 0
  const edgePositions: (number | undefined)[] = indexes(columnCount + 1).map(() => undefined)

  for (const [cellElement, area] of cellAreas(grid)) {
    if (!cellElement) continue

    const cellBox = cellElement.getBoundingClientRect()

    edgePositions[area.left] ??= cellBox.left
    edgePositions[area.right] ??= cellBox.right
  }

  const tableLeft = edgePositions[0]
  const tableRight = edgePositions[columnCount]

  if (tableLeft === undefined || tableRight === undefined || tableRight <= tableLeft) {
    return indexes(columnCount).map(() => FALLBACK_COLUMN_WIDTH)
  }

  for (let edgeIndex = 1; edgeIndex < columnCount; edgeIndex++) {
    if (edgePositions[edgeIndex] !== undefined) continue

    let nextKnownEdge = edgeIndex + 1

    while (edgePositions[nextKnownEdge] === undefined) nextKnownEdge++

    const previousPosition = edgePositions[edgeIndex - 1] as number
    const nextPosition = edgePositions[nextKnownEdge] as number

    edgePositions[edgeIndex] = previousPosition + (nextPosition - previousPosition) / (nextKnownEdge - edgeIndex + 1)
  }

  return indexes(columnCount).map((columnIndex) => {
    const width = (edgePositions[columnIndex + 1] as number) - (edgePositions[columnIndex] as number)

    return Math.max(1, Math.round(width))
  })
}

export const measureRowHeights = (tableElement: HTMLTableElement): number[] =>
  Array.from(tableElement.rows, (rowElement) => Math.round(rowElement.getBoundingClientRect().height))

export const savedRowHeights = (tableElement: HTMLTableElement): (number | undefined)[] =>
  Array.from(tableElement.rows, (rowElement) => {
    const firstLineElement = rowElement.querySelector<HTMLElement>('.qlt-cell-line')

    return firstLineElement ? readCellValue(firstLineElement)?.rowHeight : undefined
  })

const naturalCellHeight = (cellElement: HTMLTableCellElement): number => {
  const contentRange = document.createRange()

  contentRange.selectNodeContents(cellElement)

  const { paddingTop, paddingBottom, borderTopWidth, borderBottomWidth } = getComputedStyle(cellElement)
  const spacing = [paddingTop, paddingBottom, borderTopWidth, borderBottomWidth].map(
    (value) => Number.parseFloat(value) || 0,
  )

  return contentRange.getBoundingClientRect().height + spacing.reduce((total, value) => total + value, 0)
}

export const naturalRowHeight = (rowElement: HTMLTableRowElement, minHeight: number): number => {
  const singleRowCells = Array.from(rowElement.cells).filter((cellElement) => cellElement.rowSpan === 1)

  return Math.ceil(Math.max(minHeight, ...singleRowCells.map(naturalCellHeight)))
}

export const editorContentWidth = (quill: Quill): number => {
  const { paddingLeft, paddingRight } = getComputedStyle(quill.root)
  const contentWidth =
    quill.root.clientWidth - (Number.parseFloat(paddingLeft) || 0) - (Number.parseFloat(paddingRight) || 0)

  return contentWidth > 0 ? Math.floor(contentWidth) - TABLE_BORDER_ALLOWANCE : Infinity
}

export const tableAlignmentOf = ({ style }: HTMLTableElement): TableAlign => {
  if (style.marginLeft !== 'auto') return 'left'

  return style.marginRight === 'auto' ? 'center' : 'right'
}

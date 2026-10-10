import { indexes } from '../utils/array'

export interface CellArea {
  top: number
  left: number
  bottom: number
  right: number
}

export interface SpannedCell<Cell> {
  cell: Cell
  rowspan: number
  colspan: number
}

export const placeCells = <Cell>(rows: SpannedCell<Cell>[][], createFiller: () => Cell): Cell[][] => {
  const grid: (Cell | undefined)[][] = rows.map(() => [])

  const isFree = (rowIndex: number, columnIndex: number, width: number) =>
    indexes(width).every((offset) => grid[rowIndex][columnIndex + offset] === undefined)

  for (const [rowIndex, row] of rows.entries()) {
    let columnIndex = 0

    for (const { cell, rowspan, colspan } of row) {
      while (grid[rowIndex][columnIndex] !== undefined) columnIndex++

      let width = 1

      while (width < colspan && grid[rowIndex][columnIndex + width] === undefined) width++

      let height = 1
      const maxHeight = Math.min(Math.max(1, rowspan), rows.length - rowIndex)

      while (height < maxHeight && isFree(rowIndex + height, columnIndex, width)) height++

      for (const rowOffset of indexes(height)) {
        for (const columnOffset of indexes(width)) grid[rowIndex + rowOffset][columnIndex + columnOffset] = cell
      }

      columnIndex += width
    }
  }

  const columnCount = Math.max(0, ...grid.map((row) => row.length))

  return grid.map((row) => indexes(columnCount).map((columnIndex) => row[columnIndex] ?? createFiller()))
}

export const cellAreas = <Cell>(grid: Cell[][]): Map<Cell, CellArea> => {
  const areas = new Map<Cell, CellArea>()

  for (const [rowIndex, row] of grid.entries()) {
    for (const [columnIndex, cell] of row.entries()) {
      const area = areas.get(cell)

      if (area) {
        area.bottom = Math.max(area.bottom, rowIndex + 1)
        area.right = Math.max(area.right, columnIndex + 1)
      } else {
        areas.set(cell, { top: rowIndex, left: columnIndex, bottom: rowIndex + 1, right: columnIndex + 1 })
      }
    }
  }

  return areas
}

export const expandToWholeCells = <Cell>(grid: Cell[][], area: CellArea, areas = cellAreas(grid)): CellArea => {
  let expanded = { ...area }
  let grew = true

  while (grew) {
    const grown = cellsInArea(grid, expanded).reduce((combined, cell) => {
      const cellArea = areas.get(cell)

      return cellArea ? combineAreas(combined, cellArea) : combined
    }, expanded)

    grew = !isSameArea(grown, expanded)
    expanded = grown
  }

  return expanded
}

const isSameArea = (first: CellArea, second: CellArea) =>
  first.top === second.top &&
  first.left === second.left &&
  first.bottom === second.bottom &&
  first.right === second.right

export const combineAreas = (first: CellArea, second: CellArea): CellArea => ({
  top: Math.min(first.top, second.top),
  left: Math.min(first.left, second.left),
  bottom: Math.max(first.bottom, second.bottom),
  right: Math.max(first.right, second.right),
})

export const cellsInArea = <Cell>(grid: Cell[][], { top, left, bottom, right }: CellArea): Cell[] => {
  const positionsInArea = grid.slice(top, bottom).flatMap((row) => row.slice(left, right))

  return [...new Set(positionsInArea)]
}

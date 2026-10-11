import type { Delta } from '../../utils/quill'
import { indexes } from '../../utils/array'
import { cellAreas } from '../grid'
import type { TableModel } from '../TableModel'
import { compareSortKeys, sortKeysOf, validLocale } from './sortKeys'

export type SortOrder = 'ascending' | 'descending'

const textOf = (content: Delta): string =>
  content.ops
    .map(({ insert }) => (typeof insert === 'string' ? insert : ''))
    .join('')
    .replaceAll('\n', ' ')
    .trim()

const firstSortedRow = (model: TableModel) => (model.header ? 1 : 0)

// A cell spanning several rows would be cut apart by sorting
export const canSortRows = (model: TableModel): boolean => {
  const top = firstSortedRow(model)

  if (model.rowCount - top < 2) return false

  return [...cellAreas(model.grid).values()].every(({ top: cellTop, bottom }) => bottom - cellTop === 1)
}

// Empty cells go last in both orders, and rows with the same text keep their order.
// The language decides how numbers and ambiguous dates are read, and the order of letters.
export const sortRows = (model: TableModel, column: number, order: SortOrder, language?: string): boolean => {
  if (!canSortRows(model) || column < 0 || column >= model.columnCount) return false

  const top = firstSortedRow(model)
  const locale = validLocale(language)
  const compare = compareSortKeys(new Intl.Collator(locale, { numeric: true, sensitivity: 'base' }))
  const direction = order === 'ascending' ? 1 : -1
  const rowIndexes = indexes(model.rowCount - top).map((offset) => top + offset)
  const keys = sortKeysOf(
    rowIndexes.map((rowIndex) => textOf(model.grid[rowIndex][column].content)),
    locale,
  )

  const sortedPositions = indexes(keys.length).sort((firstPosition, secondPosition) => {
    const firstKey = keys[firstPosition]
    const secondKey = keys[secondPosition]
    const firstIsEmpty = firstKey.kind === 'empty'
    const secondIsEmpty = secondKey.kind === 'empty'

    if (firstIsEmpty || secondIsEmpty) return Number(firstIsEmpty) - Number(secondIsEmpty)

    return direction * compare(firstKey, secondKey)
  })

  const reorder = <Value>(values: Value[]) =>
    values.splice(top, sortedPositions.length, ...sortedPositions.map((position) => values[top + position]))

  reorder(model.grid)
  reorder(model.rowIds)
  reorder(model.rowHeights)

  return true
}

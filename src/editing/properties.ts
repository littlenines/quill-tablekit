import {
  normalizeColor,
  normalizeTableAlign,
  normalizeTextAlign,
  normalizeVerticalAlign,
  type CellProperties,
  type TableProperties,
} from '../model/properties'
import type { TableModel } from '../model/TableModel'
import type { TableContext } from './context'

export type TableChange = (tableContext: TableContext) => void

const allCellsOf = (model: TableModel) => model.orderedCells().map(({ cell }) => cell)

export const changeCellProperties =
  ({ background, verticalAlign, textAlign }: Partial<CellProperties>): TableChange =>
  ({ model, selectedArea }) => {
    const selectedCells = model.cellsInArea(selectedArea)

    if (background !== undefined) model.updateCellStyle(selectedCells, { background: normalizeColor(background) })

    if (verticalAlign !== undefined) {
      model.updateCellStyle(selectedCells, { verticalAlign: normalizeVerticalAlign(verticalAlign) })
    }

    if (textAlign !== undefined) model.setTextAlign(selectedCells, normalizeTextAlign(textAlign))
  }

export const changeTableProperties =
  ({ header, align, borderColor, background }: Partial<TableProperties>): TableChange =>
  ({ model }) => {
    if (header !== undefined) model.header = header
    if (align !== undefined) model.tableAlign = normalizeTableAlign(align)
    if (borderColor !== undefined) model.borderColor = normalizeColor(borderColor)
    if (background !== undefined) model.updateCellStyle(allCellsOf(model), { background: normalizeColor(background) })
  }

export const readCellProperties = ({ startCell }: TableContext): CellProperties => {
  let firstLineAlign: unknown

  startCell.content.eachLine((_lineContent, lineAttributes) => {
    firstLineAlign = lineAttributes.align
    return false
  })

  return {
    background: startCell.style.background ?? null,
    verticalAlign: startCell.style.verticalAlign ?? 'top',
    textAlign: normalizeTextAlign(firstLineAlign) ?? 'left',
  }
}

export const readTableProperties = ({ model }: TableContext): TableProperties => {
  const backgrounds = new Set(allCellsOf(model).map(({ style }) => style.background))
  const sharedBackground = backgrounds.size === 1 ? [...backgrounds][0] : undefined

  return {
    header: model.header,
    align: model.tableAlign ?? 'left',
    borderColor: model.borderColor ?? null,
    background: sharedBackground ?? null,
  }
}

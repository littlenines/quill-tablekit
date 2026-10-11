import { setTextAlign, updateCellStyle } from '../model/cellChanges'
import {
  normalizeBorderStyle,
  normalizeCaption,
  normalizeCaptionSide,
  normalizeCellPadding,
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

    if (background !== undefined) updateCellStyle(selectedCells, { background: normalizeColor(background) })

    if (verticalAlign !== undefined) {
      updateCellStyle(selectedCells, { verticalAlign: normalizeVerticalAlign(verticalAlign) })
    }

    if (textAlign !== undefined) setTextAlign(selectedCells, normalizeTextAlign(textAlign))
  }

export const changeTableProperties =
  (changes: Partial<TableProperties>): TableChange =>
  ({ model }) => {
    const { header, headerColumn, align, borderColor, borderStyle, cellPadding, striped, stripeColor } = changes
    const { background, caption, captionSide } = changes

    if (header !== undefined) model.header = header
    if (headerColumn !== undefined) model.headerColumn = headerColumn
    if (align !== undefined) model.tableAlign = normalizeTableAlign(align)
    if (borderColor !== undefined) model.borderColor = normalizeColor(borderColor)
    if (borderStyle !== undefined) model.borderStyle = normalizeBorderStyle(borderStyle)
    if (cellPadding !== undefined) model.cellPadding = normalizeCellPadding(cellPadding)
    if (striped !== undefined) model.striped = striped
    if (stripeColor !== undefined) model.stripeColor = normalizeColor(stripeColor)
    if (caption !== undefined) model.caption = normalizeCaption(caption)
    if (captionSide !== undefined) model.captionSide = normalizeCaptionSide(captionSide)
    if (background !== undefined) updateCellStyle(allCellsOf(model), { background: normalizeColor(background) })
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
    headerColumn: model.headerColumn,
    align: model.tableAlign ?? 'left',
    borderColor: model.borderColor ?? null,
    borderStyle: model.borderStyle ?? 'solid',
    cellPadding: model.cellPadding ?? 'normal',
    striped: model.striped,
    stripeColor: model.stripeColor ?? null,
    background: sharedBackground ?? null,
    caption: model.caption ?? '',
    captionSide: model.captionSide ?? 'top',
  }
}

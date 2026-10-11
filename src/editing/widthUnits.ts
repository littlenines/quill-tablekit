import type Quill from 'quill'
import type { TableModel } from '../model/TableModel'
import { editorInnerWidth } from '../utils/editorWidth'

// Without layout (tests, hidden editors) 1% counts as 1px, so percent widths go back unchanged
const UNKNOWN_EDITOR_WIDTH = 100

const roundToHundredths = (number: number) => Math.round(number * 100) / 100

export const percentBasis = (quill: Quill): number => {
  const editorWidth = editorInnerWidth(quill)

  return Number.isFinite(editorWidth) ? editorWidth : UNKNOWN_EDITOR_WIDTH
}

// The model always works in px, so percent widths are turned into px while a table is edited
export const useLayoutPixels = (model: TableModel, basis: number): void => {
  if (model.widthUnit !== 'percent' || !model.columnWidths) return

  model.columnWidths = model.columnWidths.map((percent) => (percent * basis) / 100)
}

export const widthsToSave = (model: TableModel, basis: number): number[] | null => {
  if (model.widthUnit !== 'percent' || !model.columnWidths) return model.columnWidths

  return model.columnWidths.map((width) => roundToHundredths((width / basis) * 100))
}

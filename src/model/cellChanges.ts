import { Delta } from '../utils/quill'
import { emptyContentKeepingLineFormat, type CellData } from './cell'
import { withoutEmptyValues, type CellStyle, type TextAlign } from './properties'

export type CellStyleChanges = { [Field in keyof CellStyle]?: CellStyle[Field] | null }

export const updateCellStyle = (cells: CellData[], styleChanges: CellStyleChanges): void => {
  for (const cell of cells) cell.style = withoutEmptyValues({ ...cell.style, ...styleChanges })
}

export const setTextAlign = (cells: CellData[], textAlign: TextAlign | undefined): void => {
  for (const cell of cells) {
    let alignedContent = new Delta()

    cell.content.eachLine((lineContent, { align: _previousAlign, ...otherAttributes }) => {
      const lineAttributes = textAlign ? { ...otherAttributes, align: textAlign } : otherAttributes
      const hasAttributes = Object.keys(lineAttributes).length > 0

      alignedContent = alignedContent.concat(lineContent).insert('\n', hasAttributes ? lineAttributes : undefined)
    })

    cell.content = alignedContent
  }
}

export const clearContent = (cells: CellData[]): void => {
  for (const cell of cells) cell.content = emptyContentKeepingLineFormat(cell.content)
}

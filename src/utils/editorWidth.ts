import type Quill from 'quill'

const TABLE_BORDER_ALLOWANCE = 2

// The width a table with width: 100% gets, or Infinity when the editor isn't laid out
export const editorInnerWidth = (quill: Quill): number => {
  const { paddingLeft, paddingRight } = getComputedStyle(quill.root)
  const contentWidth =
    quill.root.clientWidth - (Number.parseFloat(paddingLeft) || 0) - (Number.parseFloat(paddingRight) || 0)

  return contentWidth > 0 ? contentWidth : Infinity
}

// The widest a table can be dragged without the editor scrolling sideways
export const editorContentWidth = (quill: Quill): number => {
  const innerWidth = editorInnerWidth(quill)

  return Number.isFinite(innerWidth) ? Math.floor(innerWidth) - TABLE_BORDER_ALLOWANCE : Infinity
}

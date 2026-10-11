export interface TableKitLabels {
  insertTable: string
  customSize: string
  rowsInput: string
  columnsInput: string
  insertButton: string
  insertRowAbove: string
  insertRowBelow: string
  insertColumnLeft: string
  insertColumnRight: string
  moveRowUp: string
  moveRowDown: string
  moveColumnLeft: string
  moveColumnRight: string
  duplicateRow: string
  duplicateColumn: string
  equalColumnWidths: string
  fitToContent: string
  fitToWidth: string
  equalRowHeights: string
  insertParagraphAbove: string
  insertParagraphBelow: string
  selectRow: string
  selectColumn: string
  copyTable: string
  mergeCells: string
  splitCell: string
  headerRow: string
  headerColumn: string
  cellProperties: string
  tableProperties: string
  deleteRow: string
  deleteColumn: string
  deleteTable: string
  background: string
  borderColor: string
  borderStyle: string
  borderSolid: string
  borderDashed: string
  borderNone: string
  cellPadding: string
  paddingCompact: string
  paddingNormal: string
  paddingWide: string
  stripedRows: string
  stripeColor: string
  defaultColor: string
  caption: string
  captionSide: string
  noColor: string
  customColor: string
  colorCode: string
  textAlign: string
  verticalAlign: string
  tableAlign: string
  alignLeft: string
  alignCenter: string
  alignRight: string
  alignJustify: string
  alignTop: string
  alignMiddle: string
  alignBottom: string
  actionBar: string
  rowsGroup: string
  columnsGroup: string
  moreGroup: string
}

export const DEFAULT_LABELS = {
  insertTable: 'Insert table',
  customSize: 'Custom size',
  rowsInput: 'Rows',
  columnsInput: 'Columns',
  insertButton: 'Insert',
  insertRowAbove: 'Insert row above',
  insertRowBelow: 'Insert row below',
  insertColumnLeft: 'Insert column left',
  insertColumnRight: 'Insert column right',
  moveRowUp: 'Move row up',
  moveRowDown: 'Move row down',
  moveColumnLeft: 'Move column left',
  moveColumnRight: 'Move column right',
  duplicateRow: 'Duplicate row',
  duplicateColumn: 'Duplicate column',
  equalColumnWidths: 'Equal column widths',
  fitToContent: 'Fit columns to content',
  fitToWidth: 'Fit table to width',
  equalRowHeights: 'Equal row heights',
  insertParagraphAbove: 'Insert paragraph above table',
  insertParagraphBelow: 'Insert paragraph below table',
  selectRow: 'Select row',
  selectColumn: 'Select column',
  copyTable: 'Copy table',
  mergeCells: 'Merge cells',
  splitCell: 'Split cell',
  headerRow: 'Header row',
  headerColumn: 'Header column',
  cellProperties: 'Cell properties',
  tableProperties: 'Table properties',
  deleteRow: 'Delete row',
  deleteColumn: 'Delete column',
  deleteTable: 'Delete table',
  background: 'Background',
  borderColor: 'Border color',
  borderStyle: 'Borders',
  borderSolid: 'Solid',
  borderDashed: 'Dashed',
  borderNone: 'None',
  cellPadding: 'Cell spacing',
  paddingCompact: 'Compact',
  paddingNormal: 'Normal',
  paddingWide: 'Wide',
  stripedRows: 'Striped rows',
  stripeColor: 'Stripe color',
  defaultColor: 'Default',
  caption: 'Caption',
  captionSide: 'Caption position',
  noColor: 'No color',
  customColor: 'Custom color',
  colorCode: 'Color code',
  textAlign: 'Text alignment',
  verticalAlign: 'Vertical alignment',
  tableAlign: 'Table alignment',
  alignLeft: 'Left',
  alignCenter: 'Center',
  alignRight: 'Right',
  alignJustify: 'Justify',
  alignTop: 'Top',
  alignMiddle: 'Middle',
  alignBottom: 'Bottom',
  actionBar: 'Table actions',
  rowsGroup: 'Rows',
  columnsGroup: 'Columns',
  moreGroup: 'More',
} satisfies TableKitLabels

import type TableKit from '../../TableKit'
import type { TableMenuActions } from './tableMenuItems'

interface PanelOpeners {
  openCellProperties: () => void
  openTableProperties: () => void
}

// What each menu item and action bar button runs. Everything except the panels is a TableKit method.
export const menuActions = (tableKit: TableKit, { openCellProperties, openTableProperties }: PanelOpeners) =>
  ({
    insertRowAbove: () => tableKit.insertRowAbove(),
    insertRowBelow: () => tableKit.insertRowBelow(),
    insertColumnLeft: () => tableKit.insertColumnLeft(),
    insertColumnRight: () => tableKit.insertColumnRight(),
    moveRowUp: () => tableKit.moveRowUp(),
    moveRowDown: () => tableKit.moveRowDown(),
    moveColumnLeft: () => tableKit.moveColumnLeft(),
    moveColumnRight: () => tableKit.moveColumnRight(),
    duplicateRow: () => tableKit.duplicateRow(),
    duplicateColumn: () => tableKit.duplicateColumn(),
    equalColumnWidths: () => tableKit.equalizeColumnWidths(),
    fitToContent: () => tableKit.fitColumnsToContent(),
    fitToWidth: () => tableKit.fitTableToWidth(),
    equalRowHeights: () => tableKit.equalizeRowHeights(),
    insertParagraphAbove: () => tableKit.insertParagraphAbove(),
    insertParagraphBelow: () => tableKit.insertParagraphBelow(),
    selectRow: () => tableKit.selectRow(),
    selectColumn: () => tableKit.selectColumn(),
    copyTable: () => void tableKit.copyTable(),
    mergeCells: () => tableKit.mergeCells(),
    splitCell: () => tableKit.splitCell(),
    headerRow: () => tableKit.setTableProperties({ header: !tableKit.getTableProperties()?.header }),
    headerColumn: () => tableKit.setTableProperties({ headerColumn: !tableKit.getTableProperties()?.headerColumn }),
    cellProperties: openCellProperties,
    tableProperties: openTableProperties,
    deleteRow: () => tableKit.deleteRow(),
    deleteColumn: () => tableKit.deleteColumn(),
    deleteTable: () => tableKit.deleteTable(),
  }) satisfies TableMenuActions

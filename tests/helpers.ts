import Quill, { Delta } from 'quill'
import TableKit, { type TableKitOptions } from '../src'
import { CELL_FORMAT } from '../src/config/constants'
import type { TableCellValue } from '../src/model/cellValue'

Quill.register('modules/tableKit', TableKit)

export const setup = (tableKitOptions: TableKitOptions = {}) => {
  const host = document.createElement('div')
  const editorElement = document.createElement('div')

  host.append(editorElement)
  document.body.append(host)

  const quill = new Quill(editorElement, {
    theme: 'snow',
    modules: { toolbar: [['bold'], ['table']], tableKit: tableKitOptions },
  })
  const tableKit = quill.getModule('tableKit') as TableKit

  return { quill, tableKit, host }
}

export const setupWithTable = (rowCount: number, columnCount: number, tableKitOptions: TableKitOptions = {}) => {
  const editor = setup(tableKitOptions)

  editor.quill.setSelection(0, 0)
  editor.tableKit.insertTable(rowCount, columnCount)

  return editor
}

export const tables = (quill: Quill) => [...quill.root.querySelectorAll('table')]

export const cells = (quill: Quill) => [...quill.root.querySelectorAll('td')]

export const shape = (quill: Quill): number[][] => {
  const [tableElement] = tables(quill)

  return [...tableElement.rows].map((rowElement) =>
    [...rowElement.cells].map((cellElement) => cellElement.colSpan * 10 + cellElement.rowSpan),
  )
}

export const cellLines = (quill: Quill): TableCellValue[] =>
  quill
    .getContents()
    .ops.flatMap((operation) =>
      operation.attributes?.[CELL_FORMAT] ? [operation.attributes[CELL_FORMAT] as TableCellValue] : [],
    )

export const cellIndex = (quill: Quill, cellNumber: number): number => {
  const firstParagraph = cells(quill)[cellNumber].querySelector('p') as HTMLElement

  return quill.getIndex(Quill.find(firstParagraph) as never)
}

export const press = (quill: Quill, key: string, modifierKeys: KeyboardEventInit = {}) => {
  quill.root.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...modifierKeys }))
}

export const paste = (
  quill: Quill,
  clipboardContent: { 'text/plain'?: string; 'text/html'?: string },
): ClipboardEvent => {
  const pasteEvent = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent

  Object.defineProperty(pasteEvent, 'clipboardData', {
    value: { getData: (mimeType: keyof typeof clipboardContent) => clipboardContent[mimeType] ?? '', files: [] },
  })
  quill.root.dispatchEvent(pasteEvent)

  return pasteEvent
}

export const cellAttributes = (cellValue: Partial<TableCellValue> & Pick<TableCellValue, 'row' | 'cell'>) => ({
  [CELL_FORMAT]: { table: 't1', rowspan: 1, colspan: 1, ...cellValue },
})

export const savedDocument = (extraCellValue: Partial<TableCellValue> = {}) =>
  new Delta()
    .insert('Title\n')
    .insert('Region')
    .insert('\n', cellAttributes({ row: 'r1', cell: 'region', colspan: 2, ...extraCellValue }))
    .insert('North')
    .insert('\n', cellAttributes({ row: 'r2', cell: 'north', ...extraCellValue }))
    .insert('10')
    .insert('\n', cellAttributes({ row: 'r2', cell: 'amount', ...extraCellValue }))

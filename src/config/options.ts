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
  mergeCells: string
  splitCell: string
  deleteRow: string
  deleteColumn: string
  deleteTable: string
}

export interface TableKitOptions {
  pickerRows?: number
  pickerColumns?: number
  maxRows?: number
  maxColumns?: number
  contextMenu?: boolean
  resizable?: boolean
  minColumnWidth?: number
  labels?: Partial<TableKitLabels>
}

export type ResolvedTableKitOptions = Required<Omit<TableKitOptions, 'labels'>> & { labels: TableKitLabels }

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
  mergeCells: 'Merge cells',
  splitCell: 'Split cell',
  deleteRow: 'Delete row',
  deleteColumn: 'Delete column',
  deleteTable: 'Delete table',
} satisfies TableKitLabels

export const DEFAULT_OPTIONS = {
  pickerRows: 8,
  pickerColumns: 10,
  maxRows: 100,
  maxColumns: 30,
  contextMenu: true,
  resizable: true,
  minColumnWidth: 40,
  labels: DEFAULT_LABELS,
} satisfies ResolvedTableKitOptions

const positiveWholeNumberOr = (input: unknown, fallback: number) =>
  typeof input === 'number' && Number.isFinite(input) && input >= 1 ? Math.floor(input) : fallback

export const resolveOptions = (userOptions: TableKitOptions = {}): ResolvedTableKitOptions => ({
  pickerRows: positiveWholeNumberOr(userOptions.pickerRows, DEFAULT_OPTIONS.pickerRows),
  pickerColumns: positiveWholeNumberOr(userOptions.pickerColumns, DEFAULT_OPTIONS.pickerColumns),
  maxRows: positiveWholeNumberOr(userOptions.maxRows, DEFAULT_OPTIONS.maxRows),
  maxColumns: positiveWholeNumberOr(userOptions.maxColumns, DEFAULT_OPTIONS.maxColumns),
  contextMenu: userOptions.contextMenu ?? DEFAULT_OPTIONS.contextMenu,
  resizable: userOptions.resizable ?? DEFAULT_OPTIONS.resizable,
  minColumnWidth: positiveWholeNumberOr(userOptions.minColumnWidth, DEFAULT_OPTIONS.minColumnWidth),
  labels: { ...DEFAULT_LABELS, ...userOptions.labels },
})

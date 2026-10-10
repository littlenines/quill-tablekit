export const CELL_FORMAT = 'tablekit-cell'

export const BLOT_NAMES = {
  cellLine: CELL_FORMAT,
  cell: 'tablekit-td',
  row: 'tablekit-tr',
  body: 'tablekit-tbody',
  table: 'tablekit-table',
} as const

export const CLASS_NAMES = {
  cellLine: 'qlt-cell-line',
  cell: 'qlt-cell',
  row: 'qlt-row',
  body: 'qlt-body',
  table: 'qlt-table',
} as const

export const HEADER_BACKGROUND = '#f3f4f6'
export const BORDER_COLOR = '#c8ccd1'
export const MIN_ROW_HEIGHT = 20
export const STRIPE_BACKGROUND = '#f6f8fa'

export const CELL_PADDING_STYLES = { compact: '2px 6px', normal: '4px 8px', wide: '8px 12px' } as const

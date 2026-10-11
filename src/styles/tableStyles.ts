import { BORDER_COLOR, CELL_PADDING_STYLES, HEADER_BACKGROUND, STRIPE_BACKGROUND } from '../config/constants'

export const TABLE_STYLES = `
.ql-editor table.qlt-table {
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
  margin: 0;
}

.ql-editor table.qlt-table > colgroup {
  position: static;
}

.ql-editor table.qlt-table td.qlt-cell {
  border: 1px solid var(--qlt-border, ${BORDER_COLOR});
  padding: ${CELL_PADDING_STYLES.normal};
  vertical-align: top;
  overflow-wrap: anywhere;
}

.ql-editor table.qlt-table[data-border-style='dashed'] td.qlt-cell {
  border-style: dashed;
}

.ql-editor table.qlt-table[data-border-style='none'] td.qlt-cell {
  border: 1px dashed var(--qlt-guide, rgba(0, 0, 0, 0.12));
}

.ql-editor table.qlt-table[data-cell-padding='compact'] td.qlt-cell {
  padding: ${CELL_PADDING_STYLES.compact};
}

.ql-editor table.qlt-table[data-cell-padding='wide'] td.qlt-cell {
  padding: ${CELL_PADDING_STYLES.wide};
}

.ql-editor table.qlt-table[data-striped]:not([data-header]) > tbody > tr:nth-child(even) > td.qlt-cell:not([data-first-column]),
.ql-editor table.qlt-table[data-striped][data-header] > tbody > tr:nth-child(odd):not(:first-child) > td.qlt-cell:not([data-first-column]) {
  background-color: var(--qlt-table-stripe, var(--qlt-stripe-bg, ${STRIPE_BACKGROUND}));
}

.ql-editor table.qlt-table[data-caption]::before {
  content: attr(data-caption);
  display: table-caption;
  caption-side: top;
  padding: 4px 0;
  text-align: center;
  color: #555;
}

.ql-editor table.qlt-table[data-caption][data-caption-side='bottom']::before {
  caption-side: bottom;
}

.ql-editor table.qlt-table[data-header] > tbody > tr:first-child > td.qlt-cell,
.ql-editor table.qlt-table[data-header-column] td.qlt-cell[data-first-column] {
  font-weight: bold;
  background-color: var(--qlt-header-bg, ${HEADER_BACKGROUND});
}

.qlt-measuring {
  position: absolute !important;
  top: 0;
  left: 0;
  width: 10000px !important;
  height: auto !important;
  overflow: hidden !important;
  visibility: hidden;
  pointer-events: none;
}

.qlt-measuring table.qlt-table {
  table-layout: auto;
  width: auto;
  margin: 0;
}
`.trim()

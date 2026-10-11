import { BORDER_COLOR, CELL_PADDING_STYLES, HEADER_BACKGROUND, STRIPE_BACKGROUND } from '../config/constants'

export const CSS = `
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

.qlt-cells-selected .qlt-table ::selection {
  background: transparent;
}

.qlt-selection {
  position: absolute;
  z-index: 5;
  display: none;
  pointer-events: none;
  background: var(--qlt-selection-bg, rgba(35, 131, 226, 0.14));
  outline: 2px solid var(--qlt-accent, #2383e2);
  outline-offset: -1px;
}

.qlt-active-cell {
  position: absolute;
  z-index: 4;
  display: none;
  box-sizing: border-box;
  pointer-events: none;
  background: var(--qlt-active-cell-bg, rgba(35, 131, 226, 0.06));
  outline: 2px solid var(--qlt-accent, #2383e2);
  outline-offset: -1px;
}

.qlt-col-handle {
  position: absolute;
  z-index: 6;
  display: none;
  width: 11px;
  cursor: col-resize;
}

.qlt-col-handle::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: calc(50% - 1px);
  width: 2px;
  background: var(--qlt-accent, #2383e2);
  opacity: 0.6;
}

.qlt-col-handle.is-dragging::after {
  opacity: 1;
}

body.qlt-resizing {
  cursor: col-resize !important;
  user-select: none;
}

.qlt-row-handle {
  position: absolute;
  z-index: 6;
  display: none;
  height: 11px;
  cursor: row-resize;
}

.qlt-row-handle::after {
  content: '';
  position: absolute;
  top: calc(50% - 1px);
  right: 0;
  left: 0;
  height: 2px;
  background: var(--qlt-accent, #2383e2);
  opacity: 0.6;
}

.qlt-row-handle.is-dragging::after {
  opacity: 1;
}

.qlt-table-handle {
  position: absolute;
  z-index: 21;
  display: none;
  box-sizing: border-box;
  width: 12px;
  height: 12px;
  background: var(--qlt-accent, #2383e2);
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.25);
  cursor: nwse-resize;
  transition: transform 0.1s;
}

.qlt-table-handle.is-bottom-left {
  cursor: nesw-resize;
}

.qlt-table-handle::before {
  content: '';
  position: absolute;
  inset: -10px;
}

.qlt-table-handle:hover,
.qlt-table-handle.is-dragging {
  transform: scale(1.3);
}

.qlt-table-outline {
  position: absolute;
  z-index: 6;
  display: none;
  box-sizing: border-box;
  pointer-events: none;
  border: 1px dashed var(--qlt-accent, #2383e2);
}

body.qlt-resizing-rows {
  cursor: row-resize !important;
  user-select: none;
}

body.qlt-resizing-table {
  cursor: nwse-resize !important;
  user-select: none;
}

body.qlt-resizing-table-mirrored {
  cursor: nesw-resize !important;
  user-select: none;
}

.qlt-col-handle.is-past-limit::after {
  background: #d93025;
  opacity: 1;
}

.qlt-table-handle.is-past-limit {
  background: #d93025;
}

.qlt-table-outline.is-past-limit {
  border-color: #d93025;
}

body.qlt-resizing-past-limit,
body.qlt-resizing-past-limit * {
  cursor: not-allowed !important;
}

.qlt-popover {
  position: absolute;
  z-index: 30;
  box-sizing: border-box;
  overflow-y: auto;
  padding: 8px;
  font: 13px/1.4 system-ui, -apple-system, 'Segoe UI', sans-serif;
  color: #222;
  background: #fff;
  border: 1px solid #d0d4d9;
  border-radius: 6px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.qlt-picker-grid {
  display: grid;
  gap: 3px;
}

.qlt-picker-cell {
  width: 16px;
  height: 16px;
  padding: 0;
  background: #fff;
  border: 1px solid #c8ccd1;
  border-radius: 2px;
  cursor: pointer;
}

.qlt-picker-cell.is-active {
  background: var(--qlt-selection-bg, rgba(35, 131, 226, 0.25));
  border-color: var(--qlt-accent, #2383e2);
}

.qlt-picker-cell:focus-visible,
.qlt-menu-item:focus-visible,
.qlt-picker-input:focus-visible,
.qlt-button:focus-visible,
.qlt-swatch:focus-visible,
.qlt-choice:focus-visible {
  outline: 2px solid var(--qlt-accent, #2383e2);
  outline-offset: 1px;
}

.qlt-picker-label {
  margin: 6px 0;
  text-align: center;
  color: #555;
  font-variant-numeric: tabular-nums;
}

.qlt-picker-custom {
  display: flex;
  align-items: center;
  gap: 4px;
  padding-top: 6px;
  border-top: 1px solid #e5e7ea;
}

.qlt-picker-input {
  width: 52px;
  min-width: 0;
  padding: 3px 4px;
  font: inherit;
  border: 1px solid #c8ccd1;
  border-radius: 4px;
}

.qlt-picker-times {
  color: #777;
}

.qlt-button {
  margin-left: auto;
  padding: 3px 10px;
  font: inherit;
  color: #fff;
  background: var(--qlt-accent, #2383e2);
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.qlt-action-bar {
  position: absolute;
  z-index: 20;
  display: none;
  align-items: center;
  gap: 2px;
  padding: 3px;
  font: 13px/1 system-ui, -apple-system, 'Segoe UI', sans-serif;
  background: #fff;
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
}

.qlt-action-bar.is-following {
  transition:
    top 0.15s ease,
    left 0.15s ease;
}

@media (prefers-reduced-motion: reduce) {
  .qlt-action-bar.is-following {
    transition: none;
  }
}

.qlt-action-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 1px;
  min-width: 28px;
  height: 28px;
  padding: 0 5px;
  color: #3c4043;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.qlt-action-button svg {
  flex: none;
}

.qlt-action-button:hover:not(:disabled) {
  background: #f0f2f4;
}

.qlt-action-button[aria-pressed='true'] {
  color: var(--qlt-accent, #2383e2);
  background: var(--qlt-selection-bg, rgba(35, 131, 226, 0.14));
}

.qlt-action-button:disabled {
  color: #b8bcc2;
  cursor: default;
}

.qlt-action-button.is-danger:hover {
  color: #d93025;
  background: #fdecea;
}

.qlt-action-button:focus-visible {
  outline: 2px solid var(--qlt-accent, #2383e2);
  outline-offset: 1px;
}

.qlt-action-button[data-tooltip]:hover::after,
.qlt-action-button[data-tooltip]:focus-visible::after {
  content: attr(data-tooltip);
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  z-index: 1;
  padding: 4px 7px;
  font-size: 12px;
  color: #fff;
  white-space: nowrap;
  pointer-events: none;
  background: #2b2f33;
  border-radius: 4px;
  transform: translateX(-50%);
}

.ql-container:has(> .qlt-popover) .qlt-action-button::after {
  display: none;
}

.qlt-action-separator {
  width: 1px;
  height: 18px;
  margin: 0 3px;
  background: #e1e4e8;
}

.qlt-menu {
  display: flex;
  flex-direction: column;
  min-width: 180px;
  padding: 4px;
}

.qlt-menu > * {
  flex-shrink: 0;
}

.qlt-menu-item {
  padding: 6px 10px;
  font: inherit;
  text-align: left;
  color: inherit;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.qlt-menu-item:hover:not(:disabled) {
  background: #f0f2f4;
}

.qlt-menu-item:disabled {
  color: #aaa;
  cursor: default;
}

.qlt-menu-item[aria-checked='true']::after {
  content: '\\2713';
  float: right;
  margin-left: 12px;
  color: var(--qlt-accent, #2383e2);
}

.qlt-menu-separator {
  height: 1px;
  margin: 4px 0;
  background: #e5e7ea;
}

.qlt-properties {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 236px;
  padding: 10px;
}

.qlt-properties-title {
  font-weight: 600;
}

.qlt-field-label {
  margin-bottom: 4px;
  color: #555;
}

.qlt-field-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.qlt-field-row > .qlt-field-label {
  flex: 1;
  margin-bottom: 0;
}

.qlt-field-row > .qlt-choices,
.qlt-field-row > .qlt-toggle,
.qlt-field-row > .qlt-text-input {
  flex: 1;
  min-width: 0;
}

.qlt-field-row > .qlt-text-input + .qlt-choices {
  flex: none;
}

.qlt-field-row > .qlt-text-input + .qlt-choices > .qlt-choice {
  padding: 4px 8px;
}

.qlt-color-button {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 3px;
  height: 26px;
  padding: 0 4px 0 5px;
  color: #555;
  background: #fff;
  border: 1px solid #c8ccd1;
  border-radius: 4px;
  cursor: pointer;
}

.qlt-color-button:hover {
  background: #f0f2f4;
}

.qlt-color-button[aria-expanded='true'] {
  border-color: var(--qlt-accent, #2383e2);
}

.qlt-color-button:focus-visible {
  outline: 2px solid var(--qlt-accent, #2383e2);
  outline-offset: 1px;
}

.qlt-color-preview {
  box-sizing: border-box;
  width: 16px;
  height: 16px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 3px;
}

.qlt-palette {
  display: grid;
  grid-template-rows: 1fr;
  margin-top: 6px;
  opacity: 1;
  transition:
    grid-template-rows 0.2s ease,
    margin-top 0.2s ease,
    opacity 0.2s ease;
}

.qlt-palette[hidden] {
  display: grid;
  grid-template-rows: 0fr;
  margin-top: 0;
  opacity: 0;
  visibility: hidden;
  transition:
    grid-template-rows 0.2s ease,
    margin-top 0.2s ease,
    opacity 0.15s ease,
    visibility 0s linear 0.2s;
}

.qlt-palette-clip {
  min-height: 0;
  overflow: hidden;
}

.qlt-palette-body {
  padding: 8px;
  background: #f6f7f9;
  border-radius: 6px;
}

@media (prefers-reduced-motion: reduce) {
  .qlt-palette,
  .qlt-palette[hidden] {
    transition: none;
  }
}

.qlt-colors {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
}

.qlt-swatch {
  aspect-ratio: 1;
  padding: 0;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  cursor: pointer;
}

.qlt-swatch[aria-pressed='true'] {
  outline: 2px solid var(--qlt-accent, #2383e2);
  outline-offset: 1px;
}

.qlt-swatch-none {
  background: linear-gradient(
      to top right,
      transparent calc(50% - 1px),
      #d93025 calc(50% - 1px),
      #d93025 calc(50% + 1px),
      transparent calc(50% + 1px)
    )
    #fff;
}

.qlt-custom-color {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
}

.qlt-color-picker {
  flex: none;
  width: 30px;
  height: 26px;
  padding: 0;
  background: none;
  border: 1px solid #c8ccd1;
  border-radius: 4px;
  cursor: pointer;
}

.qlt-color-picker::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.qlt-color-picker::-webkit-color-swatch {
  border: none;
  border-radius: 2px;
}

.qlt-color-picker::-moz-color-swatch {
  border: none;
  border-radius: 2px;
}

.qlt-color-code {
  flex: 1;
  min-width: 0;
  padding: 4px 6px;
  font: inherit;
  border: 1px solid #c8ccd1;
  border-radius: 4px;
}

.qlt-color-code[aria-invalid='true'] {
  border-color: #d93025;
  outline-color: #d93025;
}

.qlt-color-picker:focus-visible,
.qlt-color-code:focus-visible {
  outline: 2px solid var(--qlt-accent, #2383e2);
  outline-offset: 1px;
}

.qlt-color-code[aria-invalid='true']:focus-visible {
  outline-color: #d93025;
}

.qlt-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.qlt-toggle input {
  margin: 0;
  accent-color: var(--qlt-accent, #2383e2);
}

.qlt-text-input {
  box-sizing: border-box;
  width: 100%;
  padding: 4px 6px;
  font: inherit;
  border: 1px solid #c8ccd1;
  border-radius: 4px;
}

.qlt-text-input:focus-visible,
.qlt-toggle input:focus-visible {
  outline: 2px solid var(--qlt-accent, #2383e2);
  outline-offset: 1px;
}

.qlt-choices {
  display: flex;
  overflow: hidden;
  border: 1px solid #c8ccd1;
  border-radius: 4px;
}

.qlt-choice {
  flex: 1;
  padding: 4px 2px;
  font: inherit;
  color: inherit;
  background: #fff;
  border: none;
  cursor: pointer;
}

.qlt-choice + .qlt-choice {
  border-left: 1px solid #c8ccd1;
}

.qlt-choice:hover {
  background: #f0f2f4;
}

.qlt-choice[aria-pressed='true'] {
  color: var(--qlt-accent, #2383e2);
  background: var(--qlt-selection-bg, rgba(35, 131, 226, 0.14));
}
`.trim()

export const OVERLAY_STYLES = `
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
`.trim()

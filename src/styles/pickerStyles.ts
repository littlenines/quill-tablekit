export const PICKER_STYLES = `
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
`.trim()

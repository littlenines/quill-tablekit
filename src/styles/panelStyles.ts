export const PANEL_STYLES = `
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
`.trim()

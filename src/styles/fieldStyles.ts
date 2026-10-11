export const FIELD_STYLES = `
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

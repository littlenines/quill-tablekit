export const ACTION_BAR_STYLES = `
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
`.trim()

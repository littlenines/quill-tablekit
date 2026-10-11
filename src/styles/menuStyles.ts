export const MENU_STYLES = `
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
`.trim()

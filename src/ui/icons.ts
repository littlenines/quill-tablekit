const icon = (paths: string, size = 16) =>
  `<svg viewBox="0 0 16 16" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`

export const ICONS = {
  rows: icon('<rect x="2" y="2.5" width="12" height="11" rx="1.5"/><path d="M2 6.2h12M2 9.8h12"/>'),
  columns: icon('<rect x="2" y="2.5" width="12" height="11" rx="1.5"/><path d="M6 2.5v11M10 2.5v11"/>'),
  merge: icon('<path d="M2.5 3v10M13.5 3v10M5 8h6M7 6 5 8l2 2M9 6l2 2-2 2"/>'),
  split: icon('<path d="M8 3v10M2.5 8h3.5M10 8h3.5M4 6 2 8l2 2M12 6l2 2-2 2"/>'),
  headerRow: icon(
    '<rect x="2" y="2.5" width="12" height="11" rx="1.5"/><path d="M2 6.5h12"/><path d="M3 4.4h10" stroke-width="2.6"/>',
  ),
  cellProperties: icon('<path d="M8 2.5 4.6 7.2a4 4 0 1 0 6.8 0Z"/><path d="M6.4 10.2a1.8 1.8 0 0 0 1.6 1.3"/>'),
  tableProperties: icon(
    '<path d="M2.5 4h11M2.5 8h11M2.5 12h11"/><circle cx="6" cy="4" r="1.4" fill="currentColor"/><circle cx="10.5" cy="8" r="1.4" fill="currentColor"/><circle cx="5" cy="12" r="1.4" fill="currentColor"/>',
  ),
  more: icon(
    '<circle cx="3.5" cy="8" r="1" fill="currentColor"/><circle cx="8" cy="8" r="1" fill="currentColor"/><circle cx="12.5" cy="8" r="1" fill="currentColor"/>',
  ),
  deleteTable: icon(
    '<path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.2c.1.7.6 1.3 1.4 1.3h3c.8 0 1.3-.6 1.4-1.3l.6-8.2M7 7v4.5M9 7v4.5"/>',
  ),
  chevron: icon('<path d="m4.5 6.5 3.5 3.5 3.5-3.5"/>', 10),
}

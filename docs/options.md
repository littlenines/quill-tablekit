# Options

`tableKit: true` uses the defaults. To change something, pass an object with only the settings you want:

```js
new Quill('#editor', {
  modules: {
    toolbar: [['table']],
    tableKit: { sortable: true, contextMenu: true, colors: ['#ffffff', '#fff2cc', '#d9ead3', '#cfe2f3'] },
  },
})
```

| Option             | Type      | Default    | What it does                                                                                                    |
| ------------------ | --------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| `pickerRows`       | `number`  | `8`        | Rows in the size picker grid.                                                                                   |
| `pickerColumns`    | `number`  | `10`       | Columns in the size picker grid.                                                                                |
| `maxRows`          | `number`  | `100`      | Most rows a table can get from the picker or a paste.                                                           |
| `maxColumns`       | `number`  | `30`       | Most columns a table can get from the picker or a paste.                                                        |
| `actionBar`        | `boolean` | `true`     | Shows the bar with buttons next to the cell you're in.                                                          |
| `contextMenu`      | `boolean` | `false`    | Right-click on a cell opens the table menu instead of the browser's menu.                                       |
| `resizable`        | `boolean` | `true`     | Lets you drag to resize columns, rows and the whole table.                                                      |
| `sortable`         | `boolean` | `false`    | Adds Sort A → Z and Sort Z → A. See [Sorting](./usage.md#sorting).                                              |
| `responsiveWidths` | `boolean` | `true`     | Saves widths as a share of the editor. `false` saves px. See [Responsive widths](./usage.md#responsive-widths). |
| `minColumnWidth`   | `number`  | `40`       | Narrowest a column can get, in px.                                                                              |
| `menu`             | `array`   | every item | Which actions the menu and the action bar show. See [Menu](#menu).                                              |
| `colors`           | `array`   | 15 colors  | The colors in the properties panel. See [Colors](#colors).                                                      |
| `icons`            | `object`  | built in   | Your own icons. See [Icons](#icons).                                                                            |
| `labels`           | `object`  | English    | Every text the module shows, for example to translate it. See [Labels](#labels).                                |

A number option that isn't a positive number falls back to its default.

## Menu

`menu` decides which actions people get, in the table menu and on the action bar. List the ones you want to keep:

```js
tableKit: {
  menu: ['insertRowBelow', 'insertColumnRight', 'mergeCells', 'splitCell', 'deleteRow', 'deleteColumn'],
}
```

- The order in the menu stays the same, whatever order you list them in.
- An action bar button only shows if at least one of its items is in the list.
- With an empty list there's no menu and no action bar at all. Every action still works from the [API](./api.md).
- New versions can add items. If you pass your own list, you'll only get them once you add them to it.

All the items:

| Item                   | What it does                                      |
| ---------------------- | ------------------------------------------------- |
| `insertRowAbove`       | Adds a row above.                                 |
| `insertRowBelow`       | Adds a row below.                                 |
| `insertColumnLeft`     | Adds a column on the left.                        |
| `insertColumnRight`    | Adds a column on the right.                       |
| `moveRowUp`            | Swaps the row with the one above.                 |
| `moveRowDown`          | Swaps the row with the one below.                 |
| `moveColumnLeft`       | Swaps the column with the one on the left.        |
| `moveColumnRight`      | Swaps the column with the one on the right.       |
| `duplicateRow`         | Adds a copy of the row below it.                  |
| `duplicateColumn`      | Adds a copy of the column on its right.           |
| `sortAscending`        | Sorts the rows A → Z. Only with `sortable: true`. |
| `sortDescending`       | Sorts the rows Z → A. Only with `sortable: true`. |
| `insertParagraphAbove` | Adds an empty line before the table.              |
| `insertParagraphBelow` | Adds an empty line after the table.               |
| `equalColumnWidths`    | Makes every column the same width.                |
| `fitToContent`         | Makes each column as wide as its content.         |
| `fitToWidth`           | Makes the table as wide as the editor.            |
| `equalRowHeights`      | Makes every row the same height.                  |
| `selectRow`            | Selects the whole row.                            |
| `selectColumn`         | Selects the whole column.                         |
| `copyTable`            | Copies the whole table.                           |
| `copyAsMarkdown`       | Copies the whole table as Markdown.               |
| `mergeCells`           | Merges the selected cells.                        |
| `splitCell`            | Splits a merged cell.                             |
| `headerRow`            | Turns the header row on or off.                   |
| `headerColumn`         | Turns the header column on or off.                |
| `cellProperties`       | Opens the panel for the selected cells.           |
| `tableProperties`      | Opens the panel for the whole table.              |
| `deleteRow`            | Removes the selected rows.                        |
| `deleteColumn`         | Removes the selected columns.                     |
| `deleteTable`          | Removes the table.                                |

## Colors

The colors people can pick in the properties panel. Any CSS color works, like `'#fff2cc'`, `'rgb(255, 242, 204)'` or `'lightyellow'`:

```js
tableKit: {
  colors: ['#ffffff', '#f3f3f3', '#fff2cc', '#d9ead3', '#cfe2f3', '#f4cccc'],
}
```

- The panel shows a "no color" box first, then 8 colors per row. 7 or 15 colors fill whole rows.
- Anything that isn't a color is skipped. If nothing is left, the default colors are used.

## Icons

Swap any icon for your own SVG or icon-font markup, for example from an icon set you already use. Only pass the ones you want to change:

```js
tableKit: {
  icons: {
    rows: '<svg viewBox="0 0 24 24" width="16" height="16">...</svg>',
    deleteTable: '<i class="icon-trash"></i>',
  },
}
```

| Key               | Where it's used                                                           |
| ----------------- | ------------------------------------------------------------------------- |
| `rows`            | Rows button                                                               |
| `columns`         | Columns button                                                            |
| `merge`           | Merge button                                                              |
| `split`           | The same button, in a merged cell                                         |
| `headerRow`       | Header row button                                                         |
| `headerColumn`    | Header column button                                                      |
| `cellProperties`  | Cell properties button                                                    |
| `tableProperties` | Table properties button                                                   |
| `more`            | More button                                                               |
| `deleteTable`     | Delete table button                                                       |
| `chevron`         | The small arrow on buttons that open a menu                               |
| `insertTable`     | The table button in the Quill toolbar. Empty by default: Quill's own icon |

> [!WARNING]
> The markup goes into the page as it is. Only use icons you wrote or trust, never text from your users.

## Labels

Every text the module shows can be changed, for example to translate it. Only pass the ones you want to change:

```js
tableKit: {
  labels: {
    insertTable: 'Tabelle einfügen',
    mergeCells: 'Zellen verbinden',
    splitCell: 'Zelle teilen',
  },
}
```

**Menu items.** Each item in the [Menu](#menu) list has a label with the same key:

| Key                    | Default                      |
| ---------------------- | ---------------------------- |
| `insertRowAbove`       | Insert row above             |
| `insertRowBelow`       | Insert row below             |
| `insertColumnLeft`     | Insert column left           |
| `insertColumnRight`    | Insert column right          |
| `moveRowUp`            | Move row up                  |
| `moveRowDown`          | Move row down                |
| `moveColumnLeft`       | Move column left             |
| `moveColumnRight`      | Move column right            |
| `duplicateRow`         | Duplicate row                |
| `duplicateColumn`      | Duplicate column             |
| `sortAscending`        | Sort A → Z                   |
| `sortDescending`       | Sort Z → A                   |
| `insertParagraphAbove` | Insert paragraph above table |
| `insertParagraphBelow` | Insert paragraph below table |
| `equalColumnWidths`    | Equal column widths          |
| `fitToContent`         | Fit columns to content       |
| `fitToWidth`           | Fit table to width           |
| `equalRowHeights`      | Equal row heights            |
| `selectRow`            | Select row                   |
| `selectColumn`         | Select column                |
| `copyTable`            | Copy table                   |
| `copyAsMarkdown`       | Copy as Markdown             |
| `mergeCells`           | Merge cells                  |
| `splitCell`            | Split cell                   |
| `headerRow`            | Header row                   |
| `headerColumn`         | Header column                |
| `cellProperties`       | Cell properties              |
| `tableProperties`      | Table properties             |
| `deleteRow`            | Delete row                   |
| `deleteColumn`         | Delete column                |
| `deleteTable`          | Delete table                 |

**Size picker:**

| Key            | Default      |
| -------------- | ------------ |
| `insertTable`  | Insert table |
| `customSize`   | Custom size  |
| `rowsInput`    | Rows         |
| `columnsInput` | Columns      |
| `insertButton` | Insert       |

**Action bar:**

| Key            | Default       |
| -------------- | ------------- |
| `actionBar`    | Table actions |
| `rowsGroup`    | Rows          |
| `columnsGroup` | Columns       |
| `moreGroup`    | More          |

**Properties panel:**

| Key              | Default            |
| ---------------- | ------------------ |
| `background`     | Background         |
| `borderColor`    | Border color       |
| `borderStyle`    | Borders            |
| `borderSolid`    | Solid              |
| `borderDashed`   | Dashed             |
| `borderNone`     | None               |
| `cellPadding`    | Cell spacing       |
| `paddingCompact` | Compact            |
| `paddingNormal`  | Normal             |
| `paddingWide`    | Wide               |
| `stripedRows`    | Striped rows       |
| `stripeColor`    | Stripe color       |
| `defaultColor`   | Default            |
| `caption`        | Caption            |
| `captionSide`    | Caption position   |
| `noColor`        | No color           |
| `customColor`    | Custom color       |
| `colorCode`      | Color code         |
| `textAlign`      | Text alignment     |
| `verticalAlign`  | Vertical alignment |
| `tableAlign`     | Table alignment    |
| `alignLeft`      | Left               |
| `alignCenter`    | Center             |
| `alignRight`     | Right              |
| `alignJustify`   | Justify            |
| `alignTop`       | Top                |
| `alignMiddle`    | Middle             |
| `alignBottom`    | Bottom             |

## Colors and styles

The module's own colors are CSS variables. Set them on the editor container:

```css
.ql-container {
  --qlt-accent: #7c3aed; /* selection outline, resize lines, pressed buttons */
  --qlt-selection-bg: rgba(124, 58, 237, 0.12); /* selected cells */
  --qlt-active-cell-bg: rgba(124, 58, 237, 0.05); /* the cell with the cursor */
  --qlt-border: #d4d4d8; /* cell borders */
  --qlt-header-bg: #ede9fe; /* header row and column */
  --qlt-stripe-bg: #faf5ff; /* striped rows */
  --qlt-guide: rgba(0, 0, 0, 0.12); /* the faint lines of a table without borders */
}
```

- A border or stripe color picked in Table properties wins over these for that table, and a cell background wins over the header and stripe colors.
- The variables only exist in the editor. In the saved HTML, stripes without a picked color use `#f6f8fa`.

To hide the outline around the cell with the cursor:

```css
.qlt-active-cell {
  display: none !important;
}
```

For anything else, these are the class names:

| Class              | What it is                                    |
| ------------------ | --------------------------------------------- |
| `qlt-table`        | A table in the editor                         |
| `qlt-cell`         | A cell                                        |
| `qlt-cell-line`    | A line of text in a cell                      |
| `qlt-picker`       | The size picker                               |
| `qlt-menu`         | The table menu                                |
| `qlt-properties`   | The cell and table properties panel           |
| `qlt-selection`    | The highlight over selected cells             |
| `qlt-active-cell`  | The outline around the cell with the cursor   |
| `qlt-col-handle`   | The line you drag to resize a column          |
| `qlt-row-handle`   | The line you drag to resize a row             |
| `qlt-table-handle` | The round handle you drag to resize the table |

In the editor, a table also has data attributes for its style: `data-header`, `data-header-column`, `data-striped`, `data-border-style`, `data-cell-padding`, `data-caption` and `data-caption-side`. For example, `.qlt-table[data-header] tr:first-child td` is the header row. Cells in a header column have `data-first-column`. None of these are in the saved HTML.

## TypeScript

All the option types are exported:

```ts
import type { TableKitOptions, TableKitLabels, TableKitIcons, TableMenuItemName } from 'quill-tablekit'

const menu: TableMenuItemName[] = ['mergeCells', 'splitCell']
const options: TableKitOptions = { pickerRows: 6, maxColumns: 12, menu }
```

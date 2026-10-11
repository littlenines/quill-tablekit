# Options

`tableKit: true` uses the defaults. To change something, pass an object:

```js
new Quill('#editor', {
  modules: {
    toolbar: [['table']],
    tableKit: {
      pickerRows: 8,
      pickerColumns: 10,
      maxRows: 100,
      maxColumns: 30,
      contextMenu: false,
      actionBar: true,
      resizable: true,
      responsiveWidths: true,
      minColumnWidth: 40,
      menu: ['insertRowAbove', 'insertRowBelow', 'mergeCells', 'splitCell', 'deleteTable'],
      colors: ['#ffffff', '#fff2cc', '#d9ead3'],
      icons: {},
      labels: {},
    },
  },
})
```

| Option             | Default    | What it does                                                                                                |
| ------------------ | ---------- | ----------------------------------------------------------------------------------------------------------- |
| `pickerRows`       | `8`        | Rows in the size picker grid.                                                                               |
| `pickerColumns`    | `10`       | Columns in the size picker grid.                                                                            |
| `maxRows`          | `100`      | Most rows you can insert at once.                                                                           |
| `maxColumns`       | `30`       | Most columns you can insert at once.                                                                        |
| `contextMenu`      | `false`    | Right-click on a cell opens the table menu instead of the browser's menu.                                   |
| `actionBar`        | `true`     | Shows the bar with buttons next to the table while the cursor is in it.                                     |
| `resizable`        | `true`     | Lets you drag borders to resize columns and rows, and the corner to resize the table.                       |
| `responsiveWidths` | `true`     | Saves resized widths as a share of the editor. `false` saves px. See [Usage](./usage.md#responsive-widths). |
| `minColumnWidth`   | `40`       | Narrowest a column can be dragged, in px.                                                                   |
| `menu`             | every item | Which items the table menu shows. See [Menu](#menu).                                                        |
| `colors`           | 15 colors  | The colors in the properties panel. See [Colors](#colors).                                                  |
| `icons`            | built in   | Your own icons for the action bar and the table button. See [Icons](#icons).                                |
| `labels`           | English    | The text in the picker, the menu and the panel. See [Labels](#labels).                                      |

If you pass something that isn't a positive number for the number options, the default is used.

## Menu

The menu has a lot of items. Pass the ones you want to keep, and the rest are hidden:

```js
tableKit: {
  menu: ['insertRowBelow', 'insertColumnRight', 'mergeCells', 'splitCell', 'deleteRow', 'deleteColumn'],
}
```

The order in the menu stays the same no matter what order you list them in. These are all the items:

| Item                   | What it does                                  |
| ---------------------- | --------------------------------------------- |
| `insertRowAbove`       | Adds a row above.                             |
| `insertRowBelow`       | Adds a row below.                             |
| `insertColumnLeft`     | Adds a column on the left.                    |
| `insertColumnRight`    | Adds a column on the right.                   |
| `moveRowUp`            | Swaps the row with the one above.             |
| `moveRowDown`          | Swaps the row with the one below.             |
| `moveColumnLeft`       | Swaps the column with the one on the left.    |
| `moveColumnRight`      | Swaps the column with the one on the right.   |
| `duplicateRow`         | Adds a copy of the row below it.              |
| `duplicateColumn`      | Adds a copy of the column on its right.       |
| `insertParagraphAbove` | Adds an empty line before the table.          |
| `insertParagraphBelow` | Adds an empty line after the table.           |
| `equalColumnWidths`    | Makes every column the same width.            |
| `fitToContent`         | Makes each column as wide as its content.     |
| `fitToWidth`           | Makes the table as wide as the editor.        |
| `equalRowHeights`      | Makes every row the same height.              |
| `selectRow`            | Selects the whole row.                        |
| `selectColumn`         | Selects the whole column.                     |
| `copyTable`            | Copies the whole table to the clipboard.      |
| `mergeCells`           | Merges the selected cells.                    |
| `splitCell`            | Splits a merged cell.                         |
| `headerRow`            | Turns the header row on or off.               |
| `headerColumn`         | Turns the header column on or off.            |
| `cellProperties`       | Opens the panel for background and alignment. |
| `tableProperties`      | Opens the panel for the whole table.          |
| `deleteRow`            | Removes the selected rows.                    |
| `deleteColumn`         | Removes the selected columns.                 |
| `deleteTable`          | Removes the table.                            |

The action bar follows the same list: a button only shows if at least one of its items is in it.

If you listed your items before a version added new ones, you won't see the new ones until you add them to your list.

With an empty list there's no table menu and no action bar at all, and the table button does nothing while the cursor is in a table. You can still call every action from your own code, see [API](./api.md).

## Colors

The properties panel shows a "no color" box and then your colors. Any CSS color works: `'#fff2cc'`, `'rgb(255, 242, 204)'`, `'lightyellow'`. Things that aren't colors are skipped, and if none are left the default colors are used.

```js
tableKit: {
  colors: ['#ffffff', '#f3f3f3', '#fff2cc', '#d9ead3', '#cfe2f3', '#f4cccc'],
}
```

The panel puts 8 colors in a row, so 7 or 15 colors (plus "no color") fill whole rows.

## Icons

The action bar uses its own small SVG icons. You can swap any of them for your own markup, for example from an icon set you already use. Only pass the ones you want to change:

```js
tableKit: {
  icons: {
    rows: '<svg viewBox="0 0 24 24" width="16" height="16">...</svg>',
    deleteTable: '<i class="icon-trash"></i>',
    insertTable: '<svg>...</svg>',
  },
}
```

| Key               | Where it's used                                                                 |
| ----------------- | ------------------------------------------------------------------------------- |
| `rows`            | Rows button                                                                     |
| `columns`         | Columns button                                                                  |
| `merge`           | Merge cells button                                                              |
| `split`           | The same button when the cursor is in a merged cell                             |
| `headerRow`       | Header row button                                                               |
| `headerColumn`    | Header column button                                                            |
| `cellProperties`  | Cell properties button                                                          |
| `tableProperties` | Table properties button                                                         |
| `more`            | More button                                                                     |
| `deleteTable`     | Delete table button                                                             |
| `chevron`         | The small arrow on buttons that open a menu                                     |
| `insertTable`     | The table button in the Quill toolbar. Empty by default, which uses Quill's own |

The markup goes into the page as it is, so only use icons you wrote or trust, never text from your users.

## Labels

You can change any text in the picker, the menu and the panel, for example to translate it. Only pass the ones you want to change:

```js
tableKit: {
  labels: {
    insertTable: 'Tabelle einfügen',
    mergeCells: 'Zellen verbinden',
    splitCell: 'Zelle teilen',
  },
}
```

| Key                    | Default                      |
| ---------------------- | ---------------------------- |
| `insertTable`          | Insert table                 |
| `customSize`           | Custom size                  |
| `rowsInput`            | Rows                         |
| `columnsInput`         | Columns                      |
| `insertButton`         | Insert                       |
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
| `equalColumnWidths`    | Equal column widths          |
| `fitToContent`         | Fit columns to content       |
| `fitToWidth`           | Fit table to width           |
| `equalRowHeights`      | Equal row heights            |
| `insertParagraphAbove` | Insert paragraph above table |
| `insertParagraphBelow` | Insert paragraph below table |
| `selectRow`            | Select row                   |
| `selectColumn`         | Select column                |
| `copyTable`            | Copy table                   |
| `mergeCells`           | Merge cells                  |
| `splitCell`            | Split cell                   |
| `headerRow`            | Header row                   |
| `headerColumn`         | Header column                |
| `cellProperties`       | Cell properties              |
| `tableProperties`      | Table properties             |
| `deleteRow`            | Delete row                   |
| `deleteColumn`         | Delete column                |
| `deleteTable`          | Delete table                 |
| `background`           | Background                   |
| `borderColor`          | Border color                 |
| `borderStyle`          | Borders                      |
| `borderSolid`          | Solid                        |
| `borderDashed`         | Dashed                       |
| `borderNone`           | None                         |
| `cellPadding`          | Cell spacing                 |
| `paddingCompact`       | Compact                      |
| `paddingNormal`        | Normal                       |
| `paddingWide`          | Wide                         |
| `stripedRows`          | Striped rows                 |
| `stripeColor`          | Stripe color                 |
| `defaultColor`         | Default                      |
| `caption`              | Caption                      |
| `captionSide`          | Caption position             |
| `noColor`              | No color                     |
| `customColor`          | Custom color                 |
| `colorCode`            | Color code                   |
| `textAlign`            | Text alignment               |
| `verticalAlign`        | Vertical alignment           |
| `tableAlign`           | Table alignment              |
| `alignLeft`            | Left                         |
| `alignCenter`          | Center                       |
| `alignRight`           | Right                        |
| `alignJustify`         | Justify                      |
| `alignTop`             | Top                          |
| `alignMiddle`          | Middle                       |
| `alignBottom`          | Bottom                       |
| `actionBar`            | Table actions                |
| `rowsGroup`            | Rows                         |
| `columnsGroup`         | Columns                      |
| `moreGroup`            | More                         |

## Colors and styles

The module's own colors come from CSS variables. Set them on the editor container:

```css
.ql-container {
  --qlt-accent: #7c3aed; /* outline of selected cells, resize line, buttons */
  --qlt-selection-bg: rgba(124, 58, 237, 0.12); /* background of selected cells */
  --qlt-active-cell-bg: rgba(124, 58, 237, 0.05); /* background of the cell with the cursor */
  --qlt-border: #d4d4d8; /* cell borders */
  --qlt-header-bg: #ede9fe; /* background of the header row */
  --qlt-stripe-bg: #faf5ff; /* every other row in a striped table */
  --qlt-guide: rgba(0, 0, 0, 0.12); /* the faint lines of a table without borders */
}
```

A border or stripe color picked in Table properties wins over `--qlt-border` and `--qlt-stripe-bg` for that table, and a cell background wins over `--qlt-header-bg` and the stripes.

A table without borders still shows faint dashed lines in the editor, so you can see the cells while you type. They aren't in the saved HTML. Without a stripe color picked for the table, the saved HTML uses `#f6f8fa`, since the variable only exists in the editor.

If you want to style more than that, these are the class names:

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

If you don't want the outline around the cell with the cursor, hide it:

```css
.qlt-active-cell {
  display: none !important;
}
```

In the editor, a table has data attributes for its style: `data-header`, `data-header-column`, `data-striped`, `data-border-style`, `data-cell-padding`, `data-caption` and `data-caption-side`. So `.qlt-table[data-header] tr:first-child td` is the header row. With a header column, its cells have `data-first-column`. The saved HTML doesn't have these attributes.

## TypeScript

```ts
import type { TableKitOptions, TableKitLabels, TableKitIcons, TableMenuItemName } from 'quill-tablekit'

const menu: TableMenuItemName[] = ['mergeCells', 'splitCell']
const options: TableKitOptions = { pickerRows: 6, maxColumns: 12, menu }
```

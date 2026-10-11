<h1 align="center">quill-tablekit - In Progress</h1>
<p align="center">
  <img src="https://img.shields.io/npm/l/quill-tablekit?style=flat" alt="license" />
  <img src="https://img.shields.io/badge/Quill_compatible-2.x-blue?style=flat&cacheSeconds=3600" alt="Quill compatible 2.x" />
</p>

A [Quill](https://quilljs.com/) 2 module for tables you can actually edit. Tables are saved in the normal Quill Delta, so saving, loading and undo just work.

## Features

- Insert tables from a size picker in the toolbar
- Add, delete, move and duplicate rows and columns, and sort rows by a column (opt-in)
- Merge and split cells
- Resize columns, rows and the whole table by dragging, responsive by default
- Header row and header column, cell colors, alignment, borders, striped rows, captions
- A small action bar next to the cell you're in, also usable from the keyboard
- Copy and paste cells, tables from Word, Google Docs, Excel and Sheets, text with tabs, or Markdown tables
- Clean HTML from `getSemanticHTML()`, with `<thead>`, `<th scope>` and `<caption>` for screen readers and printing
- TypeScript types included, works with [`resize-quill-image`](https://www.npmjs.com/package/resize-quill-image) and [`quill-image-alt`](https://www.npmjs.com/package/quill-image-alt)

## Installation

```bash
npm install quill-tablekit
```

Needs `quill` 2.x (a peer dependency). Quill 1 is not supported. Works with [`react-quill-new`](https://www.npmjs.com/package/react-quill-new).

Or from a CDN, after Quill. It's available as `QuillTableKit`:

```html
<script src="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js"></script>
<script src="https://cdn.jsdelivr.net/npm/quill-tablekit/dist/index.iife.js"></script>
```

## Usage

```js
import Quill from 'quill'
import TableKit from 'quill-tablekit'

Quill.register('modules/tableKit', TableKit)

const quill = new Quill('#editor', {
  theme: 'snow',
  modules: {
    toolbar: [
      ['bold', 'italic'],
      ['link', 'table'],
    ],
    tableKit: true,
  },
})
```

Add `'table'` to the toolbar for the table button. The CSS is added for you. Don't turn on Quill's own `table` module at the same time.

Click the table button to insert a table. Click into it and the action bar shows up with everything else. [Usage](https://github.com/littlenines/quill-tablekit/blob/master/docs/usage.md) explains all of it.

## Options

Pass an object instead of `true` to change something. Everything is optional:

```js
tableKit: {
  pickerRows: 8,
  pickerColumns: 10,
  maxRows: 100,
  maxColumns: 30,
  actionBar: true,
  contextMenu: false,
  resizable: true,
  responsiveWidths: true,
  minColumnWidth: 40,
  menu: ['insertRowBelow', 'insertColumnRight', 'mergeCells', 'splitCell', 'deleteTable'],
  colors: ['#ffffff', '#fff2cc', '#d9ead3', '#cfe2f3'],
  icons: {},
  labels: {},
}
```

| Option             | Type      | Default    | Description                                                                          |
| ------------------ | --------- | ---------- | ------------------------------------------------------------------------------------ |
| `pickerRows`       | `number`  | `8`        | Rows in the size picker grid.                                                        |
| `pickerColumns`    | `number`  | `10`       | Columns in the size picker grid.                                                     |
| `maxRows`          | `number`  | `100`      | Most rows a table can get from the picker or a paste.                                |
| `maxColumns`       | `number`  | `30`       | Most columns a table can get from the picker or a paste.                             |
| `actionBar`        | `boolean` | `true`     | Shows the bar with buttons next to the cell you're in.                               |
| `contextMenu`      | `boolean` | `false`    | Right-click on a cell opens the table menu instead of the browser's menu.            |
| `resizable`        | `boolean` | `true`     | Lets you drag to resize columns, rows and the whole table.                           |
| `sortable`         | `boolean` | `false`    | Adds Sort A → Z and Sort Z → A to the menu and the Columns button.                   |
| `responsiveWidths` | `boolean` | `true`     | Saves widths as a share of the editor, so tables follow its width. `false` saves px. |
| `minColumnWidth`   | `number`  | `40`       | Narrowest a column can get, in px.                                                   |
| `menu`             | `array`   | every item | Which actions the menu and the action bar show. See [Menu items](#menu-items).       |
| `colors`           | `array`   | 15 colors  | The colors in the properties panel. Any CSS color works.                             |
| `icons`            | `object`  | built in   | Your own icons for the action bar. See [Icons](#icons).                              |
| `labels`           | `object`  | English    | Every text in the picker, menu and panels, for example to translate it.              |

### Menu items

Pass the ones you want to keep. They always show in this order:

`insertRowAbove` · `insertRowBelow` · `insertColumnLeft` · `insertColumnRight` · `moveRowUp` · `moveRowDown` · `moveColumnLeft` · `moveColumnRight` · `duplicateRow` · `duplicateColumn` · `sortAscending` · `sortDescending` · `insertParagraphAbove` · `insertParagraphBelow` · `equalColumnWidths` · `fitToContent` · `fitToWidth` · `equalRowHeights` · `selectRow` · `selectColumn` · `copyTable` · `copyAsMarkdown` · `mergeCells` · `splitCell` · `headerRow` · `headerColumn` · `cellProperties` · `tableProperties` · `deleteRow` · `deleteColumn` · `deleteTable`

The two sort items only show when `sortable` is `true`. With an empty list there's no menu and no action bar, but every action still works from the [API](#api).

### Labels

Only pass the texts you want to change, for example to translate them. Each menu item has a label with the same name.

```js
tableKit: {
  labels: {
    insertTable: 'Вставить таблицу',
    insertRowAbove: 'Inserează rând deasupra',
    insertRowBelow: 'Zeile unterhalb einfügen',
    mergeCells: 'Объединить ячейки',
  },
}
```

The full list of labels and their default texts is in [Options](https://github.com/littlenines/quill-tablekit/blob/master/docs/options.md#labels).

### Icons

Swap any action bar icon for your own SVG or icon-font markup. Only use markup you trust:

```js
tableKit: {
  icons: {
    rows: '<svg viewBox="0 0 24 24" width="16" height="16">...</svg>',
    deleteTable: '<i class="icon-trash"></i>',
  },
}
```

The names are `rows`, `columns`, `merge`, `split`, `headerRow`, `headerColumn`, `cellProperties`, `tableProperties`, `more`, `deleteTable`, `chevron`, and `insertTable` for the toolbar button.

### Colors

The module's own colors are CSS variables. Set them on the editor container:

```css
.ql-container {
  --qlt-accent: #7c3aed; /* selection outline, resize lines, pressed buttons */
  --qlt-selection-bg: rgba(124, 58, 237, 0.12); /* selected cells */
  --qlt-active-cell-bg: rgba(124, 58, 237, 0.05); /* the cell with the cursor */
  --qlt-border: #d4d4d8; /* cell borders */
  --qlt-header-bg: #ede9fe; /* header row and column */
  --qlt-stripe-bg: #faf5ff; /* striped rows */
}
```

Colors picked in the properties panel win over these. Class names and more are in [Options](https://github.com/littlenines/quill-tablekit/blob/master/docs/options.md#colors-and-styles).

## Keyboard

| Key                    | What it does                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------- |
| `Tab` / `Shift + Tab`  | Next or previous cell. Tab in the last cell adds a row.                               |
| `Up` / `Down`          | The cell above or below, after moving through the lines of the current cell.          |
| `Enter`                | A new line in the same cell.                                                          |
| `Backspace` / `Delete` | Never joins two cells. With several cells selected, empties them but keeps the table. |
| `Alt + F10`            | Moves the focus to the action bar. Arrow keys move between its buttons.               |

## API

Everything the toolbar, menu and action bar do, you can call yourself, for example from your own buttons. The methods work on the table where the cursor is (or was last, if the editor doesn't have focus right now):

```js
const tableKit = quill.getModule('tableKit')

tableKit.insertTable(3, 4)
tableKit.mergeCells()
tableKit.setTableProperties({ header: true, striped: true, caption: 'Sales by region' })
tableKit.setCellProperties({ background: '#fff2cc', verticalAlign: 'middle' })

quill.on('selection-change', () => {
  mergeButton.disabled = !tableKit.canMergeCells()
})
```

| Method                                                                  | What it does                                                                                                      |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `insertTable(rows, columns)`                                            | Adds a table at the cursor.                                                                                       |
| `deleteTable()`                                                         | Removes the table.                                                                                                |
| `insertRowAbove()`, `insertRowBelow()`                                  | Adds a row.                                                                                                       |
| `insertColumnLeft()`, `insertColumnRight()`                             | Adds a column.                                                                                                    |
| `deleteRow()`, `deleteColumn()`                                         | Removes the rows or columns the selection touches.                                                                |
| `moveRowUp()`, `moveRowDown()`, `moveColumnLeft()`, `moveColumnRight()` | Swaps the row or column with its neighbour.                                                                       |
| `duplicateRow()`, `duplicateColumn()`                                   | Adds a copy of the row or column next to it.                                                                      |
| `sortByColumn(order)`                                                   | Sorts the rows by the cursor's column: numbers, then dates, then text. `'ascending'` (default) or `'descending'`. |
| `mergeCells()`, `splitCell()`                                           | Merges the selected cells, or splits the merged cell.                                                             |
| `canMergeCells()`, `canSplitCell()`                                     | `true` if merging or splitting is possible right now.                                                             |
| `selectRow()`, `selectColumn()`                                         | Selects the whole row or column.                                                                                  |
| `insertParagraphAbove()`, `insertParagraphBelow()`                      | Adds an empty line before or after the table.                                                                     |
| `copyTable()`                                                           | Copies the table to the clipboard. Returns a promise with `true` if it worked.                                    |
| `copyTableAsMarkdown()`, `getTableMarkdown()`                           | Copies the table as Markdown, or returns it as a string.                                                          |
| `getCellProperties()`, `setCellProperties(changes)`                     | Reads or changes the selected cells. See below.                                                                   |
| `getTableProperties()`, `setTableProperties(changes)`                   | Reads or changes the whole table. See below.                                                                      |
| `setColumnWidths(table, widths)`                                        | Sets the column widths in px for a `<table>` element, or `null` for automatic.                                    |
| `setRowHeights(table, heights)`                                         | Sets the row heights in px, `null` for a row that fits its content.                                               |
| `equalizeColumnWidths()`, `equalizeRowHeights()`                        | Makes every column, or every row, the same size.                                                                  |
| `fitColumnsToContent()`, `fitTableToWidth()`                            | Makes each column as wide as its content, or the table as wide as the editor.                                     |
| `moveToCell(direction)`                                                 | Goes to the next (`1`) or previous (`-1`) cell, like Tab.                                                         |
| `isInTable()`                                                           | `true` if the cursor is in a table.                                                                               |
| `getContext()`                                                          | The table under the cursor as a grid, for building your own UI.                                                   |
| `destroy()`                                                             | Removes the module's listeners and popups. See [Cleanup](#cleanup).                                               |

Each change is one undo step.

**Cell properties:** `background` (a CSS color or `null`), `verticalAlign` (`'top'`, `'middle'`, `'bottom'`), `textAlign` (`'left'`, `'center'`, `'right'`, `'justify'`).

**Table properties:** `header` and `headerColumn` (`true`/`false`), `align` (`'left'`, `'center'`, `'right'`), `borderStyle` (`'solid'`, `'dashed'`, `'none'`), `borderColor`, `cellPadding` (`'compact'`, `'normal'`, `'wide'`), `striped`, `stripeColor`, `background`, `caption` and `captionSide` (`'top'`, `'bottom'`). Only the fields you pass change.

More details and examples are in [API](https://github.com/littlenines/quill-tablekit/blob/master/docs/api.md).

## Saving content

Save `quill.getContents()` like any Delta and load it with `setContents()`. To show it on a page, use a read-only Quill with the module registered, or `quill.getSemanticHTML()` for plain HTML. More in [Saved content](https://github.com/littlenines/quill-tablekit/blob/master/docs/content.md).

## Cleanup

When your editor unmounts (React, Vue, route changes), call `destroy()` first:

```js
quill.getModule('tableKit')?.destroy()
```

## Docs

All pages are also listed on the [docs page](https://github.com/littlenines/quill-tablekit/blob/master/docs/README.md).

- [Installation](https://github.com/littlenines/quill-tablekit/blob/master/docs/installation.md): npm, CDN, Quill versions
- [Usage](https://github.com/littlenines/quill-tablekit/blob/master/docs/usage.md): inserting, merging, resizing, properties, keyboard, copy and paste
- [Options](https://github.com/littlenines/quill-tablekit/blob/master/docs/options.md): all settings, labels, icons, CSS variables
- [API](https://github.com/littlenines/quill-tablekit/blob/master/docs/api.md): every method
- [Saved content](https://github.com/littlenines/quill-tablekit/blob/master/docs/content.md): the Delta and the HTML
- [React](https://github.com/littlenines/quill-tablekit/blob/master/docs/react.md): editor component, read-only viewer, Vue and other frameworks
- [Troubleshooting](https://github.com/littlenines/quill-tablekit/blob/master/docs/troubleshooting.md): common problems
- [Limitations](https://github.com/littlenines/quill-tablekit/blob/master/docs/limitations.md): what doesn't work
- [How it works](https://github.com/littlenines/quill-tablekit/blob/master/docs/architecture.md): the code, running it locally, tests

## License

MIT

> [!NOTE]
> Found a bug or something odd? [Open an issue](https://github.com/littlenines/quill-tablekit/issues). Contributions are welcome.

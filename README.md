<h1 align="center">quill-tablekit</h1>

<p align="center">Tables for Quill 2. Merge cells, resize columns, and paste tables from Word, Excel or Markdown.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/quill-tablekit"><img src="https://img.shields.io/npm/v/quill-tablekit?style=flat" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/quill-tablekit"><img src="https://img.shields.io/npm/dm/quill-tablekit?style=flat" alt="npm downloads" /></a>
  <img src="https://img.shields.io/badge/Quill-2.x-blue?style=flat" alt="Quill 2.x" />
  <img src="https://img.shields.io/badge/types-TypeScript-blue?style=flat" alt="TypeScript types included" />
  <img src="https://img.shields.io/npm/l/quill-tablekit?style=flat" alt="license" />
</p>

Tables are saved in the normal Quill Delta, so saving, loading and undo just work. Use it with plain JavaScript, React, Vue, Svelte, Angular, Next.js, Nuxt or whatever you like.

## Features

- Insert tables from the toolbar, with the mouse or keyboard
- Add, move, duplicate, select and delete rows and columns
- Merge and split cells
- Sort by any column (numbers, dates and text)
- Resize columns, rows and the whole table by dragging
- Responsive or fixed pixel widths
- Equal column widths, equal row heights, fit to content, fit to width
- Header row and header column
- Cell colors and alignment
- Table borders, spacing, alignment, stripes and captions
- Action bar next to the cell, and an optional right-click menu
- Tab and arrow keys between cells
- Add a line above or below a table
- Paste tables from Word, Excel, Google Docs or Markdown
- Paste text with tabs into cells
- Copy cells into Excel, or copy a table as Markdown
- Undo for every change
- Clean HTML from `getSemanticHTML()`
- Read-only and zoomed editors
- Translatable, with your own colors, icons and menu
- API for your own buttons
- TypeScript types included
- Works with `resize-quill-image` and `quill-image-alt`

## Installation

```bash
npm install quill-tablekit
```

```bash
pnpm add quill-tablekit
# or
yarn add quill-tablekit
```

You also need `quill` 2.x. It's a peer dependency, so install it yourself if you don't have it yet. Quill 1 isn't supported.

### CDN

Load Quill first. The module is then available as `QuillTableKit`:

```html
<link href="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css" rel="stylesheet" />
<script src="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js"></script>
<script src="https://cdn.jsdelivr.net/npm/quill-tablekit/dist/index.iife.js"></script>

<div id="editor"></div>
<script>
  Quill.register('modules/tableKit', QuillTableKit)

  new Quill('#editor', { theme: 'snow', modules: { toolbar: [['bold', 'italic'], ['table']], tableKit: true } })
</script>
```

## Usage

```js
import Quill from 'quill'
import TableKit from 'quill-tablekit'
import 'quill/dist/quill.snow.css'

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

- Add `'table'` to the toolbar to get the table button.
- The module's CSS is added for you.
- Don't turn on Quill's own `table` module at the same time. Both use the same button.

Click the table button and pick a size. Then click into the table and a bar shows up with everything else. [Usage](https://github.com/littlenines/quill-tablekit/blob/master/docs/usage.md) explains all of it.

## Frameworks

It works with React, Vue, Svelte, Angular, Next.js, Nuxt and others, and with `react-quill-new`. Examples are in [Frameworks](https://github.com/littlenines/quill-tablekit/blob/master/docs/react.md).

## Options

Pass an object instead of `true` to change something. Everything is optional:

```js
tableKit: {
  sortable: true,
  contextMenu: true,
  colors: ['#ffffff', '#fff2cc', '#d9ead3', '#cfe2f3'],
}
```

| Option             | Type      | Default    | What it does                                                                         |
| ------------------ | --------- | ---------- | ------------------------------------------------------------------------------------ |
| `pickerRows`       | `number`  | `8`        | Rows in the size picker grid.                                                        |
| `pickerColumns`    | `number`  | `10`       | Columns in the size picker grid.                                                     |
| `maxRows`          | `number`  | `100`      | Most rows a table can get from the picker or a paste.                                |
| `maxColumns`       | `number`  | `30`       | Most columns a table can get from the picker or a paste.                             |
| `actionBar`        | `boolean` | `true`     | Shows the bar with buttons next to the cell you're in.                               |
| `contextMenu`      | `boolean` | `false`    | Right-click on a cell opens the table menu instead of the browser's menu.            |
| `resizable`        | `boolean` | `true`     | Lets you drag to resize columns, rows and the whole table.                           |
| `sortable`         | `boolean` | `false`    | Adds Sort A → Z and Sort Z → A.                                                      |
| `responsiveWidths` | `boolean` | `true`     | Saves widths as a share of the editor, so tables follow its width. `false` saves px. |
| `minColumnWidth`   | `number`  | `40`       | Narrowest a column can get, in px.                                                   |
| `menu`             | `array`   | every item | Which actions the menu and the action bar show. See [Menu items](#menu-items).       |
| `colors`           | `array`   | 15 colors  | The colors in the properties panel. Any CSS color works.                             |
| `icons`            | `object`  | built in   | Your own icons. See [Icons](#icons).                                                 |
| `labels`           | `object`  | English    | Every text the module shows, for example to translate it. See [Labels](#labels).     |

### Menu items

List the ones you want to keep. They always show in this order:

`insertRowAbove` · `insertRowBelow` · `insertColumnLeft` · `insertColumnRight` · `moveRowUp` · `moveRowDown` · `moveColumnLeft` · `moveColumnRight` · `duplicateRow` · `duplicateColumn` · `sortAscending` · `sortDescending` · `insertParagraphAbove` · `insertParagraphBelow` · `equalColumnWidths` · `fitToContent` · `fitToWidth` · `equalRowHeights` · `selectRow` · `selectColumn` · `copyTable` · `copyAsMarkdown` · `mergeCells` · `splitCell` · `headerRow` · `headerColumn` · `cellProperties` · `tableProperties` · `deleteRow` · `deleteColumn` · `deleteTable`

The two sort items only show with `sortable: true`. With an empty list there's no menu and no action bar, but every action still works from the [API](#api).

### Labels

Only pass the texts you want to change, for example to translate them. Each menu item has a label with the same name:

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

All labels and their default texts are in [Options](https://github.com/littlenines/quill-tablekit/blob/master/docs/options.md#labels).

### Icons

Swap any icon for your own SVG or icon font. Only use markup you trust:

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
| `↑` / `↓`              | The cell above or below, after moving through the lines of the current cell.          |
| `Enter`                | A new line in the same cell.                                                          |
| `Backspace` / `Delete` | Never joins two cells. With several cells selected, empties them and keeps the table. |
| `Alt + F10`            | Moves the focus to the action bar. The arrow keys move between its buttons.           |
| `Escape`               | Hides the action bar, or closes a menu or panel.                                      |

## API

Everything the toolbar and the action bar do, you can also call yourself, for example from your own buttons. The methods work on the table where the cursor is:

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

| Method                                                                  | What it does                                                                            |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `insertTable(rows, columns)`                                            | Adds a table at the cursor.                                                             |
| `deleteTable()`                                                         | Removes the table.                                                                      |
| `insertRowAbove()`, `insertRowBelow()`                                  | Adds a row.                                                                             |
| `insertColumnLeft()`, `insertColumnRight()`                             | Adds a column.                                                                          |
| `deleteRow()`, `deleteColumn()`                                         | Removes the rows or columns the selection touches.                                      |
| `moveRowUp()`, `moveRowDown()`, `moveColumnLeft()`, `moveColumnRight()` | Swaps the row or column with its neighbour.                                             |
| `duplicateRow()`, `duplicateColumn()`                                   | Adds a copy of the row or column next to it.                                            |
| `sortByColumn(order)`                                                   | Sorts the rows by the cursor's column. `'ascending'` (default) or `'descending'`.       |
| `mergeCells()`, `splitCell()`                                           | Merges the selected cells, or splits the merged cell.                                   |
| `canMergeCells()`, `canSplitCell()`                                     | `true` if merging or splitting is possible right now.                                   |
| `selectRow()`, `selectColumn()`                                         | Selects the whole row or column.                                                        |
| `insertParagraphAbove()`, `insertParagraphBelow()`                      | Adds an empty line before or after the table.                                           |
| `copyTable()`, `copyTableAsMarkdown()`                                  | Copies the table, or copies it as Markdown. Returns a promise with `true` if it worked. |
| `getTableMarkdown()`                                                    | Returns the table as a Markdown string.                                                 |
| `getCellProperties()`, `setCellProperties(changes)`                     | Reads or changes the selected cells.                                                    |
| `getTableProperties()`, `setTableProperties(changes)`                   | Reads or changes the whole table.                                                       |
| `setColumnWidths(table, widths)`                                        | Sets the column widths in px for a `<table>` element, or `null` for automatic.          |
| `setRowHeights(table, heights)`                                         | Sets the row heights in px, `null` for a row that fits its content.                     |
| `equalizeColumnWidths()`, `equalizeRowHeights()`                        | Makes every column, or every row, the same size.                                        |
| `fitColumnsToContent()`, `fitTableToWidth()`                            | Makes each column as wide as its content, or the table as wide as the editor.           |
| `moveToCell(direction)`                                                 | Goes to the next (`1`) or previous (`-1`) cell, like Tab.                               |
| `isInTable()`                                                           | `true` if the cursor is in a table.                                                     |
| `destroy()`                                                             | Removes everything the module added. See [Cleanup](#cleanup).                           |

Each change is one undo step. All fields and values are in [API](https://github.com/littlenines/quill-tablekit/blob/master/docs/api.md).

## Saving content

Save `quill.getContents()` like any Delta and load it with `setContents()`. To show it on a page:

- with JavaScript, use a read-only Quill with the module registered;
- without Quill (server rendering, emails, apps), save `quill.getSemanticHTML()` next to the Delta and show that.

Other Delta-to-HTML libraries like `quill-delta-to-html` don't know the table format. More in [Saved content](https://github.com/littlenines/quill-tablekit/blob/master/docs/content.md).

## Cleanup

Before you remove an editor (component unmount, route change), call `destroy()`:

```js
quill.getModule('tableKit')?.destroy()
```

It removes the module's listeners, popups, keyboard shortcuts and paste handling.

## Docs

- [Installation](https://github.com/littlenines/quill-tablekit/blob/master/docs/installation.md): npm, CDN, Quill versions
- [Usage](https://github.com/littlenines/quill-tablekit/blob/master/docs/usage.md): inserting, merging, resizing, sorting, properties, keyboard, copy and paste
- [Options](https://github.com/littlenines/quill-tablekit/blob/master/docs/options.md): all settings, labels, icons, CSS variables
- [API](https://github.com/littlenines/quill-tablekit/blob/master/docs/api.md): every method
- [Saved content](https://github.com/littlenines/quill-tablekit/blob/master/docs/content.md): the Delta and the HTML
- [Frameworks](https://github.com/littlenines/quill-tablekit/blob/master/docs/react.md): React, Vue and others, and a read-only viewer
- [Troubleshooting](https://github.com/littlenines/quill-tablekit/blob/master/docs/troubleshooting.md): common problems
- [Limitations](https://github.com/littlenines/quill-tablekit/blob/master/docs/limitations.md): what it can't do
- [How it works](https://github.com/littlenines/quill-tablekit/blob/master/docs/architecture.md): the code, running it locally, tests

All pages are also listed on the [docs page](https://github.com/littlenines/quill-tablekit/blob/master/docs/README.md).

## License

MIT

> [!NOTE]
> Found a bug or something odd? [Open an issue](https://github.com/littlenines/quill-tablekit/issues). Contributions are welcome.

<h1 align="center">quill-tablekit - In Progress</h1>
<p align="center">
  <img src="https://img.shields.io/npm/l/quill-tablekit?style=flat" alt="license" />
  <img src="https://img.shields.io/badge/Quill_compatible-2.x-blue?style=flat&cacheSeconds=3600" alt="Quill compatible 2.x" />
</p>

A [Quill](https://quilljs.com/) 2 module for tables you can actually edit.

Click the table button in the toolbar and pick the size from a grid, or type it in for bigger tables. Inside a table you can add and remove rows and columns, merge and split cells, resize columns, rows and the whole table by dragging, turn on a header row, and color and align cells. While the cursor is in a table, a small bar with buttons for all of this shows up next to it.

Tables are saved in the normal Quill Delta, so `getContents()` and `setContents()` keep them exactly as they are, including merged cells, column widths, the header row and cell colors. Undo works, and tables pasted from Word, Google Docs or a web page become real tables.

Pairs well with [`resize-quill-image`](https://www.npmjs.com/package/resize-quill-image) and [`quill-image-alt`](https://www.npmjs.com/package/quill-image-alt). All three can be registered on the same Quill instance, and images inside cells can be resized and get alt text.

---

- [Demo](#demo)
- [Installation](#installation)
  - [npm](#npm)
  - [CDN](#cdn)
- [Usage](#usage)
  - [Import the module](#1-import-the-module)
  - [Register the module with Quill](#2-register-the-module-with-quill)
  - [Configure the Quill editor](#3-configure-the-quill-editor)
- [How it works](#how-it-works)
  - [Inserting a table](#inserting-a-table)
  - [The action bar](#the-action-bar)
  - [The table menu](#the-table-menu)
  - [Merging cells](#merging-cells)
  - [Moving and duplicating](#moving-and-duplicating)
  - [Copy and paste](#copy-and-paste)
  - [Header row](#header-row)
  - [Cell and table properties](#cell-and-table-properties)
  - [Resizing](#resizing)
  - [Keyboard](#keyboard)
- [Options](#options)
  - [Option Descriptions](#option-descriptions)
  - [Menu items](#menu-items)
  - [Labels](#labels)
  - [Icons](#icons)
  - [Colors](#colors)
- [Saving and showing content](#saving-and-showing-content)
- [Using it with image modules](#using-it-with-image-modules)
- [API](#api)
- [TypeScript](#typescript)
- [Cleanup / Destroy](#cleanup--destroy)
  - [Usage](#usage-1)
  - [When to use](#when-to-use)
  - [Example with unmount](#example-with-unmount)
- [Problems](#problems)
- [More docs](#more-docs)
- [License](#license)

---

## [Demo](#demo)

## [Installation](#installation)

### [npm](#npm)

```bash
npm install quill-tablekit
```

You also need `quill` 2.0 or newer. It's a peer dependency, so it won't be installed for you.

> **Compatible with [`react-quill-new`](https://www.npmjs.com/package/react-quill-new)**, since it uses Quill 2.x under the hood.

> **Note:** Quill 1.x is not supported. Merged cells need nested blots, which Quill 1 doesn't have. With Quill 1 you get a warning in the console and the module does nothing.

### [CDN](#cdn)

Load Quill first, then the module. The module exposes a global `QuillTableKit` variable.

**unpkg:**

```html
<link href="https://unpkg.com/quill@2.0.3/dist/quill.snow.css" rel="stylesheet" />
<script src="https://unpkg.com/quill@2.0.3/dist/quill.js"></script>
<script src="https://unpkg.com/quill-tablekit/dist/index.iife.js"></script>
```

**jsDelivr:**

```html
<link href="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css" rel="stylesheet" />
<script src="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js"></script>
<script src="https://cdn.jsdelivr.net/npm/quill-tablekit/dist/index.iife.js"></script>
```

Then register and use it:

```html
<script>
  Quill.register('modules/tableKit', QuillTableKit)

  const quill = new Quill('#editor', {
    theme: 'snow',
    modules: { toolbar: [['bold', 'italic'], ['table']], tableKit: {} },
  })
</script>
```

> **Note:** Quill must be loaded before `quill-tablekit`.

---

## [Usage](#usage)

### 1. Import the module

```js
import TableKit from 'quill-tablekit'
```

### 2. Register the module with Quill

```js
Quill.register('modules/tableKit', TableKit)
```

Do this before you create the editor.

### 3. Configure the Quill editor

Add `'table'` to the toolbar to get the table button, and turn the module on:

```js
const quill = new Quill(editorContainer, {
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline'],
      ['link', 'table'],
    ],
    tableKit: true,
  },
  placeholder: 'Compose an epic...',
  theme: 'snow',
})
```

The CSS is added for you, there's nothing else to import.

> **Note:** Don't turn on Quill's built-in `table` module at the same time. Both would try to handle the same toolbar button.

---

## [How it works](#how-it-works)

### [Inserting a table](#inserting-a-table)

- **Click the table button** while the cursor is outside a table, and a grid opens. Move the mouse over it and click when it shows the size you want (8 × 10 by default).
- **For bigger tables**, type the rows and columns in the two boxes under the grid and press Insert (up to 100 × 30 by default).
- The table goes under the line you're on. If that line is empty, the table takes its place.

### [The action bar](#the-action-bar)

While the cursor is in a table, a small bar shows up next to it with buttons for **Rows** and **Columns** (each opens a short menu), **Merge / Split** (it switches depending on what's selected), **Header row**, **Cell properties**, **Table properties**, **More** and **Delete table**. Hover a button to see its name.

The bar follows the cell you click: it sits just above that cell's row (or just below it at the top of the editor), so it never covers what you're editing. Escape hides it until you click into another cell. Set `actionBar: false` to turn it off.

It works from the keyboard too: **Alt+F10** jumps to the bar, the arrow keys move between buttons, Enter opens one, and Escape takes you back to the text.

### [The table menu](#the-table-menu)

Click the table button in the toolbar while the cursor is in a table to get every action in one list:

- Insert row above / below
- Insert column left / right
- Move row up / down, move column left / right, duplicate row / column
- Insert paragraph above / below the table
- Equal column widths, Fit table to width
- Select row / column, Copy table
- Merge cells / Split cell
- Header row
- Cell properties / Table properties
- Delete row / column / table

Every action can be undone with a single undo. If a table is the first thing in the document, **Insert paragraph above table** is how you get a line above it. If you don't need all of these, the [`menu` option](#menu-items) picks which ones show.

### [Merging cells](#merging-cells)

The cell with the cursor has a blue outline, so you always see where you're typing.

Select across cells by dragging, or click in one cell and **Shift+click** in another. The cells that will be merged get a blue highlight. Then pick **Merge cells**. Nothing gets lost: the text of every cell ends up in the merged cell.

**Split cell** undoes it. The text stays in the top-left cell and the others are empty.

**Select row** and **Select column** select every cell in the row or column, so you can merge or delete them in one go.

### [Moving and duplicating](#moving-and-duplicating)

**Move row up / down** and **Move column left / right** swap a row or column with its neighbour. The cursor stays in your cell, so you can keep moving it. Rows covered by the same merged cell move together.

**Duplicate row** adds a copy right below, **Duplicate column** adds one on the right, with the text, colors and merged cells.

### [Copy and paste](#copy-and-paste)

- **Ctrl+C on several cells** copies exactly the highlighted block, as an HTML table and as tab-separated text, so it pastes cell by cell into Excel or Google Sheets. **Copy table** in the menu copies the whole table.
- **Pasting a table while the cursor is in a cell** overwrites the cells from there, going right and down, and adds rows and columns if they don't fit.
- **Backspace, Delete, cut or typing** with several cells selected empties those cells and keeps the table.

### [Header row](#header-row)

**Header row** makes the first row bold with a light gray background. Click it again to turn it off. In the HTML from `getSemanticHTML()`, those cells come out as `<th>`.

### [Cell and table properties](#cell-and-table-properties)

**Cell properties** opens a small panel for the selected cells: background color, vertical alignment (top, middle, bottom) and text alignment (left, center, right, justify).

**Table properties** works on the whole table: its alignment on the page, the borders (solid, dashed or none), the border color, the space inside the cells (compact, normal, wide), striped rows in any color, a background for every cell, and a caption above the table. Colors show as small buttons that open the palette, so the panel stays short. The caption is saved as a real `<caption>`, so screen readers announce it.

Under each set of colors you can pick any other color with the color picker, or type one in (`#1f6feb`, `rgb(...)`, `teal`) and press Enter.

Every click changes the table right away, and the panel stays open so you can change a few things in a row. Press Escape or click outside to close it.

### [Resizing](#resizing)

- **Columns:** drag a vertical border between cells. A border inside the table moves width between two columns, and the right edge makes the whole table wider or narrower.
- **Rows:** drag a horizontal border between rows to make the row above it taller. A row still grows when its text needs more room.
- **The whole table:** hover a table and drag the round handle at its bottom-right corner. The columns keep their proportions, and the height is split evenly over the rows.

While you drag, only a guide line or a dashed outline moves, and the table changes when you let go. A table can't be dragged wider than the editor: the guide turns red when you reach that point. Widths and heights are saved in the Delta, and each drag is one undo step.

After some dragging, **Equal column widths** makes all columns the same width and **Fit table to width** makes the table exactly as wide as the editor. Resizing also works in an editor zoomed with CSS `transform: scale()`.

### [Keyboard](#keyboard)

| Key                    | Behavior                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| `Tab`                  | Goes to the next cell and selects its text. In the last cell it adds a row.                |
| `Shift + Tab`          | Goes to the previous cell.                                                                 |
| `Up` / `Down`          | Goes to the cell above or below, after moving through the lines of the current cell.       |
| `Alt + F10`            | Moves the focus to the action bar.                                                         |
| `Enter`                | Makes a new line inside the same cell.                                                     |
| `Backspace` / `Delete` | Never joins two cells. With several cells selected, clears their text but keeps the table. |

---

## [Options](#options)

You can configure the behavior of `quill-tablekit` by passing options inside your Quill config:

```js
tableKit: {
  pickerRows: 8,
  pickerColumns: 10,
  maxRows: 100,
  maxColumns: 30,
  contextMenu: false,
  actionBar: true,
  resizable: true,
  minColumnWidth: 40,
  menu: ['insertRowBelow', 'insertColumnRight', 'mergeCells', 'splitCell', 'deleteTable'],
  colors: ['#ffffff', '#fff2cc', '#d9ead3', '#cfe2f3'],
  icons: {},
}
```

### [Option Descriptions](#option-descriptions)

| Option           | Type      | Default    | Description                                                               |
| ---------------- | --------- | ---------- | ------------------------------------------------------------------------- |
| `pickerRows`     | `number`  | `8`        | Rows in the size picker grid.                                             |
| `pickerColumns`  | `number`  | `10`       | Columns in the size picker grid.                                          |
| `maxRows`        | `number`  | `100`      | Most rows you can insert at once.                                         |
| `maxColumns`     | `number`  | `30`       | Most columns you can insert at once.                                      |
| `contextMenu`    | `boolean` | `false`    | Right-click on a cell opens the table menu instead of the browser's menu. |
| `actionBar`      | `boolean` | `true`     | Shows the bar with buttons next to the table while the cursor is in it.   |
| `resizable`      | `boolean` | `true`     | Lets you resize columns, rows and the whole table by dragging.            |
| `minColumnWidth` | `number`  | `40`       | Narrowest a column can be dragged, in px.                                 |
| `menu`           | `array`   | every item | Which items the table menu shows. See [Menu items](#menu-items).          |
| `colors`         | `array`   | 15 colors  | The colors in the properties panel. Any CSS color works.                  |
| `icons`          | `object`  | built in   | Your own icons for the action bar. See [Icons](#icons).                   |
| `labels`         | `object`  | English    | The text in the picker, the menu and the panel. See [Labels](#labels).    |

### [Menu items](#menu-items)

Pass the items you want, and the rest are hidden. They always show in the same order:

`insertRowAbove` · `insertRowBelow` · `insertColumnLeft` · `insertColumnRight` · `moveRowUp` · `moveRowDown` · `moveColumnLeft` · `moveColumnRight` · `duplicateRow` · `duplicateColumn` · `insertParagraphAbove` · `insertParagraphBelow` · `equalColumnWidths` · `fitToWidth` · `selectRow` · `selectColumn` · `copyTable` · `mergeCells` · `splitCell` · `headerRow` · `cellProperties` · `tableProperties` · `deleteRow` · `deleteColumn` · `deleteTable`

### [Labels](#labels)

Every text in the picker, the menu and the panel can be changed, for example to translate it. Only pass the ones you want to change:

```js
tableKit: {
  labels: {
    insertTable: 'Tabelle einfügen',
    mergeCells: 'Zellen verbinden',
    splitCell: 'Zelle teilen',
  },
}
```

Each menu item above has a label with the same name. The picker, the panel and the action bar have a few more: `insertTable`, `customSize`, `rowsInput`, `columnsInput`, `insertButton`, `background`, `borderColor`, `borderStyle`, `borderSolid`, `borderDashed`, `borderNone`, `cellPadding`, `paddingCompact`, `paddingNormal`, `paddingWide`, `stripedRows`, `stripeColor`, `defaultColor`, `caption`, `noColor`, `customColor`, `colorCode`, `textAlign`, `verticalAlign`, `tableAlign`, `alignLeft`, `alignCenter`, `alignRight`, `alignJustify`, `alignTop`, `alignMiddle`, `alignBottom`, `actionBar`, `rowsGroup`, `columnsGroup` and `moreGroup`. The full list with the default texts is in [Options](https://github.com/littlenines/quill-tablekit/blob/master/docs/options.md#labels).

### [Icons](#icons)

The action bar has its own small icons. Swap any of them for your own SVG or icon-font markup:

```js
tableKit: {
  icons: {
    rows: '<svg viewBox="0 0 24 24" width="16" height="16">...</svg>',
    deleteTable: '<i class="icon-trash"></i>',
  },
}
```

The names are `rows`, `columns`, `merge`, `split`, `headerRow`, `cellProperties`, `tableProperties`, `more`, `deleteTable`, `chevron`, and `insertTable` for the toolbar button. The markup is used as it is, so only pass icons you trust.

### [Colors](#colors)

The module's own colors come from CSS variables. Set them on the editor container:

```css
.ql-container {
  --qlt-accent: #7c3aed; /* outline of selected cells, resize line, buttons */
  --qlt-selection-bg: rgba(124, 58, 237, 0.12); /* background of selected cells */
  --qlt-active-cell-bg: rgba(124, 58, 237, 0.05); /* background of the cell with the cursor */
  --qlt-border: #d4d4d8; /* cell borders */
  --qlt-header-bg: #ede9fe; /* background of the header row */
  --qlt-stripe-bg: #faf5ff; /* every other row in a striped table */
}
```

Colors picked in the properties panel win over these.

---

## [Saving and showing content](#saving-and-showing-content)

Save the Delta like you normally would:

```js
const delta = quill.getContents()
```

To show it again, for example in an article, load it into a read-only Quill with the module registered:

```js
Quill.register('modules/tableKit', TableKit)

const viewer = new Quill('#article', { readOnly: true, modules: { toolbar: false } })
viewer.setContents(delta)
```

If you need HTML, use `quill.getSemanticHTML()`. It gives you a clean `<table>` with `colspan`, `rowspan`, column widths, `<th>` for the header row and the cell colors as inline styles. Other Delta-to-HTML libraries don't know the table format.

More on this, including what the Delta looks like, in [Saved content](https://github.com/littlenines/quill-tablekit/blob/master/docs/content.md).

---

## [Using it with image modules](#using-it-with-image-modules)

Images in cells work like any other content. With [`resize-quill-image`](https://www.npmjs.com/package/resize-quill-image) and [`quill-image-alt`](https://www.npmjs.com/package/quill-image-alt) registered too, you can click an image in a cell to resize it and hover it to add alt text:

```js
import TableKit from 'quill-tablekit'
import ImageResize from 'resize-quill-image'
import AltText from 'quill-image-alt'

Quill.register('modules/tableKit', TableKit)
Quill.register('modules/imageResize', ImageResize)
Quill.register('modules/altText', AltText)

const quill = new Quill(editorContainer, {
  modules: { toolbar: [['link', 'image', 'table']], tableKit: true, imageResize: true, altText: true },
  theme: 'snow',
})
```

---

## [API](#api)

Everything the toolbar and the menu do, you can also call yourself, for example from your own buttons:

```js
const tableKit = quill.getModule('tableKit')

tableKit.insertTable(3, 4)
tableKit.mergeCells()
tableKit.setTableProperties({ header: true, borderColor: '#6fa8dc' })
tableKit.setTableProperties({ striped: true, stripeColor: '#e8f0fe', caption: 'Sales by region' })
tableKit.setCellProperties({ background: '#fff2cc', verticalAlign: 'middle' })

quill.on('selection-change', () => {
  mergeButton.disabled = !tableKit.canMergeCells()
})
```

| Method                                                | What it does                                                                                                |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `insertTable(rows, columns)`                          | Adds a table at the cursor.                                                                                 |
| `insertRowAbove()`, `insertRowBelow()`                | Adds a row.                                                                                                 |
| `insertColumnLeft()`, `insertColumnRight()`           | Adds a column.                                                                                              |
| `moveRowUp()`, `moveRowDown()`                        | Swaps the row with its neighbour.                                                                           |
| `moveColumnLeft()`, `moveColumnRight()`               | Swaps the column with its neighbour.                                                                        |
| `duplicateRow()`, `duplicateColumn()`                 | Adds a copy of the row or column.                                                                           |
| `insertParagraphAbove()`, `insertParagraphBelow()`    | Adds an empty line before or after the table.                                                               |
| `selectRow()`, `selectColumn()`                       | Selects the whole row or column.                                                                            |
| `copyTable()`                                         | Copies the whole table to the clipboard.                                                                    |
| `deleteRow()`, `deleteColumn()`, `deleteTable()`      | Removes the selected rows, columns or the table.                                                            |
| `mergeCells()`, `splitCell()`                         | Merges the selected cells, or splits a merged one.                                                          |
| `canMergeCells()`, `canSplitCell()`, `isInTable()`    | Tells you what's possible right now.                                                                        |
| `getCellProperties()`, `setCellProperties(changes)`   | Reads or changes background, vertical and text alignment of the selected cells.                             |
| `getTableProperties()`, `setTableProperties(changes)` | Reads or changes the header row, alignment, borders, spacing, stripes, background and caption of the table. |
| `setColumnWidths(table, widths)`                      | Sets the column widths in px, or `null` for automatic.                                                      |
| `setRowHeights(table, heights)`                       | Sets the row heights in px, or `null` for automatic.                                                        |
| `equalizeColumnWidths()`, `fitTableToWidth()`         | Makes the columns equal, or the table as wide as the editor.                                                |
| `destroy()`                                           | Cleans up. See [Cleanup / Destroy](#cleanup--destroy).                                                      |

The full list is in [API](https://github.com/littlenines/quill-tablekit/blob/master/docs/api.md).

---

## [TypeScript](#typescript)

This package ships TypeScript definitions. The option types are exported for use in your own code:

```ts
import TableKit from 'quill-tablekit'
import type { TableKitOptions, TableKitLabels, TableMenuItemName, CellProperties } from 'quill-tablekit'

const labels: Partial<TableKitLabels> = { mergeCells: 'Zellen verbinden' }
const menu: TableMenuItemName[] = ['mergeCells', 'splitCell', 'cellProperties']
const highlight: Partial<CellProperties> = { background: '#fff2cc' }

const options: TableKitOptions = { pickerRows: 6, maxColumns: 12, menu, labels }

const tableKit = quill.getModule('tableKit') as TableKit

tableKit.setCellProperties(highlight)
```

---

## [Cleanup / Destroy](#cleanup--destroy)

If you're dynamically mounting and unmounting the Quill editor (for example in a Single Page Application or during route changes), it's important to properly **clean up** the `quill-tablekit` module to avoid memory leaks or event duplication.

This module provides a `destroy()` method that you can call when tearing down your Quill instance.

### [Usage](#usage-1)

Call `destroy()` **before** clearing the DOM:

```js
const tableKitModule = quill.getModule('tableKit')

if (tableKitModule?.destroy) {
  tableKitModule.destroy()
}

container.innerHTML = ''
```

This will:

- Remove all of the module's event listeners
- Remove the size picker, the table menu, the cell highlight and the resize line

### [When to use](#when-to-use)

- If you're unmounting your editor component
- If you're switching pages in an SPA
- If you're reinitializing Quill manually

### [Example with unmount](#example-with-unmount)

```js
useEffect(() => {
  const quill = new Quill(editorRef.current, { ... })

  return () => {
    const module = quill.getModule('tableKit')
    if (module?.destroy) module.destroy()
    editorRef.current.innerHTML = ''
  }
}, [])
```

---

## [Problems](#problems)

### <ins>Problem: The table button does nothing, or opens the wrong thing</ins>

Check that Quill's own `table` module is not turned on in `modules`. Both use the `table` toolbar button, so only use `tableKit`.

### <ins>Problem: The table menu is too long</ins>

It has 17 items. Use the [`menu` option](#menu-items) to keep only the ones you need. If the editor has a fixed height, a menu that doesn't fit gets its own scroll bar.

### <ins>Problem: Table alignment does nothing</ins>

A new table is as wide as the editor, so there's nothing to align. Resize a column to make the table narrower, then pick center or right in **Table properties**.

### <ins>Problem: Headers, lists or quotes don't work inside a cell</ins>

That's on purpose. A cell can only hold normal lines, so if you apply a header, list, code block or quote inside a cell, nothing happens. Otherwise the line would get pulled out of the table. Bold, italic, links, colors, images and alignment all work.

### <ins>Problem: Tables are missing from my HTML</ins>

Libraries like `quill-delta-to-html` don't know the table format. Use `quill.getSemanticHTML()` instead, see [Saving and showing content](#saving-and-showing-content).

### <ins>Problem: An image in a cell looks stretched after resizing</ins>

An image is never shown wider than its cell. If you drag a [`resize-quill-image`](https://www.npmjs.com/package/resize-quill-image) handle past the cell's edge, the image stops getting wider but keeps getting taller. The same thing happens outside tables when you drag past the editor's edge, it just happens sooner in a cell. Make the column wider first, then resize the image.

### <ins>Problem: The picker, menu or cell highlight shows up outside the editor when you scroll</ins>

The picker, the menu, the cell highlight and the resize line are attached to `.ql-container`. If your `.ql-container` has a fixed height like this:

```css
.ql-container {
  height: 500px;
}
```

they can end up outside the editor's box as you scroll. Instead, use `min-height` and `max-height`:

```css
.ql-container {
  min-height: 500px;
  max-height: 500px;
  overflow: auto;
}
```

This makes `.ql-container` itself the scrolling element, so everything stays inside and moves with the editor. (This is the same problem you get with other Quill modules that show things on top of the editor.)

---

## [More docs](#more-docs)

- [Usage](https://github.com/littlenines/quill-tablekit/blob/master/docs/usage.md): everything about inserting, merging, resizing, keyboard and copy/paste
- [Options](https://github.com/littlenines/quill-tablekit/blob/master/docs/options.md): all settings, labels, class names
- [API](https://github.com/littlenines/quill-tablekit/blob/master/docs/api.md): every method, with examples
- [Saved content](https://github.com/littlenines/quill-tablekit/blob/master/docs/content.md): what the Delta looks like, HTML output
- [React](https://github.com/littlenines/quill-tablekit/blob/master/docs/react.md): editor component and read-only viewer
- [Limitations](https://github.com/littlenines/quill-tablekit/blob/master/docs/limitations.md): what doesn't work
- [How it works](https://github.com/littlenines/quill-tablekit/blob/master/docs/architecture.md): the code, running it locally, tests

## [License](#license)

MIT License.
Free for personal and commercial use.

---

> [!NOTE]
> If you encounter any bugs, memory leaks, or unexpected behavior, feel free to open an issue on the [GitHub repository](https://github.com/littlenines/quill-tablekit/issues).
> Your feedback helps make the module better for everyone.
> If you want to contribute to the project — whether it's fixing a bug or improving performance — your contributions are welcome and appreciated.

> [!TIP]
> If you just want the code and prefer to build your own module on top of it, you're free to do that.
> Everything is located in the `/src` directory for full access and customization.

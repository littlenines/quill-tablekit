<h1 align="center">quill-tablekit - In Progress</h1>
<p align="center">
  <img src="https://img.shields.io/npm/l/quill-tablekit?style=flat" alt="license" />
  <img src="https://img.shields.io/badge/Quill_compatible-2.x-blue?style=flat&cacheSeconds=3600" alt="Quill compatible 2.x" />
</p>

A [Quill](https://quilljs.com/) 2 module for tables you can actually edit.

Click the table button in the toolbar and pick the size from a grid, or type it in for bigger tables. Inside a table you can add and remove rows and columns, merge and split cells, and drag cell borders to resize columns. Right-click any cell for the table menu.

Tables are saved in the normal Quill Delta, so `getContents()` and `setContents()` keep them exactly as they are, including merged cells and column widths. Undo works, and tables pasted from Word, Google Docs or a web page become real tables.

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
  - [The table menu](#the-table-menu)
  - [Merging cells](#merging-cells)
  - [Resizing columns](#resizing-columns)
  - [Keyboard](#keyboard)
- [Options](#options)
  - [Option Descriptions](#option-descriptions)
  - [Labels](#labels)
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

### [The table menu](#the-table-menu)

Click the table button while the cursor is in a table, or **right-click any cell**. You get:

- Insert row above / below
- Insert column left / right
- Merge cells / Split cell
- Delete row / column / table

Every action can be undone with a single undo.

### [Merging cells](#merging-cells)

Select across cells by dragging, or click in one cell and **Shift+click** in another. The cells that will be merged get a blue highlight. Then pick **Merge cells**. Nothing gets lost: the text of every cell ends up in the merged cell.

**Split cell** undoes it. The text stays in the top-left cell and the others are empty.

### [Resizing columns](#resizing-columns)

Move the mouse onto a vertical border between cells, and a blue line shows up. Drag it.

- Dragging a border **inside** the table moves width from one column to its neighbour, so the table stays the same size.
- Dragging the **right edge** of the table makes the whole table wider or narrower.

The widths are saved in the Delta.

### [Keyboard](#keyboard)

| Key                    | Behavior                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| `Tab`                  | Goes to the next cell and selects its text. In the last cell it adds a row.                |
| `Shift + Tab`          | Goes to the previous cell.                                                                 |
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
  contextMenu: true,
  resizable: true,
  minColumnWidth: 40,
}
```

### [Option Descriptions](#option-descriptions)

| Option           | Type      | Default | Description                                                                         |
| ---------------- | --------- | ------- | ----------------------------------------------------------------------------------- |
| `pickerRows`     | `number`  | `8`     | Rows in the size picker grid.                                                       |
| `pickerColumns`  | `number`  | `10`    | Columns in the size picker grid.                                                    |
| `maxRows`        | `number`  | `100`   | Most rows you can insert at once.                                                   |
| `maxColumns`     | `number`  | `30`    | Most columns you can insert at once.                                                |
| `contextMenu`    | `boolean` | `true`  | Right-click on a cell opens the table menu. The toolbar button opens it either way. |
| `resizable`      | `boolean` | `true`  | Lets you drag cell borders to resize columns.                                       |
| `minColumnWidth` | `number`  | `40`    | Narrowest a column can be dragged, in px.                                           |
| `labels`         | `object`  | English | The text in the picker and the menu. See [Labels](#labels).                         |

### [Labels](#labels)

Every text in the picker and the menu can be changed, for example to translate it. Only pass the ones you want to change:

```js
tableKit: {
  labels: {
    insertTable: 'Tabelle einfügen',
    mergeCells: 'Zellen verbinden',
    splitCell: 'Zelle teilen',
  },
}
```

The keys are `insertTable`, `customSize`, `rowsInput`, `columnsInput`, `insertButton`, `insertRowAbove`, `insertRowBelow`, `insertColumnLeft`, `insertColumnRight`, `mergeCells`, `splitCell`, `deleteRow`, `deleteColumn` and `deleteTable`. The full list with the default texts is in [Options](https://github.com/littlenines/quill-tablekit/blob/master/docs/options.md#labels).

### [Colors](#colors)

The colors come from three CSS variables. Set them on the editor container:

```css
.ql-container {
  --qlt-accent: #7c3aed; /* outline of selected cells, resize line, buttons */
  --qlt-selection-bg: rgba(124, 58, 237, 0.12); /* background of selected cells */
  --qlt-border: #d4d4d8; /* cell borders */
}
```

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

If you need HTML, use `quill.getSemanticHTML()`. It gives you a clean `<table>` with `colspan`, `rowspan` and column widths. Other Delta-to-HTML libraries don't know the table format.

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

quill.on('selection-change', () => {
  mergeButton.disabled = !tableKit.canMergeCells()
})
```

| Method                                             | What it does                                           |
| -------------------------------------------------- | ------------------------------------------------------ |
| `insertTable(rows, columns)`                       | Adds a table at the cursor.                            |
| `insertRowAbove()`, `insertRowBelow()`             | Adds a row.                                            |
| `insertColumnLeft()`, `insertColumnRight()`        | Adds a column.                                         |
| `deleteRow()`, `deleteColumn()`, `deleteTable()`   | Removes the selected rows, columns or the table.       |
| `mergeCells()`, `splitCell()`                      | Merges the selected cells, or splits a merged one.     |
| `canMergeCells()`, `canSplitCell()`, `isInTable()` | Tells you what's possible right now.                   |
| `setColumnWidths(table, widths)`                   | Sets the column widths in px, or `null` for automatic. |
| `destroy()`                                        | Cleans up. See [Cleanup / Destroy](#cleanup--destroy). |

The full list is in [API](https://github.com/littlenines/quill-tablekit/blob/master/docs/api.md).

---

## [TypeScript](#typescript)

This package ships TypeScript definitions. The option types are exported for use in your own code:

```ts
import TableKit from 'quill-tablekit'
import type { TableKitOptions, TableKitLabels } from 'quill-tablekit'

const labels: Partial<TableKitLabels> = { mergeCells: 'Zellen verbinden' }

const options: TableKitOptions = { pickerRows: 6, maxColumns: 12, labels }

const tableKit = quill.getModule('tableKit') as TableKit
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

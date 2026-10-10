# Usage

## Setup

```js
import Quill from 'quill'
import TableKit from 'quill-tablekit'
import 'quill/dist/quill.snow.css'

Quill.register('modules/tableKit', TableKit)

const quill = new Quill('#editor', {
  theme: 'snow',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline'],
      ['link', 'table'],
    ],
    tableKit: true,
  },
})
```

A few things to know:

- Call `Quill.register` before you create the editor. That's also when the table formats get registered.
- Put `'table'` in the toolbar to get the button. It uses Quill's own table icon.
- Don't turn on Quill's built-in `table` module too. Both would try to handle the same button.
- The CSS is added for you, you don't need to import anything else.

Settings are in [Options](./options.md), and there's a React example in [React](./react.md).

## Inserting a table

Click the table button when the cursor is not in a table. You'll see a grid: move the mouse over it and click when it shows the size you want. The grid is 8 × 10 by default.

For bigger tables, type the rows and columns in the two boxes under the grid and press Insert. The limit is 100 × 30 unless you change `maxRows` and `maxColumns`.

The table goes under the line you're on. If that line is empty, the table takes its place. There's always a line after the table, so you can keep typing below it.

## The table menu

Click the table button while the cursor is in a table, or right-click any cell. You get:

- Insert row above / below
- Insert column left / right
- Merge cells
- Split cell
- Delete row / column / table

Some details:

- If a merged cell crosses the place where a new row goes, it just gets one row taller.
- If you've resized columns, inserting a column keeps the table the same width. The other columns get a bit narrower.
- Delete row and delete column remove every row or column your selection touches. Deleting the last one removes the whole table.
- Right-clicking a cell outside your current selection moves the cursor into that cell first.

Every one of these can be undone with a single undo.

## Merging cells

Select across cells by dragging, or click in one cell and Shift+click in another. The cells you'll merge get a blue highlight. If your selection only covers part of a merged cell, the highlight grows to include the whole thing.

Then pick Merge cells. Nothing gets lost: the text from each cell ends up in the merged cell, one after another.

Split cell undoes it. The text stays in the top-left cell and the rest are empty.

## Resizing columns

Move the mouse onto a vertical border between cells. A blue line shows up. Drag it.

- Dragging a border inside the table moves width from one column to its neighbour, so the table stays the same size.
- Dragging the right edge of the table makes the whole table wider or narrower.

A column can't get narrower than 40px (`minColumnWidth`). The widths are saved with the content. If you don't want resizing, set `resizable: false`.

## Keyboard

- Tab moves to the next cell and selects what's in it. Shift+Tab goes back. Tab in the last cell adds a new row.
- Enter makes a new line inside the same cell.
- Backspace at the start of a cell does nothing. Normally Quill would join it with the cell before.
- Delete at the end of a cell does nothing, for the same reason.
- If your selection spans several cells, Backspace, Delete or typing clears the text but keeps the table.

Typing `1. ` or `- ` in a cell stays as text. Quill would usually turn that into a list, but lists can't go in a cell.

## Copy and paste

- Tables you paste from Word, Google Docs or a web page become real tables you can edit. Merged cells come along, and column widths too if the source has them.
- Text pasted into a cell stays in that cell, each line as a line in the cell. If you paste a table into a cell, its text goes into that cell.
- Copying a bit of text from inside one cell copies just the text, not a table.

## Images in cells

Images can go in cells like any other content. If you also use [`resize-quill-image`](https://www.npmjs.com/package/resize-quill-image) and [`quill-image-alt`](https://www.npmjs.com/package/quill-image-alt), they work inside cells too: click an image to resize it, hover it to add alt text. Register all three and turn them on together:

```js
Quill.register('modules/tableKit', TableKit)
Quill.register('modules/imageResize', ImageResize)
Quill.register('modules/altText', AltText)

const quill = new Quill('#editor', {
  theme: 'snow',
  modules: { toolbar: [['image', 'table']], tableKit: true, imageResize: true, altText: true },
})
```

An image is never shown wider than its cell. If you drag it past the cell's edge, it stops getting wider but keeps getting taller, so it looks stretched. The same thing happens outside tables when you drag an image past the editor's edge.

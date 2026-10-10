# API

Everything the toolbar and menu do, you can also call yourself. That's handy if you want your own buttons.

```ts
import type TableKit from 'quill-tablekit'

const tableKit = quill.getModule('tableKit') as TableKit
```

The methods work on the table where the cursor is. If the editor doesn't have focus (say you just clicked one of your own buttons), they use the last cursor position. Except for `insertTable`, they don't do anything when the cursor isn't in a table.

## Tables

| Method                               | What it does                                                                                                                                                         |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `insertTable(rowCount, columnCount)` | Adds an empty table under the current line, or in its place if the line is empty. Can't go over `maxRows` × `maxColumns`. Does nothing if you're already in a table. |
| `deleteTable()`                      | Removes the table.                                                                                                                                                   |

## Rows and columns

| Method                                      | What it does                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------------- |
| `insertRowAbove()`, `insertRowBelow()`      | Adds a row above or below the selected cells.                                         |
| `insertColumnLeft()`, `insertColumnRight()` | Adds a column left or right of the selected cells.                                    |
| `deleteRow()`                               | Removes every row the selection touches. If that's all of them, the table is removed. |
| `deleteColumn()`                            | Same, for columns.                                                                    |

## Merging

| Method            | What it does                              |
| ----------------- | ----------------------------------------- |
| `mergeCells()`    | Merges the selected cells.                |
| `splitCell()`     | Splits the merged cell the cursor is in.  |
| `canMergeCells()` | `true` if more than one cell is selected. |
| `canSplitCell()`  | `true` if the cursor is in a merged cell. |

## Column widths

`setColumnWidths(table, widths)` sets the width of every column, in px. `table` is the `<table>` element. Pass `null` instead of the widths to go back to automatic widths.

```js
const table = quill.root.querySelector('table')
tableKit.setColumnWidths(table, [120, 200, 120])
```

## Other

| Method                  | What it does                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `isInTable()`           | `true` if the cursor is in a table.                                                                                                                                |
| `moveToCell(direction)` | Goes to the next cell with `1` or the previous one with `-1`, and selects its text. Going past the last cell adds a row. Returns `false` if you're not in a table. |
| `getContext()`          | Info about the table under the cursor, or `null`. The type is `TableContext`. You probably only need it if you're building your own UI.                            |
| `destroy()`             | Removes the module's event listeners and its popups. See [React](./react.md#cleanup).                                                                              |

`TableContext` has:

- `tableBlot`: the table blot
- `tableStart`: where the table starts in the document
- `originalContents`: the table's content as a Delta
- `model`: the table as a `TableModel`
- `startCell`: the cell where the selection starts
- `selectedArea`: the selected block of cells, as `{ top, left, bottom, right }` (bottom and right not included)
- `caretOffset`: where the cursor is inside `startCell`

## Example: your own buttons

```js
const tableKit = quill.getModule('tableKit')

mergeButton.addEventListener('click', () => tableKit.mergeCells())

quill.on('selection-change', () => {
  mergeButton.disabled = !tableKit.canMergeCells()
  splitButton.disabled = !tableKit.canSplitCell()
})
```

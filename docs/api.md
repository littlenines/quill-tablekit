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

| Method                                             | What it does                                                                                                           |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `insertRowAbove()`, `insertRowBelow()`             | Adds a row above or below the selected cells.                                                                          |
| `insertColumnLeft()`, `insertColumnRight()`        | Adds a column left or right of the selected cells.                                                                     |
| `deleteRow()`                                      | Removes every row the selection touches. If that's all of them, the table is removed.                                  |
| `deleteColumn()`                                   | Same, for columns.                                                                                                     |
| `selectRow()`, `selectColumn()`                    | Selects every cell in the rows or columns the selection touches.                                                       |
| `copyTable()`                                      | Copies the whole table to the clipboard as HTML and as tab-separated text. Returns a promise with `true` if it worked. |
| `insertParagraphAbove()`, `insertParagraphBelow()` | Adds an empty line right before or after the table and moves the cursor there.                                         |

## Merging

| Method            | What it does                              |
| ----------------- | ----------------------------------------- |
| `mergeCells()`    | Merges the selected cells.                |
| `splitCell()`     | Splits the merged cell the cursor is in.  |
| `canMergeCells()` | `true` if more than one cell is selected. |
| `canSplitCell()`  | `true` if the cursor is in a merged cell. |

## Cell and table properties

| Method                        | What it does                                                             |
| ----------------------------- | ------------------------------------------------------------------------ |
| `getCellProperties()`         | The properties of the cell the cursor is in, or `null` outside a table.  |
| `setCellProperties(changes)`  | Changes the selected cells. Only the fields you pass change.             |
| `getTableProperties()`        | The properties of the table the cursor is in, or `null` outside a table. |
| `setTableProperties(changes)` | Changes the whole table. Only the fields you pass change.                |

Cell properties:

| Field           | Values                                       | Default  |
| --------------- | -------------------------------------------- | -------- |
| `background`    | any CSS color, or `null` for none            | `null`   |
| `verticalAlign` | `'top'`, `'middle'`, `'bottom'`              | `'top'`  |
| `textAlign`     | `'left'`, `'center'`, `'right'`, `'justify'` | `'left'` |

Table properties:

| Field         | Values                                                  | Default  |
| ------------- | ------------------------------------------------------- | -------- |
| `header`      | `true` makes the first row a header row                 | `false`  |
| `align`       | `'left'`, `'center'`, `'right'`                         | `'left'` |
| `borderColor` | any CSS color, or `null` for the default                | `null`   |
| `background`  | any CSS color, or `null`. Setting it colors every cell. | `null`   |

`getTableProperties()` only gives you a `background` when every cell has the same one. Otherwise it's `null`.

```js
tableKit.setTableProperties({ header: true, borderColor: '#6fa8dc' })
tableKit.setCellProperties({ background: '#fff2cc', verticalAlign: 'middle' })
tableKit.setCellProperties({ background: null })
```

A value that isn't a valid color or alignment is treated like `null`. Each call is one undo step, and the selection stays where it was.

The types are exported too:

```ts
import type { CellProperties, TableProperties } from 'quill-tablekit'
```

## Column widths and row heights

`setColumnWidths(table, widths)` sets the width of every column, in px. `table` is the `<table>` element. Pass `null` instead of the widths to go back to automatic widths.

`setRowHeights(table, heights)` sets the height of each row, in px. Use `null` for a row that should just fit its content, or pass `null` instead of the whole list to reset every row.

```js
const table = quill.root.querySelector('table')

tableKit.setColumnWidths(table, [120, 200, 120])
tableKit.setRowHeights(table, [60, null, null])
```

Like dragging, each call is one undo step.

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

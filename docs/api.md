# API

Everything the toolbar, the action bar and the menu do, you can also call yourself, for example from your own buttons.

```js
const tableKit = quill.getModule('tableKit')

tableKit.insertTable(3, 4)
tableKit.setTableProperties({ header: true, striped: true })
```

In TypeScript, cast it to the module's type:

```ts
import type TableKit from 'quill-tablekit'

const tableKit = quill.getModule('tableKit') as TableKit
```

The methods work on the table where the cursor is. If the editor doesn't have focus (say you just clicked one of your own buttons), they use the last cursor position. Outside a table they do nothing, except `insertTable`. Each change is one undo step.

## Tables

| Method                               | What it does                                                                                                                                                            |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `insertTable(rowCount, columnCount)` | Adds an empty table under the current line, or in its place if the line is empty. From a cell, it goes below the current table. Can't go over `maxRows` × `maxColumns`. |
| `deleteTable()`                      | Removes the table.                                                                                                                                                      |

## Rows and columns

| Method                                             | What it does                                                                                                                                                              |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `insertRowAbove()`, `insertRowBelow()`             | Adds a row above or below the selected cells.                                                                                                                             |
| `insertColumnLeft()`, `insertColumnRight()`        | Adds a column left or right of the selected cells.                                                                                                                        |
| `deleteRow()`, `deleteColumn()`                    | Removes every row or column the selection touches. If that's all of them, removes the table.                                                                              |
| `moveRowUp()`, `moveRowDown()`                     | Swaps the selected rows with the row above or below.                                                                                                                      |
| `moveColumnLeft()`, `moveColumnRight()`            | Swaps the selected columns with their neighbour. The widths move too.                                                                                                     |
| `duplicateRow()`, `duplicateColumn()`              | Adds a copy of the selected rows below them, or of the columns on their right.                                                                                            |
| `selectRow()`, `selectColumn()`                    | Selects every cell in the rows or columns the selection touches.                                                                                                          |
| `sortByColumn(order)`                              | Sorts the rows by the cursor's column. `order` is `'ascending'` (default) or `'descending'`. Works even without the `sortable` option. See [Sorting](./usage.md#sorting). |
| `insertParagraphAbove()`, `insertParagraphBelow()` | Adds an empty line right before or after the table and puts the cursor there.                                                                                             |

## Merging

| Method            | What it does                              |
| ----------------- | ----------------------------------------- |
| `mergeCells()`    | Merges the selected cells.                |
| `splitCell()`     | Splits the merged cell the cursor is in.  |
| `canMergeCells()` | `true` if more than one cell is selected. |
| `canSplitCell()`  | `true` if the cursor is in a merged cell. |

Use the `can...` methods to turn your own buttons on and off:

```js
quill.on('selection-change', () => {
  mergeButton.disabled = !tableKit.canMergeCells()
  splitButton.disabled = !tableKit.canSplitCell()
})
```

## Cell and table properties

| Method                        | What it does                                                             |
| ----------------------------- | ------------------------------------------------------------------------ |
| `getCellProperties()`         | The properties of the cell the cursor is in, or `null` outside a table.  |
| `setCellProperties(changes)`  | Changes the selected cells. Only the fields you pass change.             |
| `getTableProperties()`        | The properties of the table the cursor is in, or `null` outside a table. |
| `setTableProperties(changes)` | Changes the whole table. Only the fields you pass change.                |

```js
tableKit.setCellProperties({ background: '#fff2cc', verticalAlign: 'middle' })
tableKit.setCellProperties({ background: null })

tableKit.setTableProperties({ header: true, borderColor: '#6fa8dc' })
tableKit.setTableProperties({ striped: true, cellPadding: 'compact', caption: 'Sales by region' })
```

**Cell properties:**

| Field           | Values                                       | Default  |
| --------------- | -------------------------------------------- | -------- |
| `background`    | any CSS color, or `null` for none            | `null`   |
| `verticalAlign` | `'top'`, `'middle'`, `'bottom'`              | `'top'`  |
| `textAlign`     | `'left'`, `'center'`, `'right'`, `'justify'` | `'left'` |

**Table properties:**

| Field          | Values                                                                     | Default    |
| -------------- | -------------------------------------------------------------------------- | ---------- |
| `header`       | `true` makes the first row a header row                                    | `false`    |
| `headerColumn` | `true` makes the first column a header column                              | `false`    |
| `align`        | `'left'`, `'center'`, `'right'`                                            | `'left'`   |
| `borderStyle`  | `'solid'`, `'dashed'`, `'none'`                                            | `'solid'`  |
| `borderColor`  | any CSS color, or `null` for the default                                   | `null`     |
| `cellPadding`  | the space inside the cells: `'compact'`, `'normal'`, `'wide'`              | `'normal'` |
| `striped`      | `true` gives every other row a light background                            | `false`    |
| `stripeColor`  | any CSS color, or `null` for the default light gray                        | `null`     |
| `background`   | any CSS color, or `null`. Setting it colors every cell.                    | `null`     |
| `caption`      | a short title, saved as `<caption>`. `''` removes it. Up to 300 characters | `''`       |
| `captionSide`  | `'top'` or `'bottom'`                                                      | `'top'`    |

- A value that isn't a valid color or alignment counts as `null`.
- `getTableProperties()` only gives a `background` when every cell has the same one. Otherwise it's `null`.
- The selection stays where it was.

The types are exported:

```ts
import type { CellProperties, TableProperties, BorderStyle, CellPadding, CaptionSide } from 'quill-tablekit'
```

## Sizes

| Method                           | What it does                                                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `setColumnWidths(table, widths)` | Sets every column's width in px. Pass `null` instead of the widths for automatic widths.                                 |
| `setRowHeights(table, heights)`  | Sets each row's height in px. `null` for a row lets it fit its content, and `null` instead of the list resets every row. |
| `equalizeColumnWidths()`         | Gives every column the same width. The table keeps its width.                                                            |
| `equalizeRowHeights()`           | Gives every row the same height, tall enough for the tallest content.                                                    |
| `fitColumnsToContent()`          | Makes each column as wide as its content, shrunk to fit the editor if needed.                                            |
| `fitTableToWidth()`              | Makes the table as wide as the editor. The columns keep their proportions.                                               |

`setColumnWidths` and `setRowHeights` take the `<table>` element. The others work on the table the cursor is in.

```js
const table = quill.root.querySelector('table')

tableKit.setColumnWidths(table, [120, 200, 120])
tableKit.setRowHeights(table, [60, null, null])
```

You always pass px. Unless `responsiveWidths` is `false`, the widths are saved as a share of the editor's current width.

## Copying

| Method                  | What it does                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `copyTable()`           | Copies the whole table, as HTML for editors and tab-separated text for spreadsheets.              |
| `copyTableAsMarkdown()` | Copies the whole table as Markdown.                                                               |
| `getTableMarkdown()`    | Returns the table as a Markdown string, or `null` outside a table. Nothing goes to the clipboard. |

The two copy methods return a promise with `true` if it worked. Call them from a click or key handler, since browsers block copying otherwise. They work best on `https://` pages and `localhost`. Elsewhere the module falls back to the browser's older copy command, and if that's blocked too, you get `false`.

## Other

| Method                  | What it does                                                                                                                                         |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isInTable()`           | `true` if the cursor is in a table.                                                                                                                  |
| `moveToCell(direction)` | Goes to the next cell with `1` or the previous one with `-1`, like Tab. Past the last cell, it adds a row. Returns `false` if you're not in a table. |
| `destroy()`             | Removes everything the module added. Call it before you remove the editor. See [React](./react.md#cleanup).                                          |

## Advanced: `getContext()`

`getContext()` returns the table under the cursor as a grid, or `null`. You only need it if you're building your own table UI. It's internal, so it can change in a new version.

The `TableContext` it returns has:

- `tableBlot`: the table blot
- `tableStart`: where the table starts in the document
- `originalContents`: the table's content as a Delta
- `model`: the table as a `TableModel` grid
- `startCell`: the cell where the selection starts
- `selectedArea`: the selected block of cells, as `{ top, left, bottom, right }` (bottom and right not included)
- `caretOffset`: where the cursor is inside `startCell`

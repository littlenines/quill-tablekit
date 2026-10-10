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
      contextMenu: true,
      resizable: true,
      minColumnWidth: 40,
      labels: {},
    },
  },
})
```

| Option           | Default | What it does                                                                        |
| ---------------- | ------- | ----------------------------------------------------------------------------------- |
| `pickerRows`     | `8`     | Rows in the size picker grid.                                                       |
| `pickerColumns`  | `10`    | Columns in the size picker grid.                                                    |
| `maxRows`        | `100`   | Most rows you can insert at once.                                                   |
| `maxColumns`     | `30`    | Most columns you can insert at once.                                                |
| `contextMenu`    | `true`  | Right-click on a cell opens the table menu. The toolbar button opens it either way. |
| `resizable`      | `true`  | Lets you drag cell borders to resize columns.                                       |
| `minColumnWidth` | `40`    | Narrowest a column can be dragged, in px.                                           |
| `labels`         | English | The text in the picker and the menu. See below.                                     |

If you pass something that isn't a positive number for the number options, the default is used.

## Labels

You can change any text in the picker and the menu, for example to translate it. Only pass the ones you want to change:

```js
tableKit: {
  labels: {
    insertTable: 'Tabelle einfügen',
    mergeCells: 'Zellen verbinden',
    splitCell: 'Zelle teilen',
  },
}
```

| Key                 | Default             |
| ------------------- | ------------------- |
| `insertTable`       | Insert table        |
| `customSize`        | Custom size         |
| `rowsInput`         | Rows                |
| `columnsInput`      | Columns             |
| `insertButton`      | Insert              |
| `insertRowAbove`    | Insert row above    |
| `insertRowBelow`    | Insert row below    |
| `insertColumnLeft`  | Insert column left  |
| `insertColumnRight` | Insert column right |
| `mergeCells`        | Merge cells         |
| `splitCell`         | Split cell          |
| `deleteRow`         | Delete row          |
| `deleteColumn`      | Delete column       |
| `deleteTable`       | Delete table        |

## Colors and styles

The colors come from three CSS variables. Set them on the editor container:

```css
.ql-container {
  --qlt-accent: #7c3aed; /* outline of selected cells, resize line, buttons */
  --qlt-selection-bg: rgba(124, 58, 237, 0.12); /* background of selected cells */
  --qlt-border: #d4d4d8; /* cell borders */
}
```

If you want to style more than that, these are the class names:

| Class            | What it is                           |
| ---------------- | ------------------------------------ |
| `qlt-table`      | A table in the editor                |
| `qlt-cell`       | A cell                               |
| `qlt-cell-line`  | A line of text in a cell             |
| `qlt-picker`     | The size picker                      |
| `qlt-menu`       | The table menu                       |
| `qlt-selection`  | The highlight over selected cells    |
| `qlt-col-handle` | The line you drag to resize a column |

## TypeScript

```ts
import type { TableKitOptions, TableKitLabels } from 'quill-tablekit'

const options: TableKitOptions = { pickerRows: 6, maxColumns: 12 }
```

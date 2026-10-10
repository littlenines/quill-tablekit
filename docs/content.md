# Saved content

## What the Delta looks like

Tables are stored in the normal Quill Delta. So `getContents()`, `setContents()`, `updateContents()` and undo all just work.

Every line inside a table has a `tablekit-cell` attribute that says which table, row and cell it's in:

```json
[
  { "insert": "Region" },
  {
    "insert": "\n",
    "attributes": {
      "tablekit-cell": { "table": "tbl-1", "row": "row-1", "cell": "cell-1", "rowspan": 1, "colspan": 2 }
    }
  },
  { "insert": "North" },
  {
    "insert": "\n",
    "attributes": {
      "tablekit-cell": { "table": "tbl-1", "row": "row-2", "cell": "cell-2", "rowspan": 1, "colspan": 1 }
    }
  },
  { "insert": "10" },
  {
    "insert": "\n",
    "attributes": {
      "tablekit-cell": { "table": "tbl-1", "row": "row-2", "cell": "cell-3", "rowspan": 1, "colspan": 1 }
    }
  }
]
```

- `table`, `row` and `cell` are ids. All lines of one table share the `table` id, and so on.
- If a few lines in a row have the same `cell` id, that's one cell with several lines.
- `rowspan` and `colspan` are how many rows and columns the cell covers.
- `widths` only shows up after you've resized a column. It's the width of each column in px, and every line of the table has it.
- `rowHeight` only shows up after you've resized a row. It's the height of that row in px, and every line in that row has it.

The properties from the panel are stored the same way. They only show up once you've set them, so a plain table stays short:

| Field           | Belongs to | Example     | Set by                   |
| --------------- | ---------- | ----------- | ------------------------ |
| `header`        | table      | `true`      | Header row               |
| `tableAlign`    | table      | `"center"`  | Table properties         |
| `borderColor`   | table      | `"#6fa8dc"` | Table properties         |
| `borderStyle`   | table      | `"dashed"`  | Table properties         |
| `cellPadding`   | table      | `"compact"` | Table properties         |
| `striped`       | table      | `true`      | Table properties         |
| `stripeColor`   | table      | `"#e8f0fe"` | Table properties         |
| `caption`       | table      | `"Sales"`   | Table properties         |
| `background`    | cell       | `"#fff2cc"` | Cell or table properties |
| `verticalAlign` | cell       | `"middle"`  | Cell properties          |

Table fields are on every line of the table, like `widths`. Cell fields are on every line of that cell. Text alignment isn't in here: it's Quill's own `align` attribute on each line, next to `tablekit-cell`.

That's all the module needs to build the table again, so whatever you save loads back the same.

If you build Deltas yourself, the ids can be any string as long as they're unique in the document. There's a type for the attribute:

```ts
import type { TableCellValue } from 'quill-tablekit'
```

## HTML

`quill.getSemanticHTML()` gives you normal HTML you can use outside the editor. Tables come out as a plain `<table>` with `rowspan` and `colspan`, a `<colgroup>` if columns were resized, and simple borders. None of the editor's classes or data attributes are in there.

The properties come along as inline styles: cell backgrounds, vertical alignment, row heights, the border color and style, the cell spacing and the table's alignment. Striped rows come out as a `background-color` on the cells of every other row, in the table's stripe color. If the table has a header row, its cells are `<th scope="col">` instead of `<td>`, bold and with a light gray background. A caption comes out as `<caption>`, the first thing in the table. Text alignment inside a table comes out both as Quill's `ql-align-center` class and as an inline `text-align`, so it also works where Quill's CSS isn't loaded, like in emails.

```html
<table style="border-collapse: collapse; table-layout: fixed; width: 100%;">
  <tbody>
    <tr>
      <td colspan="2" style="border: 1px solid #000;"><p>Region</p></td>
    </tr>
    <tr>
      <td style="border: 1px solid #000;"><p>North</p></td>
      <td style="border: 1px solid #000;"><p>10</p></td>
    </tr>
  </tbody>
</table>
```

When you paste this HTML back into an editor, the table gets all of it back: the header row, the border style, the cell spacing, the stripes and the caption.

Don't use `quill.root.innerHTML` for this. That's the editor's own markup and the table styles for it only work inside the editor, so outside it you get tables with no borders.

## Showing saved content

Say you save `quill.getContents()` to your API and want to show it in an article. You have two options.

### Load it into a read-only Quill

Good if the page runs JavaScript anyway. Register the module once, then:

```js
import Quill from 'quill'
import TableKit from 'quill-tablekit'
import 'quill/dist/quill.snow.css'

Quill.register('modules/tableKit', TableKit)

const viewer = new Quill(articleElement, { readOnly: true, modules: { toolbar: false } })
viewer.setContents(deltaFromApi)
```

You don't need `tableKit` in the modules here. Registering is enough for the tables to show up with their styles, and in read-only mode none of the editing stuff (menu, resizing) is active. There's a React version in [React](./react.md#showing-saved-content).

### Save HTML too

Good if the article is rendered without Quill, like server-side rendering, emails or a mobile app. Save both when the user saves:

```js
await api.save({ delta: quill.getContents(), html: quill.getSemanticHTML() })
```

Use the Delta when you load it back into the editor, and the HTML when you just show it.

One thing to watch out for: other Delta-to-HTML libraries (like `quill-delta-to-html`) don't know about `tablekit-cell`. They'll turn every cell into a normal paragraph.

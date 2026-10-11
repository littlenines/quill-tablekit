# Troubleshooting

## The table button doesn't show up

- Check that `'table'` is in your toolbar, like `toolbar: [['bold'], ['table']]`.
- Check that `Quill.register('modules/tableKit', TableKit)` runs before `new Quill(...)`.

## The table button does nothing, or opens the wrong thing

Check that Quill's own `table` module isn't turned on in `modules`. Both use the `table` toolbar button, so only use `tableKit`.

## There's a warning in the console and nothing works

The module needs Quill 2. With Quill 1 it warns once and turns itself off. See [Installation](./installation.md).

## Tables have no borders outside the editor

You're probably saving `quill.root.innerHTML`. That's the editor's own markup, and its table styles only exist inside the editor. Use `quill.getSemanticHTML()` instead, see [Saved content](./content.md#html).

## Tables are missing from my HTML

Libraries like `quill-delta-to-html` don't know the table format and turn every cell into a paragraph. Use `quill.getSemanticHTML()` instead, see [Saved content](./content.md#html).

## A menu item is grayed out

It means there's nothing to do right now:

- **Move row up** in the first row, **Move row down** in the last one, and the same for columns.
- **Merge cells** with only one cell selected.
- **Sort** when a cell is merged across rows, since sorting would cut it apart.
- **Equal column widths** or **Fit table to width** when the columns are already equal and the table already fills the editor, like on a new table.

## The table menu is too long

Use the [`menu` option](./options.md#menu) to keep only the items you need. In an editor with a fixed height, a menu that doesn't fit gets its own scroll bar.

## Table alignment does nothing

A new table is as wide as the editor, so there's nothing to align. Make the table narrower first (drag a column or the corner), then pick center or right in **Table properties**.

## Headers, lists or quotes don't work inside a cell

That's on purpose. A cell can only hold normal lines, so applying a header, list, code block or quote in a cell does nothing. Otherwise the line would get pulled out of the table. Bold, italic, links, colors, images and alignment all work.

## Copy table does nothing

Copying works best on `https://` pages and `localhost`. Elsewhere the module uses the browser's older copy command, which some browsers block. If you call `copyTable()` yourself, call it from a click or key press, and check the `false` it returns when copying didn't work.

## An image in a cell looks stretched after resizing

An image is never wider than its cell. If you drag a [`resize-quill-image`](https://www.npmjs.com/package/resize-quill-image) handle past the cell's edge, the image stops getting wider but keeps getting taller. Make the column wider first, then resize the image.

## The picker, menu or cell highlight shows up outside the editor when you scroll

They're attached to `.ql-container`. If it has a fixed height like this:

```css
.ql-container {
  height: 500px;
}
```

they can end up outside the editor's box as you scroll. Use `min-height`, `max-height` and `overflow` instead:

```css
.ql-container {
  min-height: 500px;
  max-height: 500px;
  overflow: auto;
}
```

That makes `.ql-container` itself scroll, so everything stays inside and moves with the editor. Other Quill modules that show things on top of the editor have the same problem.

## Two toolbars show up, or things happen twice

This usually happens in React when Quill is created again without cleaning up the old one, for example in Strict Mode. In your cleanup, call `destroy()` and empty the container. See [React](./react.md#editor).

If it still doesn't work, [open an issue](https://github.com/littlenines/quill-tablekit/issues) and include your Quill version, your setup code and what you expected to happen.

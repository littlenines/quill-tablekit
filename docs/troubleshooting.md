# Troubleshooting

## The table button does nothing, or opens the wrong thing

Check that Quill's own `table` module is not turned on in `modules`. Both use the `table` toolbar button, so only use `tableKit`.

## The table menu is too long

Use the [`menu` option](./options.md#menu) to keep only the items you need. If the editor has a fixed height, a menu that doesn't fit gets its own scroll bar.

## Table alignment does nothing

A new table is as wide as the editor, so there's nothing to align. Make the table narrower first (drag a column or the corner), then pick center or right in **Table properties**.

## Headers, lists or quotes don't work inside a cell

That's on purpose. A cell can only hold normal lines, so if you apply a header, list, code block or quote inside a cell, nothing happens. Otherwise the line would get pulled out of the table. Bold, italic, links, colors, images and alignment all work.

## Tables are missing from my HTML

Libraries like `quill-delta-to-html` don't know the table format. Use `quill.getSemanticHTML()` instead, see [Saved content](./content.md#html).

## An image in a cell looks stretched after resizing

An image is never shown wider than its cell. If you drag a [`resize-quill-image`](https://www.npmjs.com/package/resize-quill-image) handle past the cell's edge, the image stops getting wider but keeps getting taller. The same thing happens outside tables when you drag past the editor's edge, it just happens sooner in a cell. Make the column wider first, then resize the image.

## The picker, menu or cell highlight shows up outside the editor when you scroll

The picker, the menu, the cell highlight and the resize line are attached to `.ql-container`. If your `.ql-container` has a fixed height like this:

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

This makes `.ql-container` itself the scrolling element, so everything stays inside and moves with the editor. Other Quill modules that show things on top of the editor have the same problem.

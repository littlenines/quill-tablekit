# Limitations

What the module can't do.

## Compatibility

- **Quill 2 only.** Quill 1 can't nest blots, which merged cells need. With Quill 1 you get a console warning and the module does nothing.
- **Not together with Quill's built-in `table` module.** Both want the `table` toolbar button.
- **Other Delta-to-HTML libraries** don't understand the table format. Use `quill.getSemanticHTML()` instead (see [Saved content](./content.md#html)).

## What a cell can hold

- **No tables inside tables.** Inserting a table from a cell puts it below the current table, and pasting a table into a cell fills the cells instead (see [Pasting a table into a table](./usage.md#pasting-a-table-into-a-table)).
- **Only normal lines.** Bold, links, colors, images and alignment all work. Headers, lists, code blocks and quotes don't: applying one in a cell does nothing, because it would pull the line out of the table.
- **The caption is plain text**, without bold or links. You change it in Table properties, not by typing above the table.

## Sizes

- **A row height is a minimum.** A row can't be dragged shorter than its content.
- **Table alignment** only does something when the table is narrower than the editor. A new table is full width until you resize it.
- **A responsive table can't get narrower than its content** and cell spacing, so on a very narrow screen it can be wider than its percentage.
- **With `responsiveWidths: false`**, a resized table keeps its pixel width, even if the editor gets narrower later.

## Styles

- **Border color is for the whole table**, not single cells. Two cells next to each other share one border, and the browser only draws one of their colors.
- **Stripes in the saved HTML** use `#f6f8fa` unless a stripe color is picked in Table properties, even if you changed `--qlt-stripe-bg` for the editor.

## Copy and paste

- **Copying works best on `https://` pages.** The Clipboard API only works on `https://` pages and `localhost`. Elsewhere the module falls back to the older copy command, and if the browser blocks that too, `copyTable()` returns `false`.
- **Tables from other sites** keep their header row, cell colors, alignment, caption and border style, but not their border color.
- **Stripes are recognized by their pattern**: every other row has the same background and the rows between don't. That needs at least two colored rows, unless it's this module's own stripe color. A table where you colored every other row by hand comes back as a striped table, which looks the same.
- **Pasting a table into a table** doesn't merge cells in the target, even if they were merged in the copy.
- **Copy as Markdown** leaves out what Markdown can't show: merged cells, colors, borders, sizes, the header column and the caption.
- **Only Markdown tables are converted.** Headings, lists and other Markdown around a pasted table stay plain text.

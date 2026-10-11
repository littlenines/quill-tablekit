# Limitations

- Only Quill 2. Quill 1 can't nest blots, which merged cells need. With Quill 1 you get a console warning and the module does nothing.
- No tables inside tables. Inserting a table while you're in a cell puts it below the current table, and pasting a table into a cell overwrites the cells there instead (see [Usage](./usage.md#pasting-a-table-into-a-table)).
- Cells can only hold normal lines. Bold, links, colors, images and alignment all work. Headers, lists, code blocks and quotes don't: if you try to apply one inside a cell, nothing happens. Otherwise the line would get pulled out of the table.
- With `responsiveWidths: false`, column widths are in px. Once you resize a column, the table keeps that pixel width, even if the editor gets narrower later.
- A responsive table still can't get narrower than its columns' content and the cell padding, so on a very narrow screen it can be wider than its percentage.
- A row can't be dragged shorter than its content. The saved height is a minimum, not an exact height.
- Don't use it together with Quill's built-in `table` module. They both want the `table` toolbar button.
- Other Delta-to-HTML libraries don't understand the table format. Use `quill.getSemanticHTML()` instead (see [Saved content](./content.md#html)).
- Border color is for the whole table, not single cells. With `border-collapse`, two cells next to each other share one border, and the browser only draws one of their colors. A colored border on one cell would show on two sides and not the other two.
- Table alignment (left, center, right) only does something when the table is narrower than the editor. A new table is full width until you resize a column.
- Copying a table from another site brings the header row, cell backgrounds, alignment, a caption and a missing or dashed border along, but not its border color. Stripes are recognized by their pattern: every other row has the same background and the rows between don't. That needs at least two colored rows, except for this module's default stripe color. A table where you colored every other row by hand comes back as a striped table, which looks the same.
- The caption is plain text, no bold or links. In the editor you change it in Table properties, not by typing above the table.
- In the saved HTML, striped rows without their own stripe color use `#f6f8fa`, even if you changed `--qlt-stripe-bg` for the editor. Pick the color in Table properties if it should be in the saved HTML too.
- **Copy table** needs the browser's Clipboard API for the best result, which only works on `https://` pages and `localhost`. Elsewhere it falls back to the older copy command, and if the browser blocks that too, `copyTable()` returns `false`.
- Pasting a table into a table doesn't merge cells in the target, even if they were merged in the copy.

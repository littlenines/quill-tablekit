# Limitations

- Only Quill 2. Quill 1 can't nest blots, which merged cells need. With Quill 1 you get a console warning and the module does nothing.
- No tables inside tables. Inserting a table while you're in a cell does nothing, and pasting a table into a cell overwrites the cells there instead (see [Usage](./usage.md#pasting-a-table-into-a-table)).
- Cells can only hold normal lines. Bold, links, colors, images and alignment all work. Headers, lists, code blocks and quotes don't: if you try to apply one inside a cell, nothing happens. Otherwise the line would get pulled out of the table.
- Column widths are in px. A new table is as wide as the editor. Once you resize a column, the table keeps that pixel width, even if the editor gets narrower later.
- A row can't be dragged shorter than its content. The saved height is a minimum, not an exact height.
- Don't use it together with Quill's built-in `table` module. They both want the `table` toolbar button.
- Other Delta-to-HTML libraries don't understand the table format. Use `quill.getSemanticHTML()` instead (see [Saved content](./content.md#html)).
- Border color is for the whole table, not single cells. With `border-collapse`, two cells next to each other share one border, and the browser only draws one of their colors. A colored border on one cell would show on two sides and not the other two.
- Table alignment (left, center, right) only does something when the table is narrower than the editor. A new table is full width until you resize a column.
- Copying a table from another site brings the header row, cell backgrounds and alignment along, but not its border color.
- **Copy table** needs the browser's Clipboard API for the best result, which only works on `https://` pages and `localhost`. Elsewhere it falls back to the older copy command, and if the browser blocks that too, `copyTable()` returns `false`.
- Pasting a table into a table doesn't merge cells in the target, even if they were merged in the copy.

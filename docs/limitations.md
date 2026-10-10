# Limitations

- Only Quill 2. Quill 1 can't nest blots, which merged cells need. With Quill 1 you get a console warning and the module does nothing.
- No tables inside tables. Inserting a table while you're in a cell does nothing, and if you paste a table into a cell, only its text goes in.
- Cells can only hold normal lines. Bold, links, colors, images and alignment all work. Headers, lists, code blocks and quotes don't: if you try to apply one inside a cell, nothing happens. Otherwise the line would get pulled out of the table.
- Column widths are in px. A new table is as wide as the editor. Once you resize a column, the table keeps that pixel width, even if the editor gets narrower later.
- You can't drag rows to make them taller. Rows are as tall as their content.
- Don't use it together with Quill's built-in `table` module. They both want the `table` toolbar button.
- Other Delta-to-HTML libraries don't understand the table format. Use `quill.getSemanticHTML()` instead (see [Saved content](./content.md#html)).

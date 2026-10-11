# Usage

## Setup

```js
import Quill from 'quill'
import TableKit from 'quill-tablekit'
import 'quill/dist/quill.snow.css'

Quill.register('modules/tableKit', TableKit)

const quill = new Quill('#editor', {
  theme: 'snow',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline'],
      ['link', 'table'],
    ],
    tableKit: true,
  },
})
```

A few things to know:

- Call `Quill.register` before you create the editor. That's also when the table formats get registered.
- Put `'table'` in the toolbar to get the button. It uses Quill's own table icon.
- Don't turn on Quill's built-in `table` module too. Both would try to handle the same button.
- The CSS is added for you, you don't need to import anything else.

Settings are in [Options](./options.md), and there's a React example in [React](./react.md).

## Inserting a table

Click the table button in the toolbar. You'll see a grid: move the mouse over it and click when it shows the size you want. The grid is 8 × 10 by default.

For bigger tables, type the rows and columns in the two boxes under the grid and press Insert. The limit is 100 × 30 unless you change `maxRows` and `maxColumns`.

The table goes under the line you're on. If that line is empty, the table takes its place. There's always a line after the table, so you can keep typing below it.

If the cursor is in a table, the new table goes below that table, with an empty line between them. Tables can't go inside other tables.

## The action bar

When the cursor is in a table, a small bar with buttons shows up next to the cell you're in. It follows you: click another cell and it slides over to it, lined up with the cell's left edge, just above its row. If there's no room above (at the top of the editor), it goes just below the row instead. Either way it never covers the cell you're working in. Press Escape to hide it; it comes back when you click into another cell. Hover a button to see what it does.

| Button           | What it does                                                                     |
| ---------------- | -------------------------------------------------------------------------------- |
| Rows             | Opens a short menu: insert, move, duplicate, select or delete rows.              |
| Columns          | The same for columns, plus Equal column widths.                                  |
| Merge / Split    | Merges the selected cells. If you're in a merged cell, it becomes Split instead. |
| Header row       | Turns the header row on or off. The button stays pressed while it's on.          |
| Header column    | The same for the first column.                                                   |
| Cell properties  | Opens the panel for the selected cells.                                          |
| Table properties | Opens the panel for the whole table.                                             |
| More             | Insert a paragraph above or below the table, fit it to the width, copy it.       |
| Delete table     | Removes the table. Undo brings it back.                                          |

Click a button again to close its menu or panel. If the table moves while a menu or panel is open (say you just centered it), the menu or panel moves along with its button. If you'd rather not have the bar, set `actionBar: false`.

### With the keyboard

Press Alt+F10 while the cursor is in a table to jump to the bar. Then:

- Left and Right move between the buttons, Home and End go to the first and last one.
- Enter or Space presses a button. A menu or panel opened this way gets the focus, and you move through a menu with Up and Down.
- Escape closes the menu and puts you back on its button. Escape on the bar takes you back to the text, where you were.

You can also bring your own icons for the buttons, see [Icons](./options.md#icons).

## The table menu

With the action bar turned off (`actionBar: false`), the table button in the toolbar opens this menu while the cursor is in a table, since there's no other place for the table's actions. With the action bar on, the table button always inserts a new table. You get every action in one list:

- Insert row above / below
- Insert column left / right
- Move row up / down, move column left / right, duplicate row / column
- Insert paragraph above / below the table
- Equal column widths, Fit table to width
- Select row / column, Copy table
- Merge cells / Split cell
- Header row, Header column
- Cell properties / Table properties
- Delete row / column / table

That's a long list. If you don't need all of it, pick the items you want with the [`menu` option](./options.md#menu).

Some details:

- If a merged cell crosses the place where a new row goes, it just gets one row taller.
- If you've resized columns, inserting a column keeps the table the same width. The other columns get a bit narrower.
- Delete row and delete column remove every row or column your selection touches. Deleting the last one removes the whole table.

Right-click works like everywhere else on the page and shows the browser's menu. If you want the table menu on right-click instead, set `contextMenu: true`. Right-clicking a cell outside your current selection then moves the cursor into that cell first.

Every one of these can be undone with a single undo.

## Moving and duplicating rows and columns

**Move row up** and **Move row down** swap the row with its neighbour. **Move column left** and **Move column right** do the same for columns, and the column keeps its width. The cursor stays in the cell you were in, so you can press the same action a few times to move a row further.

If a merged cell covers more than one row, those rows move together, and they jump over a neighbour that's merged the same way. The menu item is grayed out when there's nowhere to go, like Move row up in the first row.

**Duplicate row** adds a copy of the row right under it: the text, the colors, merged cells and the row height. **Duplicate column** adds a copy on the right. Like inserting a column, it keeps the table the same width.

## Sorting

Turn it on with `sortable: true`. Then the menu and the Columns button get **Sort A → Z** and **Sort Z → A**, which sort the rows by the column the cursor is in.

- A column can mix numbers, dates and text. A → Z puts the numbers first, then the dates, then the text. Z → A turns all of that around.
- Numbers sort by their value. They're read the way the editor's language writes them, so in German `1.234,5` is a bit over a thousand, and `1.5` works in any language.
- Dates sort by the day they are, with the time if there is one. These are recognized: `2024-03-01`, `1.3.2024.` and `01.03.2024` (day first), and `03/01/2024`.
- With slashes, the column decides whether the day or the month comes first: a `31/12/2023` anywhere in it means day first, a `12/31/2023` means month first. If nothing gives it away, the editor's language does (month first for US English, day first for most others).
- Dates with month names (`Jan 5, 2024`, `5. januar 2024`) and dates that don't exist (`31.2.2024`) sort as text.
- Text sorts in the editor's language's alphabet, and numbers inside text are compared by value (`Item 2` before `Item 10`). Upper and lower case count as the same letter.
- Empty cells go last, in both orders. Rows with the same value keep their order.
- The header row stays on top. Each row moves whole, with its colors and height.
- A cell merged across rows would be cut apart, so with one in the table the sort items are grayed out. Cells merged across columns are fine.

The editor's language is the `lang` attribute on the editor or the closest element above it (like `<html lang="sr">`), or the browser's language if there's none.

Like every change, a sort is one undo step.

## Writing above or below a table

If a table is the first thing in the document, there's no line above it to click into. Use **Insert paragraph above table**. It adds an empty line right before the table and puts the cursor there. **Insert paragraph below table** does the same after it. The new line is always a plain paragraph, even if the next line is a heading.

## Selecting a row or column

**Select row** selects every cell in the row the cursor is in, and **Select column** does the same for the column. If you've already selected a few cells, it selects all the rows or columns they touch. After that you can merge them, delete them, or change their properties.

## Header row and header column

**Header row** turns the first row into a header: it's bold and has a light gray background. Click it again to turn it off. While it's on, there's a check mark next to it in the menu.

**Header column** does the same for the first column, for tables where each row has a name, like a pricing or comparison table. You can use both together.

In the HTML from `getSemanticHTML()`, header cells come out as `<th>` instead of `<td>`: `<th scope="col">` in the header row and `<th scope="row">` in the header column, so screen readers know which cells they label. The header row also goes in its own `<thead>`, so when a long table is printed the header repeats at the top of every page, and Word or Google Docs keep it as a header row when you paste the HTML there. If you insert a row above the header row or a column left of the header column, the new one becomes the header. Striped rows leave the header column alone.

## Cell and table properties

**Cell properties** opens a small panel for the selected cells:

- **Background**: click the color button and pick a color, or the crossed-out box to remove it.
- **Vertical alignment**: top, middle or bottom.
- **Text alignment**: left, center, right or justify. This uses Quill's normal `align` format on every line of the cell.

**Table properties** works on the whole table:

- **Table alignment**: left, center or right. It only shows when the table is narrower than the editor, so resize a column first.
- **Borders**: solid, dashed or none. A table without borders still shows faint dashed lines in the editor so you can see the cells. They're not in the saved HTML. The color button next to it sets the color of all the cell borders. **Default** goes back to the light gray.
- **Cell spacing**: how much room there is around the text in each cell: compact, normal or wide.
- **Background**: colors every cell at once.
- **Striped rows**: every other row gets a light gray background, which makes long tables easier to read. With a header row, the stripes start under it. A cell with its own background keeps it. The color button next to it picks another stripe color, and picking one turns stripes on. **Default** goes back to the light gray.
- **Caption**: a short title for the table. Type it and press Enter. **Top** and **Bottom** next to the box put it above or under the table, like "Table 1: Sales by region" under it in a report. It's saved as a `<caption>`, which screen readers read out the same way in either position, so it's a good way to say what the table is about. Empty the box to remove it.

Every click changes the table right away, and the panel stays open so you can change a few things in a row. Click outside it or press Escape to close it. Each change is one undo step.

New rows and columns copy the background and vertical alignment of the cells next to them, and splitting a merged cell gives all the new cells its look.

Each color is a small button that shows the current color. Click it and the colors open right under it. Pick one and they close again. Only one set of colors is open at a time, so the panel stays short.

The colors come from the [`colors` option](./options.md#colors). For any other color, use the row under the colors: click the small square to open your browser's color picker, or type a color in the box next to it and press Enter. Anything CSS understands works, like `#1f6feb`, `rgb(31, 111, 235)` or `teal`. If it's not a color, the box turns red and nothing changes. The picker applies the color when you close it, so trying out colors doesn't fill up the undo history.

## The current cell

The cell with the cursor gets a blue outline and a faint blue background, so you can see where you're typing at a glance. When you select several cells, the outline makes way for the highlight of the selection. It stays while you work in the properties panel or on the action bar, so you can see which cells you're changing. It's not shown in a read-only editor. The color comes from `--qlt-accent` and `--qlt-active-cell-bg`, see [Colors and styles](./options.md#colors-and-styles).

## Merging cells

Select across cells by dragging, or click in one cell and Shift+click in another. The cells you'll merge get a blue highlight. If your selection only covers part of a merged cell, the highlight grows to include the whole thing.

Then pick Merge cells. Nothing gets lost: the text from each cell ends up in the merged cell, one after another.

Split cell undoes it. The text stays in the top-left cell and the rest are empty.

## Resizing

### Columns

Move the mouse onto a vertical border between cells. A blue line shows up. Drag it.

- Dragging a border inside the table moves width from one column to its neighbour, so the table stays the same size.
- Dragging the right edge of the table makes the whole table wider or narrower.

A column can't get narrower than 40px (`minColumnWidth`), and dragging won't make the table wider than the editor, so you don't end up scrolling sideways. When you push past that point, the line (or the corner handle and its outline) turns red and the cursor shows that you can't go further. A new table already fills the editor, so make it narrower first if you want room to drag it wider again. A table that's already wider (from pasted content, say) can still be made narrower.

### Rows

Move the mouse onto a horizontal border between rows, and a blue line shows up. Drag it down to make the row above it taller, or up to make it shorter again.

The height works like a minimum: if you type more text than fits, the row still grows. A row can't get shorter than its text, so the line stops there when you drag up. Dragging it all the way up gives the row its automatic height back.

### The whole table

Move the mouse over a table and a small round handle shows up at its bottom-right corner. It stays there while the mouse is near the table, and you can grab it a little outside the circle too. Drag it:

- left or right to make the table narrower or wider. Every column changes by the same share, so their proportions stay the same.
- up or down to make it shorter or taller. The difference is split evenly over the rows.

It follows the table's alignment. A centered table grows and shrinks on both sides, so it stays centered and the corner stays under the mouse. On a right-aligned table the handle is at the bottom-left corner, because the right edge doesn't move. The same goes for column borders: on a centered table both outer borders can be dragged, and on a right-aligned table you drag the left border instead of the right one.

While you drag, the table stays as it is and only a blue line (or a dashed outline for the whole table) shows where it will end up. The table changes once, when you let go of the mouse. That keeps dragging smooth, even on big tables with images.

Widths and heights are saved with the content, and each drag is one undo step. If you don't want any resizing, set `resizable: false`.

### Responsive widths

A resize saves the widths as a share of the editor. A table you drag to two thirds of the editor stays two thirds of it, whatever width the editor has when the content is shown (on a phone, say). The columns keep their proportions too.

If you need exact pixel widths instead, set `responsiveWidths: false`. Dragging works exactly the same, only what's saved is different: the table then keeps its pixel width, even when the editor gets narrower later.

- A new table is full width either way, until you resize it.
- The option decides what a resize saves. Tables saved in percent show in percent everywhere, also in an editor with `responsiveWidths: false`, and px tables stay px. Resizing a table saves it in the unit of the editor you're in.
- **Fit table to width** on a percent table makes it exactly 100%.
- The saved HTML has the same percentages, so the table is responsive outside the editor too.

Resizing also works when the editor is zoomed with CSS, like `transform: scale(0.8)` on a parent element. The lines and the outline stay under the mouse, and the sizes are saved as if the editor weren't zoomed.

### Equal sizes and fitting

After some dragging, a few menu items clean things up:

- **Equal column widths** (under Columns) makes every column the same width, without changing how wide the table is.
- **Fit columns to content** (under Columns) makes each column as wide as its longest line, like Word's AutoFit. Short columns like numbers or ids get narrow, and long text gets the room. If that's wider than the editor, all columns shrink by the same share, so the table still fits. A column never gets narrower than `minColumnWidth`.
- **Fit table to width** (under More) makes the table exactly as wide as the editor. The columns keep their proportions.
- **Equal row heights** (under Rows) makes every row the same height: the average height, or the tallest row's content if that's more, so no text gets cut off.

Equal column widths and Fit table to width are grayed out when there's nothing to do, for example on a new table, which already fills the editor with equal columns. Each of these is one undo step.

## Keyboard

- Tab moves to the next cell and selects what's in it. Shift+Tab goes back. Tab in the last cell adds a new row.
- Up and Down go to the cell above or below, at about the same spot in the line, like in Word or Google Docs. In a cell with several lines (or text that wraps), they first move through those lines. From a merged cell, Down goes to the row under all of it. From the first or last row, they leave the table.
- Alt+F10 moves the focus to the action bar, see [With the keyboard](#with-the-keyboard).
- Enter makes a new line inside the same cell.
- Backspace at the start of a cell does nothing. Normally Quill would join it with the cell before.
- Delete at the end of a cell does nothing, for the same reason.
- If your selection spans several cells, Backspace, Delete or typing empties the highlighted cells but keeps the table. Typing then puts the text in the first one.

Typing `1. ` or `- ` in a cell stays as text. Quill would usually turn that into a list, but lists can't go in a cell.

## Copy and paste

- Tables you paste from Word, Google Docs or a web page become real tables you can edit. Merged cells come along, and column widths too if the source has them.
- Text pasted into a cell stays in that cell, each line as a line in the cell.
- Copying a bit of text from inside one cell copies just the text, not a table.

### Copying cells

Select a few cells (drag, or click and Shift+click) and press Ctrl+C. You get exactly the highlighted block, even when the selection runs diagonally, like from the second cell of the first row to the first cell of the second row. Cut works the same way and leaves the cells empty.

The clipboard gets two versions: a small HTML table for editors, and plain text with tabs between cells and a new line for each row. Paste that into Excel or Google Sheets and every cell lands in its own cell.

**Copy table** in the menu copies the whole table that way.

### Pasting text with tabs

Text where the cells are separated by tabs, from a CSV-like file, a plain-text app, or a browser that only gives plain text, works the same way: pasted into a cell, it fills the cells to the right and below, adding rows and columns if needed.

- Cells in quotes are understood the way spreadsheets write them: a quoted cell can contain tabs and line breaks, and `""` is a quote. A line break inside a cell becomes a second line in that cell.
- The text only counts as cells if every line has the same number of them. Otherwise, like code indented with tabs, it's pasted as normal text into the one cell.
- Outside a table, text with tabs is pasted as normal text.

### Markdown tables

Paste a Markdown table, from a README, a chat with an AI or a `.md` file, and it becomes a real table:

```md
| Name      | Price | Note |
| :-------- | ----: | :--: |
| Green tea |  3.50 | hot  |
```

- The first row becomes the header row. If it's empty, it's left out and the table has no header.
- The colons in the second line set the text alignment of the column.
- `**bold**`, `*italic*`, `~~strikethrough~~`, `` `code` ``, links, images and `<br>` line breaks in a cell become real formatting.
- Text around the table stays text, so you can paste a whole section with a table in it. Tables in ``` code blocks stay as they are.
- Into a cell, a pasted table fills the cells like any other table (see below). Markdown with other text around it goes into the cell as plain text.
- If the clipboard also has a real HTML table, like when you copy from a page that shows the table, that one is used.

**Copy as Markdown** (under More) copies the table as Markdown, with the columns lined up and the alignment from the cells. Markdown has no merged cells or colors, so a merged cell's text goes in its first spot and styles are left out. The first row is always the header, since a Markdown table needs one.

### Pasting a table into a table

If the cursor is in a cell and you paste a table, the pasted cells overwrite the cells starting at the cursor, going right and down. With several cells selected, it starts at the top-left one. That's how you move a block of cells around: copy, click where it should go, paste.

- If the pasted table doesn't fit, rows and columns are added at the end, until the table has `maxRows` rows and `maxColumns` columns. Anything beyond that is dropped.
- The text, its formatting, the cell background and the vertical alignment are pasted. The target table keeps its own header row, border color, alignment, column widths and merges. A cell that's covered by a merged cell is skipped.
- It's one undo step.

## Images in cells

Images can go in cells like any other content. If you also use [`resize-quill-image`](https://www.npmjs.com/package/resize-quill-image) and [`quill-image-alt`](https://www.npmjs.com/package/quill-image-alt), they work inside cells too: click an image to resize it, hover it to add alt text. Register all three and turn them on together:

```js
Quill.register('modules/tableKit', TableKit)
Quill.register('modules/imageResize', ImageResize)
Quill.register('modules/altText', AltText)

const quill = new Quill('#editor', {
  theme: 'snow',
  modules: { toolbar: [['image', 'table']], tableKit: true, imageResize: true, altText: true },
})
```

An image is never shown wider than its cell. If you drag it past the cell's edge, it stops getting wider but keeps getting taller, so it looks stretched. The same thing happens outside tables when you drag an image past the editor's edge.

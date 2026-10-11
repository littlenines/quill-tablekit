# Usage

How to set it up, and everything you can do with a table.

- [Setup](#setup)
- [Inserting a table](#inserting-a-table)
- [The action bar](#the-action-bar)
- [The table menu](#the-table-menu)
- [Rows and columns](#rows-and-columns): adding, moving, duplicating, selecting, sorting
- [Merging cells](#merging-cells)
- [Header row and header column](#header-row-and-header-column)
- [Cell and table properties](#cell-and-table-properties): colors, borders, stripes, captions
- [Resizing](#resizing)
- [Writing above or below a table](#writing-above-or-below-a-table)
- [Keyboard](#keyboard)
- [Copy and paste](#copy-and-paste): cells, spreadsheets, Markdown
- [Images in cells](#images-in-cells)

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

- Call `Quill.register` before you create the editor.
- Put `'table'` in the toolbar to get the table button. It uses Quill's own table icon.
- Don't turn on Quill's built-in `table` module as well. Both would try to handle the same button.
- The CSS is added for you, there's nothing else to import.

To change the defaults, see [Options](./options.md). For React, see [React](./react.md).

## Inserting a table

Click the table button in the toolbar. A grid opens: move the mouse over it and click when it shows the size you want.

- **Bigger tables:** type the rows and columns in the two boxes under the grid and press Insert. The limit is 100 × 30, or whatever you set in `maxRows` and `maxColumns`.
- **With the keyboard:** press Enter on the table button. The arrow keys pick the size, Enter inserts it, Tab goes to the size boxes, and Escape closes the grid.

Where it goes:

- The table goes under the line you're on. If that line is empty, the table takes its place.
- There's always a line after the table, so you can keep typing below it.
- If the cursor is already in a table, the new one goes below that table. Tables can't go inside other tables.

## The action bar

When the cursor is in a table, a small bar with buttons shows up just above the row you're in. It moves with you from cell to cell and doesn't cover the cell you're typing in. At the top of the editor, where there's no room above, it goes below the row instead.

| Button           | What it does                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| Rows             | Insert, move, duplicate, select or delete rows, and make them all the same height.                |
| Columns          | Insert, move, duplicate, select or delete columns, plus equal widths, fit to content and sorting. |
| Merge / Split    | Merges the selected cells. In a merged cell, it becomes Split.                                    |
| Header row       | Turns the header row on or off. It stays pressed while it's on.                                   |
| Header column    | The same for the first column.                                                                    |
| Cell properties  | Background and alignment of the selected cells.                                                   |
| Table properties | Borders, spacing, stripes, caption and alignment of the whole table.                              |
| More             | Add a line above or below the table, fit it to the editor, copy it, or copy it as Markdown.       |
| Delete table     | Removes the table. Undo brings it back.                                                           |

Hover a button to see its name. Click it again to close its menu or panel. Press Escape to hide the bar; it comes back when you click into another cell.

To turn the bar off, set `actionBar: false`. You can also use [your own icons](./options.md#icons).

### With the keyboard

| Key                | What it does                                                   |
| ------------------ | -------------------------------------------------------------- |
| `Alt + F10`        | Jumps from the table to the bar.                               |
| `←` `→`            | Moves between the buttons. `Home` and `End` go to the ends.    |
| `Enter` or `Space` | Presses the button. A menu or panel that opens gets the focus. |
| `↑` `↓`            | Moves through an open menu.                                    |
| `Escape`           | Closes the menu. On the bar, takes you back to the text.       |

## The table menu

The menu has every table action in one list. You only see it in two cases:

- With `actionBar: false`, the table button in the toolbar opens it while the cursor is in a table. With the action bar on, the table button always inserts a new table.
- With `contextMenu: true`, right-clicking a cell opens it instead of the browser's menu. If you right-click a cell outside your selection, the cursor moves there first.

It's a long list. To keep only some items, use the [`menu` option](./options.md#menu). That option also decides which items the action bar shows.

Every action can be undone with a single undo.

## Rows and columns

### Adding and deleting

- **Insert row above / below** and **Insert column left / right** add one next to the cursor. The new cells copy the background of their neighbours.
- If a merged cell is where the new row goes, it just gets one row taller.
- If you've resized the columns, a new column keeps the table the same width. The other columns get a bit narrower.
- **Delete row** and **Delete column** remove every row or column your selection touches. Deleting the last one removes the table.

### Moving and duplicating

- **Move row up / down** swaps the row with its neighbour. **Move column left / right** does the same for columns, and the column keeps its width.
- The cursor stays in its cell, so you can repeat the action to move a row further.
- Rows held together by a merged cell move as one block. The item is grayed out when there's nowhere to go, like Move row up in the first row.
- **Duplicate row** adds a copy right under the row, with its text, colors, merged cells and height. **Duplicate column** adds a copy on the right, and the table keeps its width.

### Selecting a row or column

**Select row** selects every cell in the row the cursor is in, and **Select column** does the same for the column. If a few cells are already selected, it selects all the rows or columns they touch. Then you can merge them, delete them or change their properties.

### Sorting

Sorting is off by default. Turn it on with `sortable: true`, and the Columns button gets **Sort A → Z** and **Sort Z → A**. They sort the rows by the column the cursor is in.

It works like sorting in a spreadsheet:

- **Numbers** sort by value, so `9` comes before `10`. They're read the way the page's language writes them: in German, `1.234,5` is a bit over a thousand.
- **Dates** sort by the day they are, with the time if there is one. It understands `2024-03-01`, `1.3.2024.`, `01.03.2024` and `03/01/2024`.
- **Text** sorts in the page's alphabet, ignoring upper and lower case. Numbers inside text count by value, so `Item 2` comes before `Item 10`.
- A column can mix all three. A → Z puts numbers first, then dates, then text. Z → A turns that around.
- **Empty cells** always go last. Rows with the same value keep their order.
- **The header row** stays on top. Each row moves whole, with its colors and height.

A few details:

- For dates with slashes, the column decides whether the day or the month comes first: one `31/12/2023` in it means day first, one `12/31/2023` means month first. If the column doesn't show it, the language decides (month first for US English, day first for most others).
- Dates with month names (`Jan 5, 2024`) and dates that don't exist (`31.2.2024`) sort as text.
- The language is the `lang` attribute of the editor or the closest element above it, like `<html lang="sr">`. Without one, it's the browser's language.
- If a cell is merged across rows, sorting would cut it apart, so the sort items are grayed out. Cells merged across columns are fine.

## Merging cells

1. Select across cells: drag, or click in one cell and Shift+click in another. The cells get a blue highlight. If the selection covers part of a merged cell, the highlight grows to include all of it.
2. Press **Merge** on the action bar.

The text of every cell is kept, one after another in the merged cell.

**Split** undoes it. The text stays in the top-left cell and the others are empty.

## Header row and header column

**Header row** turns the first row into a header: bold, with a light gray background. **Header column** does the same for the first column, for tables where each row has a name, like a pricing table. You can use both.

- If you insert a row above the header row, or a column left of the header column, the new one becomes the header.
- Striped rows leave the header column alone.
- In the saved HTML, header cells are `<th>` and the header row is in a `<thead>`. Screen readers then know which cells are labels, and printed tables repeat the header on every page. See [Saved content](./content.md#html).

## Cell and table properties

Changes apply right away, and the panel stays open so you can change a few things in a row. Click outside it or press Escape to close it. Each change is one undo step.

### Cell properties

For the selected cells:

- **Background**: pick a color, or the crossed-out box for none.
- **Vertical alignment**: top, middle or bottom.
- **Text alignment**: left, center, right or justify.

### Table properties

For the whole table:

- **Table alignment**: left, center or right. Only shows when the table is narrower than the editor, so resize it first.
- **Borders**: solid, dashed or none, and the border color. **Default** goes back to light gray. A table without borders still shows faint lines while you edit, so you can see the cells. They aren't saved.
- **Cell spacing**: compact, normal or wide.
- **Background**: colors every cell at once.
- **Striped rows**: every other row gets a light background, which makes long tables easier to read. The stripes start under the header row, and a cell with its own background keeps it. Picking a stripe color turns stripes on.
- **Caption**: a short title, like "Table 1: Sales by region". Type it and press Enter. **Top** and **Bottom** put it above or under the table. Screen readers read it out, so it's a good way to say what the table is about. Empty the box to remove it.

### Picking a color

Each color is a small button showing the current color. Click it and the colors open under it; pick one and they close. The colors come from the [`colors` option](./options.md#colors).

For any other color, use the row under the colors: the small square opens your browser's color picker, or type a color in the box and press Enter. `#1f6feb`, `rgb(31, 111, 235)` and `teal` all work. If it's not a color, the box turns red and nothing changes.

### The current cell

The cell with the cursor gets a blue outline, so you can always see where you're typing. When you select several cells, the selection highlight takes its place. It's not shown in a read-only editor. To change its color or hide it, see [Colors and styles](./options.md#colors-and-styles).

## Resizing

| Drag                                 | To                                                                     |
| ------------------------------------ | ---------------------------------------------------------------------- |
| A border between two columns         | Move width from one column to the next. The table keeps its size.      |
| The right edge of the table          | Make the whole table wider or narrower.                                |
| A border between two rows            | Make the row above it taller or shorter.                               |
| The round handle at the table corner | Resize the whole table. All columns and rows change by the same share. |

Move the mouse onto a border and a blue line shows up. The round corner handle shows up when the mouse is over the table.

- While you drag, only a blue line or a dashed outline moves. The table changes once, when you let go, and each drag is one undo step.
- A column can't get narrower than 40px (`minColumnWidth`), and you can't drag a table wider than the editor. When you hit that limit, the line turns red.
- A new table already fills the editor, so make it narrower first if you want room to drag it wider again.
- A row height works like a minimum: if you type more than fits, the row still grows. Drag a row border all the way up to give it its automatic height back.
- On a centered table, both outer edges can be dragged and the table stays centered. On a right-aligned table, the handle is at the bottom-left corner.
- Resizing works in a zoomed editor too, like one inside `transform: scale(0.8)`.

To turn resizing off, set `resizable: false`.

### Responsive widths

By default, a resized table is saved as a share of the editor's width. A table that's two thirds of the editor stays two thirds of it on any screen, also in the saved HTML.

If you need exact pixel widths, set `responsiveWidths: false`. Dragging works the same, only what's saved is different.

- A new table is full width either way, until you resize it.
- The option only decides what a resize saves. A table saved in percent shows in percent in every editor, and a px table stays px.
- **Fit table to width** on a percent table makes it exactly 100%.

### Equal sizes and fitting

Use these after resizing:

| Item                       | Where   | What it does                                                                             |
| -------------------------- | ------- | ---------------------------------------------------------------------------------------- |
| **Equal column widths**    | Columns | Every column gets the same width. The table keeps its width.                             |
| **Fit columns to content** | Columns | Each column gets as wide as its longest line, like Word's AutoFit. The table still fits. |
| **Equal row heights**      | Rows    | Every row gets the same height, tall enough for the tallest content.                     |
| **Fit table to width**     | More    | The table gets exactly as wide as the editor. The columns keep their proportions.        |

They're grayed out when there's nothing to do, like on a new table, which already has equal columns and fills the editor.

## Writing above or below a table

If a table is the first or last thing in the document, there's no line next to it to click into. Use **Insert paragraph above table** or **Insert paragraph below table** (under More). It adds an empty line and puts the cursor there.

## Keyboard

| Key                       | What it does in a table                                                               |
| ------------------------- | ------------------------------------------------------------------------------------- |
| `Tab`                     | Goes to the next cell and selects its text. In the last cell, adds a new row.         |
| `Shift + Tab`             | Goes to the previous cell.                                                            |
| `↑` `↓`                   | Goes to the cell above or below, after moving through the lines of the current cell.  |
| `Enter`                   | Starts a new line in the same cell.                                                   |
| `Backspace` / `Delete`    | Never joins two cells. With several cells selected, empties them and keeps the table. |
| Typing over several cells | Empties the selected cells and puts the text in the first one.                        |
| `Alt + F10`               | Jumps to the action bar. See [With the keyboard](#with-the-keyboard).                 |
| `Escape`                  | Hides the action bar.                                                                 |

From the first or last row, `↑` and `↓` leave the table. Typing `1. ` or `- ` in a cell stays as text, since lists can't go in a cell.

## Copy and paste

| You paste...                                                | You get                                                                       |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------- |
| A table from Word, Google Docs, Excel, Sheets or a web page | A real table, with merged cells, colors, header row and widths.               |
| A Markdown table                                            | A real table. See [Markdown tables](#markdown-tables).                        |
| Text with tabs, into a cell                                 | The text split into cells, like in a spreadsheet.                             |
| A table, into a cell                                        | The cells filled from the cursor. See [below](#pasting-a-table-into-a-table). |
| Normal text, into a cell                                    | The text in that cell, each line as a line in the cell.                       |

### Copying cells

Select a few cells and press Ctrl+C. You get exactly the highlighted block. Cut works the same way and leaves the cells empty.

You can paste it into Excel or Google Sheets, where every cell goes into its own cell, or into another editor, where you get a table.

**Copy table** (under More) copies the whole table that way. Copying a few words from inside one cell copies just the text.

### Pasting text with tabs

Text with tabs between the cells, from a spreadsheet, a CSV-like file or a plain-text app, fills the cells to the right of and below the cursor. Rows and columns are added if needed.

- Quoted cells are read the way spreadsheets write them, so a cell can have tabs and line breaks in it.
- It only counts as cells if every line has the same number of them. Otherwise, like code indented with tabs, it's pasted as normal text.
- Outside a table, text with tabs is pasted as normal text.

### Markdown tables

Paste a Markdown table, from a README, a chat with an AI or a `.md` file, and it becomes a real table:

```md
| Name      | Price | Note |
| :-------- | ----: | :--: |
| Green tea |  3.50 | hot  |
```

- The first row becomes the header row. If it's empty, the table has no header.
- The colons in the second line set each column's text alignment.
- `**bold**`, `*italic*`, `~~strikethrough~~`, `` `code` ``, links, images and `<br>` line breaks become real formatting.
- Text around the table stays text, so you can paste a whole section. Tables inside ``` code blocks are left alone.

**Copy as Markdown** (under More) does the opposite: it copies the table as Markdown, with the columns lined up. Markdown has no merged cells or colors, so those are left out.

### Pasting a table into a table

With the cursor in a cell, a pasted table overwrites the cells from the cursor to the right and down. With several cells selected, it starts at the top-left one. That's how you move a block of cells: copy, click where it should go, paste.

- If it doesn't fit, rows and columns are added, up to `maxRows` and `maxColumns`.
- The text, formatting, cell colors and vertical alignment are pasted. The table keeps its own header, borders, widths and merged cells.
- It's one undo step.

## Images in cells

Images can go in cells like any other content. [`resize-quill-image`](https://www.npmjs.com/package/resize-quill-image) and [`quill-image-alt`](https://www.npmjs.com/package/quill-image-alt) work inside cells too, so you can resize images and add alt text. Register all three:

```js
Quill.register('modules/tableKit', TableKit)
Quill.register('modules/imageResize', ImageResize)
Quill.register('modules/altText', AltText)

const quill = new Quill('#editor', {
  theme: 'snow',
  modules: { toolbar: [['image', 'table']], tableKit: true, imageResize: true, altText: true },
})
```

An image is never wider than its cell. If you drag it past the cell's edge, it stops getting wider but keeps getting taller. Make the column wider first.

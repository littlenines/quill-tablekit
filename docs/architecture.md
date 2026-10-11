# How it works

This is for working on the module itself, or if you're curious why things are done the way they are.

## Running it locally

```bash
pnpm install
pnpm test        # vitest with jsdom, using a real Quill
pnpm typecheck
pnpm lint        # ESLint, including the blank-line rules
pnpm format      # Prettier, 120 characters per line
pnpm build       # ES, CJS and IIFE builds plus one .d.ts in /dist
```

The demo uses the files in `src` directly, so you can run `pnpm dev` in `demo/` and see your changes without building. Its Vite config also has `dedupe: ['quill']`. Without that, the demo and `src` would each load their own copy of Quill, and the tables wouldn't be registered on the one the editor uses.

## Where things are

```
src/
├── index.ts              what the package exports
├── TableKit.ts           the Quill module: the public methods, and it sets everything else up
├── blots/
│   ├── TableCellLine.ts  a line of text in a cell (the only blot with data)
│   ├── TableCell.ts      <td>, with its background and vertical alignment
│   ├── TableRow.ts       <tr>
│   ├── TableBody.ts      <tbody>
│   ├── TableContainer.ts <table>: column widths, header row, alignment, borders, stripes, caption
│   ├── grouping.ts       how the containers group lines together
│   ├── html.ts           getSemanticHTML output for tables
│   └── index.ts          connects the blots and registers them
├── config/
│   ├── constants.ts      format, blot and class names
│   └── options.ts        options, labels, defaults
├── editing/
│   ├── context.ts        reading the table at the cursor into a TableContext
│   ├── edits.ts          the table changes (insert row, merge...) as small functions
│   ├── commands.ts       applying a change to the editor, inserting tables, Tab moves, selecting rows
│   ├── properties.ts     reading and changing cell and table properties
│   ├── selection.ts      finding the table at the cursor, deleting without breaking tables
│   ├── keyboard.ts       Tab, Up, Down, Backspace, Delete, Enter
│   ├── verticalNavigation.ts Up and Down between cells
│   ├── widthUnits.ts     turning percent widths into px while a table is edited, and back
│   ├── tabSeparated.ts   reading pasted text with tabs as rows and cells
│   ├── inputGuards.ts    copy, cut, paste, and typing over several cells
│   ├── cellClipboard.ts  the clipboard content for a block of cells, and Copy table
│   └── clipboard.ts      turning pasted <td> into table lines
├── model/
│   ├── TableModel.ts     a table as a grid of cells: reading and writing its lines, finding cells
│   ├── cell.ts           a single cell, and empty or copied cells
│   ├── rowsAndColumns.ts inserting and deleting rows and columns
│   ├── arrange.ts        moving and duplicating rows and columns
│   ├── merging.ts        merging and splitting cells
│   ├── cellChanges.ts    cell style, text alignment, clearing text
│   ├── paste.ts          pasting one table over the cells of another
│   ├── widths.ts         equal column widths and fitting the table to a width
│   ├── grid.ts           placing cells with spans on a grid
│   ├── layout.ts         column width math: scaling, equal widths
│   ├── properties.ts     property types, and checking colors and alignments
│   └── cellValue.ts      the tablekit-cell value: checking it, reading and writing it on elements
├── styles/
│   ├── css.ts            the CSS
│   └── injectStyles.ts   adds it to the page once
├── ui/
│   ├── TableControls.ts  the picker, the menu and the panel, and what opens them
│   ├── ActionBar.ts      the bar with buttons next to the table
│   ├── icons.ts          the icons on the action bar
│   ├── TablePicker.ts    the size picker
│   ├── TableMenu.ts      the table menu
│   ├── tableMenuItems.ts which items the menu shows, and which are disabled
│   ├── PropertiesPanel.ts the panel: rows of choices, toggles, text and color buttons
│   ├── ColorField.ts     a color button that opens the colors and the custom color row under it
│   ├── propertyFields.ts which fields the cell and table panels show
│   ├── Popover.ts        the floating box the picker, menu and panel use
│   ├── toolbarButton.ts  hooking up the table button in the toolbar
│   ├── contextMenu.ts    opening the menu on right-click
│   ├── CellSelection.ts  the blue highlight over selected cells
│   ├── ColumnResizer.ts  the line you drag to resize a column
│   ├── RowResizer.ts     the line you drag to resize a row
│   ├── TableResizer.ts   the round corner handle you drag to resize the whole table
│   ├── dragging.ts       following the mouse until it's released
│   ├── fitting.ts        measuring the content's widths, and an equal row height
│   ├── domGrid.ts        reading the table on screen as a grid, measuring columns
│   └── dom.ts            small createElement helper
└── utils/
    ├── quill.ts          Delta, Parchment and Module from Quill (see "The CDN build")
    ├── style.ts          setting an inline style only when it changes
    ├── editorWidth.ts    how wide the editor's content is
    └── support.ts        checking the Quill version
```

## How a table is stored

Only the lines hold data. Each line in a table is a `TableCellLine` (a `<p>`), and its `tablekit-cell` value says which table, row and cell it belongs to. That value is written on the `<p>` as data attributes.

The `<td>`, `<tr>`, `<tbody>` and `<table>` around the lines aren't stored anywhere. Parchment builds them:

- Each blot has a `requiredContainer`, so a line on its own gets wrapped in a cell, the cell in a row, and so on up to a table.
- Two containers next to each other merge when the lines on both sides of the edge have the same id (same cell, same row, same table). That's `checkMerge`.
- A container splits where two lines next to each other have different ids. That's in `optimize`, through `splitWhereGroupIdChanges` in `grouping.ts`.

So a list of lines is all it takes to build any table. The `<td>` copies `rowspan`, `colspan`, its background and vertical alignment from its first line. The `<table>` copies the header row, alignment and border color from its first line too. The header row is just a `data-header` attribute on the table, and CSS styles its first row. The header column can't use `:first-child`, because a cell merged down from the row above pushes a row's first `<td>` into the second column. So `TableContainer` marks the cells that really are in the first column with `data-first-column`, using the same grid as the rest of the code.

Inline styles are only set when they actually change (`utils/style.ts`). The browser rewrites colors, so `#fff2cc` reads back as `rgb(255, 242, 204)`. If we compared those directly, every check would look like a change, and every change makes Quill run `optimize` again.

A few things that look odd:

- `TableCellLine.format()` ignores headers, lists, code blocks and quotes. Those formats replace the line with a different blot, and that would pull it out of the table.
- Column widths go into a `<colgroup>`, but that `<colgroup>` sits in Parchment's "UI node" spot (`attachUI`). Parchment skips that spot when it reads the document, so the colgroup never ends up in the Delta. The widths themselves are stored on the lines.
- While you drag a column, a row or the table corner, the table itself doesn't change. Only a guide moves with the mouse: a line for a column or row, a dashed outline for the table. That's cheap, so the drag stays smooth even on big tables. The new sizes are saved once when you let go of the mouse, so a drag is also one undo step.
- The guide is moved at most once per frame (`ui/dragging.ts`), and the resizers only build the table grid when the mouse is right on a cell border.
- `getSemanticHTML` would normally use Quill's own HTML function, but Quill doesn't export it. `blots/html.ts` does the same thing for tables, minus the editor's classes and data attributes. If the selection is inside one cell, it returns just the paragraphs, so copying a word doesn't paste a one-cell table somewhere else. A table without resized columns gets `width: 100%`, same as in the editor.

## How editing works

Changes like inserting a row or merging cells don't touch the page directly. They go like this:

1. Get the table's lines with `quill.getContents(tableStart, tableLength)` and turn them into a `TableModel`. That's a grid, and a merged cell just takes up several spots in it. This is `getTableContext` in `editing/context.ts`.
2. Change the grid: add a row, merge, split, whatever. The changes themselves are functions in `model/` that take the `TableModel`, like `insertRow(model, rowIndex)` in `rowsAndColumns.ts` or `mergeCells(model, area)` in `merging.ts`. `editing/edits.ts` wraps each one in a small function that runs it on the selection and returns the cell the cursor should go to.
3. Turn the grid back into lines with `toDelta()`, compare that with the old lines, and apply the difference with `updateContents`. That's `commitTable` in `editing/commands.ts`.

If the cursor ends up in the same cell it started in, it keeps its spot in the text. Otherwise it goes to the start of the new cell.

So adding a new table action means writing the change in `model/`, one function in `edits.ts` and a one-line method in `TableKit.ts` that runs it. The `TableModel` class itself only holds the table and knows how to read and write it, so it doesn't grow with every new action.

Property changes (`editing/properties.ts`) go through the same three steps, but they don't move the cursor. They only change attributes, so the document doesn't get longer or shorter and the selection can stay where it was. That's why the panel can stay open while you click a few things.

That makes every change a normal Delta. History is cut off before and after, so each change is one undo step. It also means the editing logic is tested without any DOM.

Some rules inside the model:

- When the lines are read, cells are placed the way a browser places them in an HTML table. If spans overlap, they get cut short instead of breaking the grid. Missing cells at the end of short rows are filled with empty ones. This matters for tables pasted from other places, which aren't always clean.
- After a change, `normalize()` removes rows and columns where no cell starts. Those can't be stored as lines (a row with no cell starting in it has no lines), so they'd disappear the next time the table is read anyway, and leave the spans wrong.
- A new row extends a merged cell that crosses it, instead of cutting it in two.
- A new column copies its neighbour's width, then all columns shrink a bit so the table stays the same width.
- Moving a row first grows the selected rows into a block that no merged cell crosses (`wholeRows` in `model/arrange.ts`). The neighbour is grown the same way, and then the two blocks swap places. Since no merged cell crosses either block, the grid is still valid after the swap. Columns work the same way.
- Duplicating copies a block like that. A merged cell is copied once and that copy fills all its spots, so it stays merged.

The screen side (`ui/domGrid.ts`) uses the same placing function on the real `<td>` elements. That's how the highlight and the resize line agree with the model on where each cell is.

## Keyboard, paste and deleting

Quill's normal behavior breaks tables in a few places:

- Backspace at the start of a cell joins it with the cell before.
- Delete at the end of a cell joins the next cell into it.
- Backspace on the line after a table pulls that line into the last cell. Delete on the line before a table does the same with the first cell.
- Deleting a selection that covers several cells joins all of them.
- Typing `1. ` turns the line into a list.

`editing/keyboard.ts` adds key bindings for these. Quill runs bindings in the order they were added, and its defaults are added first, so ours get moved to the front of the list.

Deleting a selection that touches a table is done by `deleteSelection` in `editing/selection.ts`:

- Text inside the selection is removed.
- Line breaks of tables that are only partly selected stay, so the table keeps its cells.
- A table that's completely inside the selection is removed.
- A line outside a table is never joined onto the first line of a table that stays.

Paste, cut and typing over a selection don't go through key bindings. `editing/inputGuards.ts` listens for them on the editor container in the capture phase, so it runs before Quill's own handlers. When you paste into a cell, every pasted line becomes a line of that cell, and the last pasted line joins the line you were on. When you paste a table in the middle of a line, the line is split first, so the text before the cursor doesn't end up in the first cell.

Pasted text from the Windows clipboard uses `\r\n`. Quill turns a lone `\r` into a line break without any attributes, which would push the line out of the table, so `\r\n` is changed to `\n` first.

### Up and Down

The browser's own Up and Down in a table follow the screen, not the grid, so with merged cells they can land in odd places. `editing/verticalNavigation.ts` only steps in when the cursor is on the first visual line of its cell (for Up) or the last one (for Down). It checks that by comparing `quill.getBounds()` of the cursor with the start or end of the cell, so lines that wrap count too. Everywhere else the browser moves the cursor inside the cell as usual.

When it steps in, it finds the cell in the next row under the cursor's x position, then asks the browser for the text position at that x on the cell's first or last line (`caretPositionFromPoint`, or `caretRangeFromPoint` in older Chrome and Safari). If that fails, the cursor goes to the start or end of the cell.

Tab, Shift+Tab, Up and Down don't build a `TableModel`, because they only move the cursor. Tab follows the `<td>` elements in page order: a merged cell is a `<td>` in the row where it starts, so that's the same order as the model's. Up and Down read the grid from the page with `tableGrid`, which uses the same placing function as the model. Reading the whole table on every key press took about 30 ms on a 100 × 30 table. Tab in the last cell still goes through the model, because adding a row changes the table.

## Pasted stripes

A pasted table doesn't say it's striped, it just has colored cells. `findStripes` in `editing/clipboard.ts` looks for the pattern instead: under the header row, every other row has mostly one background, and the rows between don't have it at all. Then the table gets `striped` and that `stripeColor`, and those cells don't keep the color as their own background. One colored row isn't enough to tell stripes from a colored total row, so that needs two, unless it's the default stripe color.

## Percent widths

All the width math (resizing, inserting columns, equal widths) works in px. A table saved in percent is turned into px when it's read for an edit (`useLayoutPixels` in `editing/widthUnits.ts`, called from `readTable`), using the editor's content width at that moment. When it's written back, `commitTable` turns the widths into percent again (`widthsToSave`). The same width is used both ways, so a table that didn't change writes the same numbers and the diff stays empty.

`responsiveWidths` only matters when widths are set from outside the model: a drag or `setColumnWidths`. Those pass the option's unit to `setTableLayout`. Every other change keeps the unit the table already has.

A drag starts from the saved widths, not from measuring the screen (`startColumnWidths` in `ui/domGrid.ts`). With `border-collapse`, the measured columns add up to about a pixel less than the table, so measuring before every drag would make the table a little narrower each time. Only a table without saved widths is measured.

The conversion uses the real content width. The resize limit uses that width minus 2px for the borders, and mixing the two up would make a percent table a little wider on every resize.

## Fitting columns to content

In the editor the columns have fixed widths, so long text just wraps and there's nothing to measure. `contentColumnWidths` in `ui/fitting.ts` puts a copy of the table in a hidden box inside `.ql-container` (outside the editor, so Quill doesn't see it), with automatic table layout and no widths. The browser then gives each column the width its content wants, and those widths are measured and saved the normal way. The copy is removed right away.

## Captions

A real `<caption>` can't go in the editor: Quill turns every child of a container it doesn't know into a blot, and the table's one UI slot is already the `<colgroup>`. So the caption is a table field like the border color, written on the table as `data-caption`, and the CSS shows it with `table::before { content: attr(data-caption); display: table-caption }`. That's also why you edit it in the panel and can't click into it. `getSemanticHTML()` writes a real `<caption>`, and pasting reads it back from `tableElement.caption`.

## Zoomed editors

When a parent element has `transform: scale()`, `getBoundingClientRect()` gives sizes on screen, but `style.left`, `style.width` and the saved widths are in the element's own pixels. `scaleOf()` in `ui/domGrid.ts` divides the screen width of an element by its `offsetWidth` to get the zoom. The resizers divide mouse distances and measured sizes by it, and `toContainerPosition` uses it to place the handles, the highlight and the bar. Without a transform it's just 1.

## The toolbar button

Quill only hooks up a toolbar button itself if its name is a registered format or it already has a handler. The full Quill build registers its own `table` format, so there Quill handles the click and calls our handler. In `quill/core` it doesn't, so the module adds the click listener itself. `ui/toolbarButton.ts` checks which case it is so the click isn't handled twice.

## The CDN build

The IIFE build for CDNs uses the global `Quill`. That global doesn't have `Delta`, `Parchment` or `Module` on it, so `import { Delta } from 'quill'` would be `undefined` there. That's why `utils/quill.ts` gets them with `Quill.import()`. It works in every build, and Quill never gets bundled in a second time.

When the module is only registered, not enabled (like for a read-only viewer), `register()` adds the CSS too, so the tables still look right.

## Tests

- `tests/model/`: the model, the grid and the cell value, no editor needed. One test file per model file, with shared helpers in `tests/model/modelHelpers.ts` (`tableWithTexts` builds a model from a grid of texts, `textsOf` reads it back).
- `tests/ui/`: the resize math.
- `tests/editor/`: the module in a real Quill under jsdom. Inserting, toolbar and panel, the action bar, keyboard, merging and rows/columns, moving and duplicating, selecting rows and adding paragraphs, properties and table style, clipboard, saved content, cleanup.

Shared helpers are in `tests/helpers.ts`. jsdom doesn't do layout, so things like dragging a column, where the highlight sits, Up and Down through wrapped lines, and zoom are checked by hand in the demo in a real browser.

A couple of helpers that aren't obvious from their names:

- `shape(quill)` gives every cell as `colspan * 10 + rowspan`, row by row. So `[[21], [11, 11]]` is a cell spanning two columns on top of two normal cells.
- `setupWithTable(rowCount, columnCount)` creates an editor that already has a table, with the cursor in the first cell.

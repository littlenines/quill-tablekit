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
│   ├── TableCell.ts      <td>
│   ├── TableRow.ts       <tr>
│   ├── TableBody.ts      <tbody>
│   ├── TableContainer.ts <table> and its column widths
│   ├── grouping.ts       how the containers group lines together
│   ├── html.ts           getSemanticHTML output for tables
│   └── index.ts          connects the blots and registers them
├── config/
│   ├── constants.ts      format, blot and class names
│   └── options.ts        options, labels, defaults
├── editing/
│   ├── context.ts        reading the table at the cursor into a TableContext
│   ├── edits.ts          the table changes (insert row, merge...) as small functions
│   ├── commands.ts       applying a change to the editor, inserting tables, Tab moves
│   ├── selection.ts      finding the table at the cursor, deleting without breaking tables
│   ├── keyboard.ts       Tab, Backspace, Delete, Enter
│   ├── inputGuards.ts    paste, cut, and typing over several cells
│   └── clipboard.ts      turning pasted <td> into table lines
├── model/
│   ├── TableModel.ts     a table as a grid of cells, where all the editing happens
│   ├── grid.ts           placing cells with spans on a grid
│   └── cellValue.ts      the tablekit-cell value: checking it, reading and writing it on elements
├── styles/
│   ├── css.ts            the CSS
│   └── injectStyles.ts   adds it to the page once
├── ui/
│   ├── TablePicker.ts    the size picker
│   ├── TableMenu.ts      the table menu
│   ├── tableMenuItems.ts which items the menu shows, and which are disabled
│   ├── Popover.ts        the floating box both of them use
│   ├── toolbarButton.ts  hooking up the table button in the toolbar
│   ├── contextMenu.ts    opening the menu on right-click
│   ├── CellSelection.ts  the blue highlight over selected cells
│   ├── ColumnResizer.ts  the line you drag to resize
│   ├── domGrid.ts        reading the table on screen as a grid, measuring columns
│   └── dom.ts            small createElement helper
└── utils/
    ├── quill.ts          Delta, Parchment and Module from Quill (see "The CDN build")
    └── support.ts        checking the Quill version
```

## How a table is stored

Only the lines hold data. Each line in a table is a `TableCellLine` (a `<p>`), and its `tablekit-cell` value says which table, row and cell it belongs to. That value is written on the `<p>` as data attributes.

The `<td>`, `<tr>`, `<tbody>` and `<table>` around the lines aren't stored anywhere. Parchment builds them:

- Each blot has a `requiredContainer`, so a line on its own gets wrapped in a cell, the cell in a row, and so on up to a table.
- Two containers next to each other merge when the lines on both sides of the edge have the same id (same cell, same row, same table). That's `checkMerge`.
- A container splits where two lines next to each other have different ids. That's in `optimize`, through `splitWhereGroupIdChanges` in `grouping.ts`.

So a list of lines is all it takes to build any table. The `<td>` copies `rowspan` and `colspan` from its first line.

A few things that look odd:

- `TableCellLine.format()` ignores headers, lists, code blocks and quotes. Those formats replace the line with a different blot, and that would pull it out of the table.
- Column widths go into a `<colgroup>`, but that `<colgroup>` sits in Parchment's "UI node" spot (`attachUI`). Parchment skips that spot when it reads the document, so the colgroup never ends up in the Delta. The widths themselves are stored on the lines.
- While you drag a column, `TableContainer.preview()` shows the new widths without changing the document. They're saved once when you let go of the mouse. That way a drag is one undo step, not hundreds.
- `getSemanticHTML` would normally use Quill's own HTML function, but Quill doesn't export it. `blots/html.ts` does the same thing for tables, minus the editor's classes and data attributes. If the selection is inside one cell, it returns just the paragraphs, so copying a word doesn't paste a one-cell table somewhere else. A table without resized columns gets `width: 100%`, same as in the editor.

## How editing works

Changes like inserting a row or merging cells don't touch the page directly. They go like this:

1. Get the table's lines with `quill.getContents(tableStart, tableLength)` and turn them into a `TableModel`. That's a grid, and a merged cell just takes up several spots in it. This is `getTableContext` in `editing/context.ts`.
2. Change the grid: add a row, merge, split, whatever. Each of these is a small function in `editing/edits.ts`. It changes the model and returns the cell the cursor should go to.
3. Turn the grid back into lines with `toDelta()`, compare that with the old lines, and apply the difference with `updateContents`. That's `commitTable` in `editing/commands.ts`.

If the cursor ends up in the same cell it started in, it keeps its spot in the text. Otherwise it goes to the start of the new cell.

So adding a new table action means writing one function in `edits.ts` and a one-line method in `TableKit.ts` that runs it.

That makes every change a normal Delta. History is cut off before and after, so each change is one undo step. It also means the editing logic is tested without any DOM.

Some rules inside the model:

- When the lines are read, cells are placed the way a browser places them in an HTML table. If spans overlap, they get cut short instead of breaking the grid. Missing cells at the end of short rows are filled with empty ones. This matters for tables pasted from other places, which aren't always clean.
- After a change, `normalize()` removes rows and columns where no cell starts. Those can't be stored as lines (a row with no cell starting in it has no lines), so they'd disappear the next time the table is read anyway, and leave the spans wrong.
- A new row extends a merged cell that crosses it, instead of cutting it in two.
- A new column copies its neighbour's width, then all columns shrink a bit so the table stays the same width.

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

## The toolbar button

Quill only hooks up a toolbar button itself if its name is a registered format or it already has a handler. The full Quill build registers its own `table` format, so there Quill handles the click and calls our handler. In `quill/core` it doesn't, so the module adds the click listener itself. `ui/toolbarButton.ts` checks which case it is so the click isn't handled twice.

## The CDN build

The IIFE build for CDNs uses the global `Quill`. That global doesn't have `Delta`, `Parchment` or `Module` on it, so `import { Delta } from 'quill'` would be `undefined` there. That's why `utils/quill.ts` gets them with `Quill.import()`. It works in every build, and Quill never gets bundled in a second time.

When the module is only registered, not enabled (like for a read-only viewer), `register()` adds the CSS too, so the tables still look right.

## Tests

- `tests/model/`: the model, the grid and the cell value, no editor needed.
- `tests/ui/`: the column resize math.
- `tests/editor/`: the module in a real Quill under jsdom. Inserting, toolbar, keyboard, merging and rows/columns, clipboard, saved content, cleanup.

Shared helpers are in `tests/helpers.ts`. jsdom doesn't do layout, so things like dragging a column or where the highlight sits are checked by hand in the demo in a real browser.

A couple of helpers that aren't obvious from their names:

- `shape(quill)` gives every cell as `colspan * 10 + rowspan`, row by row. So `[[21], [11, 11]]` is a cell spanning two columns on top of two normal cells.
- `setupWithTable(rowCount, columnCount)` creates an editor that already has a table, with the cursor in the first cell.

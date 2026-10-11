import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  cellIndex,
  cellLines,
  cellTexts,
  copyOrCut,
  fillCells,
  paste,
  setup,
  setupWithTable,
  shape,
  tables,
} from '../helpers'

const selectCells = (quill: Parameters<typeof cellIndex>[0], firstCell: number, lastCell: number) => {
  const selectionStart = cellIndex(quill, firstCell)

  quill.setSelection(selectionStart, cellIndex(quill, lastCell) + 1 - selectionStart)
}

describe('copying cells', () => {
  it('copies the highlighted block of cells, not everything between them', () => {
    const { quill } = setupWithTable(3, 3)

    fillCells(quill, ['a1', 'b1', 'c1', 'a2', 'b2', 'c2', 'a3', 'b3', 'c3'])
    selectCells(quill, 1, 4)

    const { clipboardEvent, clipboardContent } = copyOrCut(quill, 'copy')

    expect(clipboardEvent.defaultPrevented).toBe(true)
    expect(clipboardContent['text/plain']).toBe('b1\nb2')
    expect(clipboardContent['text/html']).toMatch(/^<table [^>]*><tbody><tr><td[^>]*><p>b1<\/p><\/td><\/tr><tr><td/)
    expect(clipboardContent['text/html']).not.toContain('a2')
    expect(cellTexts(quill)).toEqual(['a1', 'b1', 'c1', 'a2', 'b2', 'c2', 'a3', 'b3', 'c3'])
  })

  it('keeps merged cells, and leaves an empty spot in the text for the columns they cover', () => {
    const { quill, tableKit } = setupWithTable(2, 3)

    fillCells(quill, ['wide', '', 'c1', 'a2', 'b2', 'c2'])
    selectCells(quill, 0, 1)
    tableKit.mergeCells()
    selectCells(quill, 0, 4)

    const { clipboardContent } = copyOrCut(quill, 'copy')

    expect(clipboardContent['text/plain']).toBe('wide\t\tc1\na2\tb2\tc2')
    expect(clipboardContent['text/html']).toContain('colspan="2"')
  })

  it('copies only the widths of the copied columns', () => {
    const { quill, tableKit } = setupWithTable(2, 3, { responsiveWidths: false })

    tableKit.setColumnWidths(tables(quill)[0], [100, 150, 200])
    selectCells(quill, 1, 5)

    const { clipboardContent } = copyOrCut(quill, 'copy')

    expect(clipboardContent['text/html']).toContain('<col style="width: 150px;"><col style="width: 200px;">')
    expect(clipboardContent['text/html']).toContain('width: 350px;')
  })

  it('leaves copying inside one cell to Quill', () => {
    const { quill } = setupWithTable(1, 2)

    fillCells(quill, ['hello'])
    quill.setSelection(1, 3)

    const { clipboardContent } = copyOrCut(quill, 'copy')

    expect(clipboardContent['text/plain']).toBe('ell')
    expect(clipboardContent['text/html']).not.toContain('<table')
  })
})

describe('cutting and typing over cells', () => {
  it('cuts the highlighted cells and keeps the table', () => {
    const { quill } = setupWithTable(2, 2)

    fillCells(quill, ['a1', 'b1', 'a2', 'b2'])
    selectCells(quill, 1, 3)

    const { clipboardContent } = copyOrCut(quill, 'cut')

    expect(clipboardContent['text/plain']).toBe('b1\nb2')
    expect(cellTexts(quill)).toEqual(['a1', '', 'a2', ''])
    expect(shape(quill)).toEqual([
      [11, 11],
      [11, 11],
    ])
  })

  it('clears the cells and types into the first one', () => {
    const { quill } = setupWithTable(2, 2)

    fillCells(quill, ['a1', 'b1', 'a2', 'b2'])
    selectCells(quill, 0, 2)

    quill.root.dispatchEvent(
      new InputEvent('beforeinput', { inputType: 'insertText', data: 'x', bubbles: true, cancelable: true }),
    )

    expect(cellTexts(quill)).toEqual(['x', 'b1', '', 'b2'])
  })
})

describe('pasting a table into cells', () => {
  it('pastes copied cells over the cells at the cursor', () => {
    const { quill } = setupWithTable(3, 3)

    fillCells(quill, ['a1', 'b1', 'c1', 'a2', 'b2', 'c2'])
    selectCells(quill, 0, 4)

    const { clipboardContent } = copyOrCut(quill, 'copy')

    quill.setSelection(cellIndex(quill, 4), 0)
    paste(quill, clipboardContent)

    expect(cellTexts(quill)).toEqual(['a1', 'b1', 'c1', 'a2', 'a1', 'b1', '', 'a2', 'b2'])
    expect(quill.getSelection()?.index).toBe(cellIndex(quill, 4))
  })

  it('adds rows and columns when the pasted table is bigger, up to maxRows and maxColumns', () => {
    const { quill } = setupWithTable(1, 1, { maxRows: 2, maxColumns: 5 })

    quill.setSelection(0, 0)
    paste(quill, {
      'text/html':
        '<table><tr><td>1</td><td>2</td></tr><tr><td>3</td><td>4</td></tr><tr><td>5</td><td>6</td></tr></table>',
    })

    expect(cellTexts(quill)).toEqual(['1', '2', '3', '4'])
  })

  it('is one undo step', () => {
    const { quill } = setupWithTable(1, 1)
    const before = quill.getContents()

    quill.history.cutoff()
    quill.setSelection(0, 0)
    paste(quill, { 'text/html': '<table><tr><td>1</td><td>2</td></tr></table>' })
    quill.history.undo()

    expect(quill.getContents()).toEqual(before)
  })

  it('pastes copied cells into another editor', () => {
    const source = setupWithTable(2, 2)

    fillCells(source.quill, ['a1', 'b1', 'a2', 'b2'])
    selectCells(source.quill, 1, 3)

    const { clipboardContent } = copyOrCut(source.quill, 'copy')
    const target = setupWithTable(2, 2)

    target.quill.setSelection(0, 0)
    paste(target.quill, clipboardContent)

    expect(cellTexts(target.quill)).toEqual(['b1', '', 'b2', ''])
  })
})

describe('copying what the table looks like', () => {
  const styledTable = () => {
    const editor = setupWithTable(2, 2)
    const { quill, tableKit } = editor

    fillCells(quill, ['Name', 'Amount', 'Ana', '10'])
    quill.setSelection(0, 0)
    tableKit.setColumnWidths(tables(quill)[0], [120, 80])
    tableKit.setTableProperties({ header: true, align: 'center', borderColor: '#e06666' })
    quill.setSelection(cellIndex(quill, 2), 0)
    tableKit.setCellProperties({ background: '#fff2cc', verticalAlign: 'middle', textAlign: 'center' })

    return editor
  }

  it('keeps every property when the copied table is pasted as a new table', () => {
    const { quill } = styledTable()

    quill.setSelection(0, quill.getLength())

    const { clipboardContent } = copyOrCut(quill, 'copy')
    const target = setup()

    paste(target.quill, clipboardContent)

    const pastedLines = cellLines(target.quill)

    expect(pastedLines.every((cellValue) => cellValue.header && cellValue.tableAlign === 'center')).toBe(true)
    expect(pastedLines.every((cellValue) => cellValue.borderColor === '#e06666')).toBe(true)
    expect(pastedLines.map((cellValue) => cellValue.background)).toEqual([undefined, undefined, '#fff2cc', undefined])
    expect(pastedLines[2]).toMatchObject({ verticalAlign: 'middle', widths: [120, 80] })
    expect(target.quill.getContents().ops.some(({ attributes }) => attributes?.bold || attributes?.background)).toBe(
      false,
    )

    const withoutIds = (lines: ReturnType<typeof cellLines>) =>
      lines.map(({ table: _table, row: _row, cell: _cell, ...properties }) => properties)

    expect(withoutIds(pastedLines)).toEqual(withoutIds(cellLines(quill)))
  })

  it('pastes cell colors and alignment into an existing table, and keeps that table’s own settings', () => {
    const { quill } = styledTable()

    selectCells(quill, 2, 3)

    const { clipboardContent } = copyOrCut(quill, 'copy')
    const target = setupWithTable(1, 2)

    target.quill.setSelection(0, 0)
    paste(target.quill, clipboardContent)

    const [pastedCell, otherCell] = cellLines(target.quill)

    expect(pastedCell).toMatchObject({ background: '#fff2cc', verticalAlign: 'middle' })
    expect(otherCell.background).toBeUndefined()
    expect(pastedCell.header).toBeUndefined()
    expect(target.quill.getContents().ops[1].attributes?.align).toBe('center')
  })
})

describe('copyTable', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('writes the whole table as HTML and text', async () => {
    const writtenItems: ClipboardItem[] = []

    vi.stubGlobal(
      'ClipboardItem',
      class {
        items: Record<string, Blob>

        constructor(items: Record<string, Blob>) {
          this.items = items
        }
      },
    )
    vi.stubGlobal('navigator', { clipboard: { write: async (items: ClipboardItem[]) => writtenItems.push(...items) } })

    const { quill, tableKit } = setupWithTable(2, 2)

    fillCells(quill, ['a1', 'b1', 'a2', 'b2'])
    quill.setSelection(0, 0)

    expect(await tableKit.copyTable()).toBe(true)

    const { items } = writtenItems[0] as unknown as { items: Record<string, Blob> }

    expect(await items['text/plain'].text()).toBe('a1\tb1\na2\tb2')
    expect(await items['text/html'].text()).toContain('<td style="border: 1px solid #000;"><p>b2</p></td>')
  })

  it('falls back to a copy event when the Clipboard API is missing', async () => {
    vi.stubGlobal('ClipboardItem', undefined)

    const { quill, tableKit } = setupWithTable(1, 2)
    const clipboardContent: Record<string, string> = {}

    document.execCommand = () => {
      const copyEvent = new Event('copy', { bubbles: true, cancelable: true }) as ClipboardEvent

      Object.defineProperty(copyEvent, 'clipboardData', {
        value: { setData: (mimeType: string, value: string) => (clipboardContent[mimeType] = value) },
      })
      quill.root.dispatchEvent(copyEvent)

      return copyEvent.defaultPrevented
    }

    fillCells(quill, ['left', 'right'])
    quill.setSelection(0, 0)

    expect(await tableKit.copyTable()).toBe(true)
    expect(clipboardContent['text/plain']).toBe('left\tright')
  })

  it('returns false outside a table', async () => {
    const { quill, tableKit } = setup()

    quill.setSelection(0, 0)

    expect(await tableKit.copyTable()).toBe(false)
  })
})

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cellIndex, cellTexts, fillCells, paste, setup, setupWithTable, tables } from '../helpers'

const MARKDOWN_TABLE = '| Name | Price |\n| --- | ---: |\n| **Tea** | 3 |\n| Coffee | 4 |'

describe('pasting Markdown', () => {
  it('turns a Markdown table into a table with a header row', () => {
    const { quill } = setup()

    quill.setSelection(0, 0)
    paste(quill, { 'text/plain': MARKDOWN_TABLE })

    expect(tables(quill)).toHaveLength(1)
    expect(tables(quill)[0].dataset.header).toBe('true')
    expect(cellTexts(quill)).toEqual(['Name', 'Price', 'Tea', '3', 'Coffee', '4'])
    expect(quill.root.querySelector('td strong')?.textContent).toBe('Tea')
    expect(quill.root.querySelectorAll('td .ql-align-right')).toHaveLength(3)
  })

  it('keeps the text around the table', () => {
    const { quill } = setup()

    quill.setSelection(0, 0)
    paste(quill, { 'text/plain': `Prices:\n\n${MARKDOWN_TABLE}\n\nThat's all.` })

    const paragraphs = [...quill.root.children].filter((element) => element.tagName === 'P')

    expect(paragraphs.map((paragraph) => paragraph.textContent)).toContain('Prices:')
    expect(quill.getText()).toContain("That's all.")
    expect(tables(quill)).toHaveLength(1)
  })

  it('uses the HTML when the clipboard has a real table', () => {
    const { quill } = setup()

    quill.setSelection(0, 0)
    paste(quill, { 'text/plain': MARKDOWN_TABLE, 'text/html': '<table><tr><td>from html</td></tr></table>' })

    expect(cellTexts(quill)).toEqual(['from html'])
  })

  it('fills the cells when only a table is pasted into a table', () => {
    const { quill } = setupWithTable(2, 2)

    quill.setSelection(cellIndex(quill, 0), 0)
    paste(quill, { 'text/plain': '| a | b |\n| - | - |\n| 1 | 2 |' })

    expect(tables(quill)).toHaveLength(1)
    expect(cellTexts(quill)).toEqual(['a', 'b', '1', '2'])
  })

  it('pastes Markdown with other text into a cell as plain text', () => {
    const { quill } = setupWithTable(1, 1)

    quill.setSelection(0, 0)
    paste(quill, { 'text/plain': 'Note\n| a |\n| - |' })

    expect(tables(quill)).toHaveLength(1)
    expect(quill.root.querySelector('td')?.textContent).toContain('| a |')
  })

  it('leaves text without a table as text', () => {
    const { quill } = setup()

    quill.setSelection(0, 0)
    paste(quill, { 'text/plain': 'a | b\n--- | --- | ---' })

    expect(tables(quill)).toHaveLength(0)
    expect(quill.getText()).toContain('a | b')
  })
})

describe('copying as Markdown', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the table at the cursor as Markdown', () => {
    const { quill, tableKit } = setupWithTable(2, 2)

    fillCells(quill, ['a', 'b|c', '1', '2'])
    quill.setSelection(0, 0)

    expect(tableKit.getTableMarkdown()).toBe(['| a   | b\\|c |', '| --- | ---- |', '| 1   | 2    |'].join('\n'))
  })

  it('writes only text to the clipboard', async () => {
    const writtenItems: { items: Record<string, Blob> }[] = []

    vi.stubGlobal(
      'ClipboardItem',
      class {
        items: Record<string, Blob>

        constructor(items: Record<string, Blob>) {
          this.items = items
        }
      },
    )
    vi.stubGlobal('navigator', {
      clipboard: { write: async (items: { items: Record<string, Blob> }[]) => writtenItems.push(...items) },
    })

    const { quill, tableKit } = setupWithTable(1, 2)

    fillCells(quill, ['x', 'y'])
    quill.setSelection(0, 0)

    expect(await tableKit.copyTableAsMarkdown()).toBe(true)
    expect(Object.keys(writtenItems[0].items)).toEqual(['text/plain'])
    expect(await writtenItems[0].items['text/plain'].text()).toBe('| x   | y   |\n| --- | --- |')
  })

  it('pastes back into the same table', () => {
    const { quill, tableKit } = setupWithTable(2, 2)

    fillCells(quill, ['Name', 'Note', 'Tea', 'a | b'])
    quill.setSelection(0, 0)

    const markdown = tableKit.getTableMarkdown() ?? ''
    const copy = setup()

    copy.quill.setSelection(0, 0)
    paste(copy.quill, { 'text/plain': markdown })

    expect(cellTexts(copy.quill)).toEqual(['Name', 'Note', 'Tea', 'a | b'])
  })

  it('returns null outside a table', () => {
    const { quill, tableKit } = setup()

    quill.setSelection(0, 0)

    expect(tableKit.getTableMarkdown()).toBeNull()
  })
})

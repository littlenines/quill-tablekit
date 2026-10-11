import { describe, expect, it } from 'vitest'
import { parseTabSeparated } from '../../src/editing/tabSeparated'
import { cellIndex, cellTexts, paste, setupWithTable, tables } from '../helpers'

describe('parseTabSeparated', () => {
  it('splits rows and cells', () => {
    expect(parseTabSeparated('a\tb\r\nc\td\r\n')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ])
  })

  it('reads quoted cells with line breaks, tabs and quotes in them', () => {
    expect(parseTabSeparated('"two\nlines"\t"a\tb"\n"say ""hi"""\tplain')).toEqual([
      ['two\nlines', 'a\tb'],
      ['say "hi"', 'plain'],
    ])
  })

  it('keeps empty cells', () => {
    expect(parseTabSeparated('a\t\tc')).toEqual([['a', '', 'c']])
  })

  it('leaves text alone when it does not look like cells', () => {
    expect(parseTabSeparated('no tabs here')).toBeNull()
    expect(parseTabSeparated('a\tb\nonly one')).toBeNull()
    expect(parseTabSeparated('\tindented\n\tcode')).toBeNull()
  })
})

describe('pasting tab-separated text', () => {
  it('fills the cells to the right and below the cursor, adding columns that are missing', () => {
    const { quill } = setupWithTable(2, 2)

    quill.setSelection(cellIndex(quill, 1), 0)
    paste(quill, { 'text/plain': 'Price\tTax\n10\t2\n' })

    expect(tables(quill)[0].rows[0].cells).toHaveLength(3)
    expect(cellTexts(quill)).toEqual(['', 'Price', 'Tax', '', '10', '2'])
  })

  it('is one undo step', () => {
    const { quill } = setupWithTable(1, 2)

    quill.history.cutoff()
    quill.setSelection(0, 0)
    paste(quill, { 'text/plain': 'a\tb' })
    quill.history.undo()

    expect(cellTexts(quill)).toEqual(['', ''])
  })

  it('keeps a line break inside a quoted cell as a line of that cell', () => {
    const { quill } = setupWithTable(1, 2)

    quill.setSelection(0, 0)
    paste(quill, { 'text/plain': '"first\nsecond"\tb' })

    expect(tables(quill)[0].rows[0].cells[0].querySelectorAll('p')).toHaveLength(2)
    expect(cellTexts(quill)).toEqual(['firstsecond', 'b'])
  })

  it('pastes text without tabs into the one cell, like before', () => {
    const { quill } = setupWithTable(1, 2)

    quill.setSelection(0, 0)
    paste(quill, { 'text/plain': 'just text' })

    expect(cellTexts(quill)).toEqual(['just text', ''])
  })
})

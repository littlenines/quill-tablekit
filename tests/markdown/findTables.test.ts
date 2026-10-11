import { describe, expect, it } from 'vitest'
import { findMarkdownTables, splitRow } from '../../src/markdown/findTables'

describe('splitRow', () => {
  it('splits cells with or without the outer pipes', () => {
    expect(splitRow('| a | b |')).toEqual(['a', 'b'])
    expect(splitRow('a | b')).toEqual(['a', 'b'])
    expect(splitRow('| a | |')).toEqual(['a', ''])
  })

  it('keeps escaped pipes inside a cell', () => {
    expect(splitRow(String.raw`| a \| b | c |`)).toEqual([String.raw`a \| b`, 'c'])
  })
})

describe('findMarkdownTables', () => {
  it('finds a table with its column alignment', () => {
    expect(findMarkdownTables('| Name | Price | Note |\n| :--- | ---: | :-: |\n| Tea | 3 | hot |')).toEqual([
      {
        kind: 'table',
        rows: [
          ['Name', 'Price', 'Note'],
          ['Tea', '3', 'hot'],
        ],
        aligns: ['left', 'right', 'center'],
      },
    ])
  })

  it('keeps the text around tables and ends a table at a blank line', () => {
    const blocks = findMarkdownTables('Intro\n\n| a |\n| - |\n| 1 |\n\nAfter')

    expect(blocks?.map(({ kind }) => kind)).toEqual(['text', 'table', 'text'])
    expect(blocks?.[2]).toEqual({ kind: 'text', lines: ['', 'After'] })
  })

  it('fills short rows and cuts long ones to the header width', () => {
    const [table] = findMarkdownTables('a | b\n--|--\n1 |\n1 | 2 | 3') ?? []

    expect(table).toMatchObject({
      rows: [
        ['a', 'b'],
        ['1', ''],
        ['1', '2'],
      ],
    })
  })

  it('leaves text that is not a table alone', () => {
    expect(findMarkdownTables('just text | with a pipe')).toBeNull()
    expect(findMarkdownTables('a | b\n--- | --- | ---')).toBeNull()
    expect(findMarkdownTables('Title\n---')).toBeNull()
    expect(findMarkdownTables('```\n| a |\n| - |\n```')).toBeNull()
  })
})

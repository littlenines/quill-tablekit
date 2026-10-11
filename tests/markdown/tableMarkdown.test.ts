import { Delta } from 'quill'
import { describe, expect, it } from 'vitest'
import { tableMarkdown } from '../../src/markdown/tableMarkdown'
import { mergeCells } from '../../src/model/operations/merging'
import { area, tableWithTexts } from '../model/modelHelpers'

describe('tableMarkdown', () => {
  it('writes the first row as the header and lines up the columns', () => {
    const model = tableWithTexts([
      ['Name', 'Price'],
      ['Green tea', '3'],
    ])

    expect(tableMarkdown(model)).toBe(
      ['| Name      | Price |', '| --------- | ----- |', '| Green tea | 3     |'].join('\n'),
    )
  })

  it('marks a column aligned when all its cells are', () => {
    const model = tableWithTexts([
      ['a', 'b'],
      ['1', '2'],
    ])

    for (const row of model.grid) {
      const text = row[1].content.ops[0].insert as string

      row[1].content = new Delta().insert(text.trim()).insert('\n', { align: 'right' })
    }

    expect(tableMarkdown(model).split('\n')[1]).toBe('| --- | --: |')
  })

  it('puts the text of a merged cell in its first spot', () => {
    const model = tableWithTexts([
      ['wide', 'x'],
      ['1', '2'],
    ])

    mergeCells(model, area(0, 0, 1, 2))

    expect(tableMarkdown(model).split('\n')[0]).toBe('| wide<br>x |     |')
  })
})

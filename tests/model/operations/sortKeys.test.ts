import { describe, expect, it } from 'vitest'
import { sortRows, type SortOrder } from '../../../src/model/operations/sort'
import { tableWithTexts, textsOf } from '../modelHelpers'

const sorted = (texts: string[], order: SortOrder = 'ascending', language = 'en-US') => {
  const model = tableWithTexts(texts.map((text) => [text]))

  sortRows(model, 0, order, language)

  return textsOf(model).flat()
}

describe('sorting mixed values', () => {
  it('puts numbers first, then dates, then text, and empty cells last', () => {
    const texts = ['b', '10', '2024-01-05', '', '9', 'a', '1.3.2024.']

    expect(sorted(texts)).toEqual(['9', '10', '2024-01-05', '1.3.2024.', 'a', 'b', ''])
    expect(sorted(texts, 'descending')).toEqual(['b', 'a', '1.3.2024.', '2024-01-05', '10', '9', ''])
  })

  it('reads numbers the way the language writes them', () => {
    expect(sorted(['1.234,5', '999', '12,5'], 'ascending', 'de')).toEqual(['12,5', '999', '1.234,5'])
    expect(sorted(['1,000', '999', '1.5'])).toEqual(['1.5', '999', '1,000'])
  })

  it('keeps text that only looks like a number with the text', () => {
    expect(sorted(['1,5', '3', 'a'])).toEqual(['3', '1,5', 'a'])
  })
})

describe('sorting dates', () => {
  it('sorts dates with dots by day, month and year', () => {
    expect(sorted(['15.2.2024', '2.1.2023', '1. 3. 2024.'])).toEqual(['2.1.2023', '15.2.2024', '1. 3. 2024.'])
  })

  it('sorts dates with the time', () => {
    expect(sorted(['2024-01-05 14:30', '2024-01-05 09:15', '2024-01-04'])).toEqual([
      '2024-01-04',
      '2024-01-05 09:15',
      '2024-01-05 14:30',
    ])
  })

  it('finds out from the column whether slashed dates start with the day or the month', () => {
    expect(sorted(['03/01/2024', '12/31/2023', '01/15/2024'], 'ascending', 'sr')).toEqual([
      '12/31/2023',
      '01/15/2024',
      '03/01/2024',
    ])
    expect(sorted(['01/03/2024', '31/12/2023', '15/01/2024'])).toEqual(['31/12/2023', '15/01/2024', '01/03/2024'])
  })

  it('uses the language when slashed dates could be read both ways', () => {
    expect(sorted(['02/01/2024', '01/02/2024'], 'ascending', 'en-US')).toEqual(['01/02/2024', '02/01/2024'])
    expect(sorted(['02/01/2024', '01/02/2024'], 'ascending', 'sr')).toEqual(['02/01/2024', '01/02/2024'])
  })

  it('treats dates that do not exist as text', () => {
    expect(sorted(['31.2.2024', '1.1.2024', '0'])).toEqual(['0', '1.1.2024', '31.2.2024'])
  })

  it('ignores a language it does not know', () => {
    expect(sorted(['b', 'a'], 'ascending', 'not a language!')).toEqual(['a', 'b'])
  })
})

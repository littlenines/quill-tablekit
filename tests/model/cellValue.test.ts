import { describe, expect, it } from 'vitest'
import { normalizeCellValue, parseWidths, readCellValue, writeCellValue } from '../../src/model/cellValue'

describe('normalizeCellValue', () => {
  it('accepts a complete value', () => {
    expect(normalizeCellValue({ table: 't', row: 'r', cell: 'c', rowspan: 2, colspan: 3, widths: [100, 50] })).toEqual({
      table: 't',
      row: 'r',
      cell: 'c',
      rowspan: 2,
      colspan: 3,
      widths: [100, 50],
    })
  })

  it('defaults missing or invalid spans to 1', () => {
    expect(normalizeCellValue({ table: 't', row: 'r', cell: 'c', rowspan: 0, colspan: 'x' })).toMatchObject({
      rowspan: 1,
      colspan: 1,
    })
  })

  it('keeps valid table and cell properties and drops invalid ones', () => {
    const cellValue = normalizeCellValue({
      table: 't',
      row: 'r',
      cell: 'c',
      header: true,
      tableAlign: 'center',
      borderColor: 'rgb(255, 0, 0)',
      background: 'not a color!',
      verticalAlign: 'sideways',
    })

    expect(cellValue).toEqual({
      table: 't',
      row: 'r',
      cell: 'c',
      rowspan: 1,
      colspan: 1,
      header: true,
      tableAlign: 'center',
      borderColor: '#ff0000',
    })
  })

  it('rejects values without ids', () => {
    expect(normalizeCellValue({ table: 't', row: 'r' })).toBeNull()
    expect(normalizeCellValue(true)).toBeNull()
    expect(normalizeCellValue(null)).toBeNull()
  })
})

describe('parseWidths', () => {
  it('reads arrays and comma-separated strings', () => {
    expect(parseWidths([100.4, 200])).toEqual([100, 200])
    expect(parseWidths('80,120')).toEqual([80, 120])
  })

  it('rejects empty or invalid widths', () => {
    expect(parseWidths([])).toBeUndefined()
    expect(parseWidths([100, -5])).toBeUndefined()
    expect(parseWidths('80,abc')).toBeUndefined()
  })
})

describe('DOM round trip', () => {
  it('writes a value to data attributes and reads it back', () => {
    const node = document.createElement('p')
    const value = { table: 't', row: 'r', cell: 'c', rowspan: 1, colspan: 2, widths: [60, 90] }

    writeCellValue(node, value)

    expect(node.dataset.widths).toBe('60,90')
    expect(readCellValue(node)).toEqual(value)
  })

  it('reads back table and cell properties', () => {
    const node = document.createElement('p')
    const value = {
      table: 't',
      row: 'r',
      cell: 'c',
      rowspan: 1,
      colspan: 1,
      header: true,
      tableAlign: 'right' as const,
      borderColor: '#ff0000',
      background: '#fff2cc',
      verticalAlign: 'bottom' as const,
    }

    writeCellValue(node, value)

    expect(readCellValue(node)).toEqual(value)
  })

  it('removes the widths attribute when widths are cleared', () => {
    const node = document.createElement('p')

    writeCellValue(node, { table: 't', row: 'r', cell: 'c', rowspan: 1, colspan: 1, widths: [60] })

    writeCellValue(node, { table: 't', row: 'r', cell: 'c', rowspan: 1, colspan: 1 })

    expect(node.hasAttribute('data-widths')).toBe(false)
  })
})

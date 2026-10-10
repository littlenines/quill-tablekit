import { describe, expect, it } from 'vitest'
import { Delta } from 'quill'
import { TableModel } from '../../src/model/TableModel'
import { setTextAlign, updateCellStyle } from '../../src/model/cellChanges'

describe('changing cells', () => {
  it('removes a style when it is set to null', () => {
    const model = TableModel.create(1, 1)
    const [cell] = model.grid[0]

    updateCellStyle([cell], { background: '#fff2cc', verticalAlign: 'middle' })
    updateCellStyle([cell], { background: null })

    expect(cell.style).toEqual({ verticalAlign: 'middle' })
  })

  it('aligns every line of a cell and keeps their other attributes', () => {
    const model = TableModel.create(1, 1)
    const [cell] = model.grid[0]

    cell.content = new Delta().insert('one\n').insert('two').insert('\n', { direction: 'rtl' })
    setTextAlign([cell], 'center')

    expect(cell.content).toEqual(
      new Delta()
        .insert('one')
        .insert('\n', { align: 'center' })
        .insert('two')
        .insert('\n', { direction: 'rtl', align: 'center' }),
    )

    setTextAlign([cell], undefined)

    expect(cell.content).toEqual(new Delta().insert('one\ntwo').insert('\n', { direction: 'rtl' }))
  })
})

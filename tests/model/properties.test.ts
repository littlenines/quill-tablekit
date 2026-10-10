import { describe, expect, it, vi } from 'vitest'
import {
  normalizeColor,
  normalizeTableAlign,
  normalizeTextAlign,
  normalizeVerticalAlign,
} from '../../src/model/properties'

describe('normalizeColor', () => {
  it('accepts hex, named and functional colors', () => {
    expect(normalizeColor('#fff2cc')).toBe('#fff2cc')
    expect(normalizeColor(' red ')).toBe('red')
    expect(normalizeColor('hsl(120, 50%, 50%)')).toBe('hsl(120, 50%, 50%)')
  })

  it('turns rgb() into hex, the same way Quill stores text colors', () => {
    expect(normalizeColor('rgb(255, 242, 204)')).toBe('#fff2cc')
  })

  it('asks the browser about color names, so a made-up word is not a color', () => {
    vi.stubGlobal('CSS', { supports: (_property: string, value: string) => value !== 'nope' })

    expect(normalizeColor('nope')).toBeUndefined()
    expect(normalizeColor('teal')).toBe('teal')

    vi.unstubAllGlobals()
  })

  it('rejects things that are not a color', () => {
    expect(normalizeColor('transparent')).toBeUndefined()
    expect(normalizeColor('red; background: url(x)')).toBeUndefined()
    expect(normalizeColor(42)).toBeUndefined()
    expect(normalizeColor('')).toBeUndefined()
  })
})

describe('alignment', () => {
  it('drops the default value, so it is not saved', () => {
    expect(normalizeVerticalAlign('top')).toBeUndefined()
    expect(normalizeTableAlign('left')).toBeUndefined()
    expect(normalizeTextAlign('left')).toBeUndefined()
  })

  it('keeps known values and rejects unknown ones', () => {
    expect(normalizeVerticalAlign('middle')).toBe('middle')
    expect(normalizeTableAlign('center')).toBe('center')
    expect(normalizeTextAlign('justify')).toBe('justify')
    expect(normalizeVerticalAlign('baseline')).toBeUndefined()
  })
})

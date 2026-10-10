import { describe, expect, it } from 'vitest'
import { CSS } from '../../src/styles/css'
import { injectStyles } from '../../src/styles/injectStyles'

describe('injectStyles', () => {
  it('adds the styles once', () => {
    injectStyles()
    injectStyles()

    expect(document.querySelectorAll('#quill-tablekit-styles')).toHaveLength(1)
  })

  it('replaces styles left behind by an older version, for example after a hot reload', () => {
    document.getElementById('quill-tablekit-styles')?.remove()

    const oldStyle = document.createElement('style')

    oldStyle.id = 'quill-tablekit-styles'
    oldStyle.textContent = '.qlt-table { color: red; }'
    document.head.append(oldStyle)

    injectStyles()

    expect(document.querySelectorAll('#quill-tablekit-styles')).toHaveLength(1)
    expect(oldStyle.textContent).toBe(CSS)
  })
})

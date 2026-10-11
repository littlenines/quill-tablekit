import { Delta } from 'quill'
import { describe, expect, it } from 'vitest'
import { deltaToInlineMarkdown, inlineMarkdownToDelta } from '../../src/markdown/inlineMarkdown'

describe('reading inline Markdown', () => {
  it('reads bold, italic, strikethrough and code', () => {
    expect(inlineMarkdownToDelta('**bold** *it* _it_ ~~gone~~ `x | y`').ops).toEqual([
      { insert: 'bold', attributes: { bold: true } },
      { insert: ' ' },
      { insert: 'it', attributes: { italic: true } },
      { insert: ' ' },
      { insert: 'it', attributes: { italic: true } },
      { insert: ' ' },
      { insert: 'gone', attributes: { strike: true } },
      { insert: ' ' },
      { insert: 'x | y', attributes: { code: true } },
    ])
  })

  it('reads links with formatted text, images and line breaks', () => {
    expect(inlineMarkdownToDelta('[**docs**](https://a.b)<br>![logo](https://a.b/l.png)').ops).toEqual([
      { insert: 'docs', attributes: { bold: true, link: 'https://a.b' } },
      { insert: '\n' },
      { insert: { image: 'https://a.b/l.png' }, attributes: { alt: 'logo' } },
    ])
  })

  it('keeps escaped characters and underscores inside words', () => {
    expect(inlineMarkdownToDelta(String.raw`snake_case_name \*not italic\* a \| b`).ops).toEqual([
      { insert: 'snake_case_name *not italic* a | b' },
    ])
  })
})

describe('writing inline Markdown', () => {
  it('writes formats, links and line breaks', () => {
    const content = new Delta()
      .insert('bold', { bold: true })
      .insert(' and ')
      .insert('link', { link: 'https://a.b', italic: true })
      .insert('\nsecond line\n')

    expect(deltaToInlineMarkdown(content)).toBe('**bold** and [*link*](https://a.b)<br>second line')
  })

  it('escapes Markdown characters and pipes, also in code', () => {
    const content = new Delta().insert('a|b *c* ').insert('x|y', { code: true }).insert('\n')

    expect(deltaToInlineMarkdown(content)).toBe('a\\|b \\*c\\* `x\\|y`')
  })

  it('keeps spaces outside the format markers', () => {
    expect(deltaToInlineMarkdown(new Delta().insert('x').insert(' bold ', { bold: true }).insert('y\n'))).toBe(
      'x **bold** y',
    )
  })

  it('writes images with their alt text', () => {
    expect(
      deltaToInlineMarkdown(new Delta().insert({ image: 'https://a.b/c.png' }, { alt: 'Chart' }).insert('\n')),
    ).toBe('![Chart](https://a.b/c.png)')
  })
})

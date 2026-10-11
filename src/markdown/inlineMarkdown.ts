import { Delta } from '../utils/quill'

type Formats = Record<string, unknown>

const INLINE_MARKDOWN = new RegExp(
  [
    String.raw`\\([\\\`*_~|[\]()#+\-.!<>])`,
    String.raw`(\`+)(.+?)\2`,
    String.raw`\*\*(?!\s)(.+?)\*\*`,
    String.raw`(?<!\w)__(?!\s)(.+?)__(?!\w)`,
    String.raw`~~(?!\s)(.+?)~~`,
    String.raw`\*(?![\s*])([^*]+?)\*`,
    String.raw`(?<!\w)_(?![\s_])([^_]+?)_(?!\w)`,
    String.raw`!\[([^\]]*)\]\(([^)\s]+)\)`,
    String.raw`\[([^\]]+)\]\(([^)\s]+)\)`,
    String.raw`<br\s*/?>`,
  ].join('|'),
  'gi',
)

const insertText = (delta: Delta, text: string, formats: Formats) =>
  text === '' ? delta : delta.insert(text, Object.keys(formats).length > 0 ? formats : undefined)

// Bold, italic, strikethrough, code, links, images and <br> line breaks
export const inlineMarkdownToDelta = (text: string, formats: Formats = {}): Delta => {
  let delta = new Delta()
  let textStart = 0

  for (const match of text.matchAll(INLINE_MARKDOWN)) {
    const [
      whole,
      escaped,
      ,
      code,
      bold,
      underscoreBold,
      strike,
      italic,
      underscoreItalic,
      imageAlt,
      imageSource,
      linkText,
      linkTarget,
    ] = match

    delta = insertText(delta, text.slice(textStart, match.index), formats)
    textStart = match.index + whole.length

    if (escaped != null) delta = insertText(delta, escaped, formats)
    else if (code != null) delta = insertText(delta, code.trim(), { ...formats, code: true })
    else if (bold ?? underscoreBold)
      delta = delta.concat(inlineMarkdownToDelta(bold ?? underscoreBold, { ...formats, bold: true }))
    else if (strike != null) delta = delta.concat(inlineMarkdownToDelta(strike, { ...formats, strike: true }))
    else if (italic ?? underscoreItalic)
      delta = delta.concat(inlineMarkdownToDelta(italic ?? underscoreItalic, { ...formats, italic: true }))
    else if (imageSource != null) delta = delta.insert({ image: imageSource }, imageAlt ? { alt: imageAlt } : undefined)
    else if (linkTarget != null) delta = delta.concat(inlineMarkdownToDelta(linkText, { ...formats, link: linkTarget }))
    else delta = delta.insert('\n')
  }

  return insertText(delta, text.slice(textStart), formats)
}

const escapeMarkdown = (text: string) => text.replace(/[\\`*_~|[\]]/g, String.raw`\$&`)

const codeSpan = (text: string) => {
  const longestTicks = Math.max(0, ...[...text.matchAll(/`+/g)].map(([ticks]) => ticks.length))
  const fence = '`'.repeat(longestTicks + 1)
  const padding = text.startsWith('`') || text.endsWith('`') ? ' ' : ''

  return `${fence}${padding}${text.replaceAll('|', String.raw`\|`)}${padding}${fence}`
}

const wrap = (text: string, marker: string) => {
  const [, leading, inner, trailing] = /^(\s*)(.*?)(\s*)$/s.exec(text) ?? ['', '', text, '']

  return inner ? `${leading}${marker}${inner}${marker}${trailing}` : text
}

export const deltaToInlineMarkdown = (content: Delta): string =>
  content.ops
    .map(({ insert, attributes = {} }) => {
      if (insert != null && typeof insert === 'object' && 'image' in insert) {
        const alt = typeof attributes.alt === 'string' ? attributes.alt : ''

        return `![${escapeMarkdown(alt)}](${String(insert.image)})`
      }

      if (typeof insert !== 'string') return ''

      return insert
        .split('\n')
        .map((line) => {
          let markdown = attributes.code ? codeSpan(line) : escapeMarkdown(line)

          if (attributes.italic) markdown = wrap(markdown, '*')
          if (attributes.bold) markdown = wrap(markdown, '**')
          if (attributes.strike) markdown = wrap(markdown, '~~')
          if (typeof attributes.link === 'string' && markdown.trim()) markdown = `[${markdown}](${attributes.link})`

          return markdown
        })
        .join('\n')
    })
    .join('')
    .replace(/\n$/, '')
    .replaceAll('\n', '<br>')

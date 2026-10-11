import { CELL_DATA_ATTRIBUTES } from '../model/cellValue'

const EDITOR_ONLY_ATTRIBUTES = [...CELL_DATA_ATTRIBUTES, 'contenteditable', 'data-first-column']

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }

export const escapeText = (text: string) => text.replace(/[&<>"]/g, (character) => HTML_ESCAPES[character])

const QUILL_CLASS_STYLES: [classPattern: RegExp, toStyle: (classValue: string) => string][] = [
  [/^ql-align-(center|right|justify)$/, (alignment) => `text-align: ${alignment};`],
  [/^ql-direction-(rtl)$/, (direction) => `direction: ${direction};`],
]

const inlineStylesForQuillClasses = (element: Element): string =>
  [...element.classList]
    .flatMap((className) =>
      QUILL_CLASS_STYLES.flatMap(([classPattern, toStyle]) => {
        const classValue = classPattern.exec(className)?.[1]

        return classValue ? [toStyle(classValue)] : []
      }),
    )
    .join(' ')

export const tagsWithoutEditorMarkup = (
  element: Element,
  extraStyle?: string,
  exportedTagName?: string,
  extraAttributes: Record<string, string> = {},
): [openingTag: string, closingTag: string] => {
  const cleanCopy = exportedTagName
    ? document.createElement(exportedTagName)
    : (element.cloneNode(false) as HTMLElement)

  if (exportedTagName) {
    for (const { name, value } of element.attributes) cleanCopy.setAttribute(name, value)
  }

  for (const attributeName of EDITOR_ONLY_ATTRIBUTES) cleanCopy.removeAttribute(attributeName)

  for (const [attributeName, attributeValue] of Object.entries(extraAttributes)) {
    cleanCopy.setAttribute(attributeName, attributeValue)
  }

  cleanCopy.style.removeProperty('--qlt-border')
  cleanCopy.style.removeProperty('--qlt-table-stripe')

  cleanCopy.classList.remove(...[...cleanCopy.classList].filter((className) => className.startsWith('qlt-')))

  if (cleanCopy.classList.length === 0) cleanCopy.removeAttribute('class')

  const existingStyle = cleanCopy.getAttribute('style')
  const exportedStyle = [extraStyle, inlineStylesForQuillClasses(cleanCopy), existingStyle].filter(Boolean).join(' ')

  if (exportedStyle) cleanCopy.setAttribute('style', exportedStyle)
  else cleanCopy.removeAttribute('style')

  const closingTag = `</${cleanCopy.tagName.toLowerCase()}>`

  return [cleanCopy.outerHTML.slice(0, -closingTag.length), closingTag]
}

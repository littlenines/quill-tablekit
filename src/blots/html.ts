import Quill from 'quill'
import { BLOT_NAMES, CLASS_NAMES } from '../config/constants'
import { readCellValue } from '../model/cellValue'
import { Parchment, type ParchmentTypes } from '../utils/quill'

type Blot = ParchmentTypes.Blot

const TextBlot = Quill.import('blots/text') as typeof Parchment.TextBlot

const EDITOR_ONLY_ATTRIBUTES = [
  'data-table',
  'data-row',
  'data-cell',
  'data-rowspan',
  'data-colspan',
  'data-widths',
  'contenteditable',
]

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }

const escapeText = (text: string) => text.replace(/[&<>"]/g, (character) => HTML_ESCAPES[character])

const tagsWithoutEditorMarkup = (element: Element, extraStyle?: string): [openingTag: string, closingTag: string] => {
  const cleanCopy = element.cloneNode(false) as HTMLElement

  for (const attributeName of EDITOR_ONLY_ATTRIBUTES) cleanCopy.removeAttribute(attributeName)

  cleanCopy.classList.remove(...[...cleanCopy.classList].filter((className) => className.startsWith('qlt-')))

  if (cleanCopy.classList.length === 0) cleanCopy.removeAttribute('class')

  if (extraStyle) {
    const existingStyle = cleanCopy.getAttribute('style')

    cleanCopy.setAttribute('style', [extraStyle, existingStyle].filter(Boolean).join(' '))
  }

  const closingTag = `</${cleanCopy.tagName.toLowerCase()}>`

  return [cleanCopy.outerHTML.slice(0, -closingTag.length), closingTag]
}

const blotToHTML = (blot: Blot, startIndex: number, length: number): string => {
  if (blot instanceof TextBlot) {
    return escapeText(blot.value().slice(startIndex, startIndex + length)).replaceAll(' ', '&nbsp;')
  }

  if ('html' in blot && typeof blot.html === 'function') {
    return (blot.html as (startIndex: number, length: number) => string)(startIndex, length)
  }

  if (blot instanceof Parchment.ParentBlot) {
    const cellBorder = blot.statics.blotName === BLOT_NAMES.cell ? 'border: 1px solid #000;' : undefined
    const [openingTag, closingTag] = tagsWithoutEditorMarkup(blot.domNode as Element, cellBorder)

    return `${openingTag}${childrenToHTML(blot, startIndex, length)}${closingTag}`
  }

  return blot.domNode instanceof Element ? blot.domNode.outerHTML : ''
}

const childrenToHTML = (parent: ParchmentTypes.ParentBlot, startIndex: number, length: number): string => {
  const childrenHTML: string[] = []

  parent.children.forEachAt(startIndex, length, (child, childStart, childLength) => {
    childrenHTML.push(blotToHTML(child, childStart, childLength))
  })

  return childrenHTML.join('')
}

export const tableHTML = (table: ParchmentTypes.ParentBlot, startIndex: number, length: number): string => {
  const isCell = (blot: Blot) => blot.statics.blotName === BLOT_NAMES.cell
  const selectedCells = table.descendants(isCell, startIndex, length) as ParchmentTypes.ParentBlot[]

  if (selectedCells.length === 1) {
    const [onlyCell] = selectedCells

    return childrenToHTML(onlyCell, startIndex - onlyCell.offset(table), length)
  }

  const tableElement = table.domNode as HTMLElement
  const firstLineElement = tableElement.querySelector<HTMLElement>(`.${CLASS_NAMES.cellLine}`)
  const columnWidths = firstLineElement ? readCellValue(firstLineElement)?.widths : undefined
  const columns = columnWidths?.map((width) => `<col style="width: ${width}px;">`).join('')
  const colgroup = columns ? `<colgroup>${columns}</colgroup>` : ''
  const tableStyle = `border-collapse: collapse; table-layout: fixed;${columnWidths ? '' : ' width: 100%;'}`
  const [openingTag, closingTag] = tagsWithoutEditorMarkup(tableElement, tableStyle)

  return `${openingTag}${colgroup}${childrenToHTML(table, startIndex, length)}${closingTag}`
}

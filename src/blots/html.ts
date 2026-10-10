import Quill from 'quill'
import { BLOT_NAMES, CLASS_NAMES, HEADER_BACKGROUND } from '../config/constants'
import { CELL_DATA_ATTRIBUTES, readCellValue } from '../model/cellValue'
import type { CellArea } from '../model/grid'
import type { TableModel } from '../model/TableModel'
import { indexes } from '../utils/array'
import { Parchment, type ParchmentTypes } from '../utils/quill'

type Blot = ParchmentTypes.Blot

const TextBlot = Quill.import('blots/text') as typeof Parchment.TextBlot

const EDITOR_ONLY_ATTRIBUTES = [...CELL_DATA_ATTRIBUTES, 'contenteditable']

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }

const escapeText = (text: string) => text.replace(/[&<>"]/g, (character) => HTML_ESCAPES[character])

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

const tagsWithoutEditorMarkup = (
  element: Element,
  extraStyle?: string,
  exportedTagName?: string,
): [openingTag: string, closingTag: string] => {
  const cleanCopy = exportedTagName
    ? document.createElement(exportedTagName)
    : (element.cloneNode(false) as HTMLElement)

  if (exportedTagName) {
    for (const { name, value } of element.attributes) cleanCopy.setAttribute(name, value)
  }

  for (const attributeName of EDITOR_ONLY_ATTRIBUTES) cleanCopy.removeAttribute(attributeName)

  cleanCopy.style.removeProperty('--qlt-border')

  cleanCopy.classList.remove(...[...cleanCopy.classList].filter((className) => className.startsWith('qlt-')))

  if (cleanCopy.classList.length === 0) cleanCopy.removeAttribute('class')

  const existingStyle = cleanCopy.getAttribute('style')
  const exportedStyle = [extraStyle, inlineStylesForQuillClasses(cleanCopy), existingStyle].filter(Boolean).join(' ')

  if (exportedStyle) cleanCopy.setAttribute('style', exportedStyle)
  else cleanCopy.removeAttribute('style')

  const closingTag = `</${cleanCopy.tagName.toLowerCase()}>`

  return [cleanCopy.outerHTML.slice(0, -closingTag.length), closingTag]
}

const cellTags = (cellElement: HTMLElement): [openingTag: string, closingTag: string] => {
  const tableElement = cellElement.closest('table')
  const borderColor = tableElement?.style.getPropertyValue('--qlt-border').trim() || '#000'
  const borderStyle = `border: 1px solid ${borderColor};`
  const isInFirstRow = cellElement.parentElement?.previousElementSibling == null

  if (tableElement?.hasAttribute('data-header') && isInFirstRow) {
    return tagsWithoutEditorMarkup(
      cellElement,
      `${borderStyle} text-align: left; background-color: ${HEADER_BACKGROUND};`,
      'th',
    )
  }

  return tagsWithoutEditorMarkup(cellElement, borderStyle)
}

const blotToHTML = (blot: Blot, startIndex: number, length: number): string => {
  if (blot instanceof TextBlot) {
    return escapeText(blot.value().slice(startIndex, startIndex + length)).replaceAll(' ', '&nbsp;')
  }

  if ('html' in blot && typeof blot.html === 'function') {
    return (blot.html as (startIndex: number, length: number) => string)(startIndex, length)
  }

  if (blot instanceof Parchment.ParentBlot) {
    const isCell = blot.statics.blotName === BLOT_NAMES.cell
    const [openingTag, closingTag] = isCell
      ? cellTags(blot.domNode as HTMLElement)
      : tagsWithoutEditorMarkup(blot.domNode as Element)

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

  return wrapInTable(tableElement, columnWidths, childrenToHTML(table, startIndex, length))
}

export const cellAreaHTML = (table: ParchmentTypes.ParentBlot, model: TableModel, area: CellArea): string => {
  const tableElement = table.domNode as HTMLElement
  const cellElementsById = new Map(
    [...tableElement.querySelectorAll<HTMLElement>(`td.${CLASS_NAMES.cell}`)].map((cellElement) => [
      cellElement.dataset.cell,
      cellElement,
    ]),
  )
  const cellsInArea = model.orderedCells().filter(({ column }) => column >= area.left && column < area.right)

  const cellHTML = (cellId: string) => {
    const cellBlot = Quill.find(cellElementsById.get(cellId) as Node)

    return cellBlot instanceof Parchment.ParentBlot ? blotToHTML(cellBlot, 0, cellBlot.length()) : ''
  }

  const rowsHTML = indexes(area.bottom - area.top).map((rowOffset) => {
    const cellsInRow = cellsInArea.filter(({ row }) => row === area.top + rowOffset)

    const rowHeight = model.rowHeights[area.top + rowOffset]
    const rowStyle = rowHeight ? ` style="height: ${rowHeight}px;"` : ''

    return `<tr${rowStyle}>${cellsInRow.map(({ cell }) => cellHTML(cell.id)).join('')}</tr>`
  })

  const columnWidths = model.columnWidths?.slice(area.left, area.right)

  return wrapInTable(tableElement, columnWidths, `<tbody>${rowsHTML.join('')}</tbody>`)
}

const wrapInTable = (tableElement: HTMLElement, columnWidths: number[] | undefined, tableContent: string): string => {
  const exportedTable = tableElement.cloneNode(false) as HTMLElement
  const columns = columnWidths?.map((width) => `<col style="width: ${width}px;">`).join('')
  const colgroup = columns ? `<colgroup>${columns}</colgroup>` : ''
  const borderColor = tableElement.style.getPropertyValue('--qlt-border').trim()
  const tableStyle = [
    'border-collapse: collapse; table-layout: fixed;',
    columnWidths ? '' : ' width: 100%;',
    borderColor ? ` border-color: ${borderColor};` : '',
  ].join('')

  exportedTable.style.width = columnWidths ? `${columnWidths.reduce((total, width) => total + width, 0)}px` : ''

  const [openingTag, closingTag] = tagsWithoutEditorMarkup(exportedTable, tableStyle)

  return `${openingTag}${colgroup}${tableContent}${closingTag}`
}

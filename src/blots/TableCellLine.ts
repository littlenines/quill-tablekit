import Quill from 'quill'
import type BlockType from 'quill/blots/block'
import { BLOT_NAMES, CELL_FORMAT, CLASS_NAMES } from '../config/constants'
import {
  freshCellValue,
  normalizeCellValue,
  readCellValue,
  writeCellValue,
  type TableCellValue,
} from '../model/cellValue'
import { Parchment, type ParchmentTypes } from '../utils/quill'

const Block = Quill.import('blots/block') as typeof BlockType

export class TableCellLine extends Block {
  static blotName = BLOT_NAMES.cellLine
  static tagName = 'P'
  static className = CLASS_NAMES.cellLine

  static create(cellValue?: unknown): HTMLElement {
    const lineElement = super.create(cellValue) as HTMLElement

    writeCellValue(lineElement, normalizeCellValue(cellValue) ?? freshCellValue())
    return lineElement
  }

  static formats(lineElement: HTMLElement): TableCellValue | undefined {
    return readCellValue(lineElement) ?? undefined
  }

  get cellValue(): TableCellValue {
    return readCellValue(this.domNode as HTMLElement) ?? freshCellValue()
  }

  format(formatName: string, formatValue: unknown): void {
    if (formatName === CELL_FORMAT) {
      const newCellValue = normalizeCellValue(formatValue)

      if (newCellValue) {
        writeCellValue(this.domNode as HTMLElement, newCellValue)
        this.cache = {}
      } else if (!formatValue) {
        super.format(formatName, formatValue)
      }

      return
    }

    const registeredFormat = this.scroll.query(formatName, Parchment.Scope.BLOCK)
    const isBlockBlot = registeredFormat != null && !(registeredFormat instanceof Parchment.Attributor)

    if (isBlockBlot) return

    super.format(formatName, formatValue)
  }
}

type Blot = ParchmentTypes.Blot

const findEdgeLine = (blot: Blot | null, side: 'head' | 'tail'): TableCellLine | null => {
  let candidate = blot

  while (candidate && !(candidate instanceof TableCellLine)) {
    candidate = candidate instanceof Parchment.ParentBlot ? candidate.children[side] : null
  }

  return candidate
}

export const firstLine = (blot: Blot | null) => findEdgeLine(blot, 'head')
export const lastLine = (blot: Blot | null) => findEdgeLine(blot, 'tail')

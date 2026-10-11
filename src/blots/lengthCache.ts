import Quill from 'quill'
import type ContainerType from 'quill/blots/container.js'

const QuillContainer = Quill.import('blots/container') as typeof ContainerType

let cachedLengths: WeakMap<ContainerType, number> | null = null

export const withLinesKeptInPlace = <Result>(applyChange: () => Result): Result => {
  cachedLengths = new WeakMap()

  try {
    return applyChange()
  } finally {
    cachedLengths = null
  }
}

const forgetLengths = () => {
  if (cachedLengths) cachedLengths = new WeakMap()
}

export class Container extends QuillContainer {
  length(): number {
    if (!cachedLengths) return super.length()

    const cachedLength = cachedLengths.get(this) ?? super.length()

    cachedLengths.set(this, cachedLength)
    return cachedLength
  }

  insertAt(...insertion: Parameters<ContainerType['insertAt']>): void {
    forgetLengths()
    super.insertAt(...insertion)
  }

  deleteAt(...deletion: Parameters<ContainerType['deleteAt']>): void {
    forgetLengths()
    super.deleteAt(...deletion)
  }

  insertBefore(...insertion: Parameters<ContainerType['insertBefore']>): void {
    forgetLengths()
    super.insertBefore(...insertion)
  }

  removeChild(...removal: Parameters<ContainerType['removeChild']>): void {
    forgetLengths()
    super.removeChild(...removal)
  }
}

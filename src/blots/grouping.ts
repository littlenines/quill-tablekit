import Quill from 'quill'
import type ContainerType from 'quill/blots/container'
import type { TableCellValue } from '../model/cellValue'
import type { ParchmentTypes } from '../utils/quill'
import { firstLine, lastLine } from './TableCellLine'

export const Container = Quill.import('blots/container') as typeof ContainerType
export type OptimizeContext = Parameters<ContainerType['optimize']>[0]

type Blot = ParchmentTypes.Blot
type GroupIdOf = (cellValue: TableCellValue) => string

export const cellIdOf: GroupIdOf = ({ cell }) => cell
export const rowIdOf: GroupIdOf = ({ row }) => row
export const tableIdOf: GroupIdOf = ({ table }) => table

export const sharesGroupId = (blotBefore: Blot | null, blotAfter: Blot | null, groupIdOf: GroupIdOf): boolean => {
  const lineBefore = lastLine(blotBefore)
  const lineAfter = firstLine(blotAfter)

  return lineBefore != null && lineAfter != null && groupIdOf(lineBefore.cellValue) === groupIdOf(lineAfter.cellValue)
}

export const splitWhereGroupIdChanges = (
  container: ContainerType,
  groupIdOf: GroupIdOf,
  optimizeContext: OptimizeContext,
): void => {
  for (let child = container.children.head; child?.next; child = child.next) {
    if (sharesGroupId(child, child.next, groupIdOf)) continue

    const splitOffContainer = container.splitAfter(child) as ContainerType

    splitOffContainer.optimize(optimizeContext)
    return
  }
}

import {
  MENU_GROUPS,
  MENU_ITEM_NAMES,
  type ResolvedTableKitOptions,
  type TableMenuItemName,
} from '../../config/options'
import { canMerge, canSplit, type TableContext } from '../../editing/context'
import { canMoveColumns, canMoveRows } from '../../model/operations/arrange'
import { hasEqualColumns } from '../../model/operations/widths'
import type { MenuItem } from './TableMenu'

export type TableMenuActions = Record<TableMenuItemName, () => void>

export const tableMenuItems = (
  tableContext: TableContext,
  { labels, menu }: Pick<ResolvedTableKitOptions, 'labels' | 'menu'>,
  actions: TableMenuActions,
  onlyItems: readonly TableMenuItemName[] = MENU_ITEM_NAMES,
): MenuItem[][] => {
  const { model, selectedArea } = tableContext
  const itemStates: Partial<Record<TableMenuItemName, Partial<MenuItem>>> = {
    moveRowUp: { enabled: canMoveRows(model, selectedArea, -1) },
    moveRowDown: { enabled: canMoveRows(model, selectedArea, 1) },
    moveColumnLeft: { enabled: canMoveColumns(model, selectedArea, -1) },
    moveColumnRight: { enabled: canMoveColumns(model, selectedArea, 1) },
    equalColumnWidths: { enabled: !hasEqualColumns(model) },
    fitToWidth: { enabled: model.columnWidths != null },
    equalRowHeights: { enabled: model.rowCount > 1 },
    mergeCells: { enabled: canMerge(tableContext) },
    splitCell: { enabled: canSplit(tableContext) },
    headerRow: { checked: model.header },
    headerColumn: { checked: model.headerColumn },
  }

  const menuGroups = MENU_GROUPS.map((menuGroup) =>
    menuGroup
      .filter((menuItemName) => menu.includes(menuItemName) && onlyItems.includes(menuItemName))
      .map((menuItemName) => ({
        label: labels[menuItemName],
        run: actions[menuItemName],
        enabled: true,
        ...itemStates[menuItemName],
      })),
  )

  return menuGroups.filter((menuGroup) => menuGroup.length > 0)
}

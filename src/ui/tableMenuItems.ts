import { MENU_GROUPS, MENU_ITEM_NAMES, type ResolvedTableKitOptions, type TableMenuItemName } from '../config/options'
import { canMerge, canSplit, type TableContext } from '../editing/context'
import type { MenuItem } from './TableMenu'

export type TableMenuActions = Record<TableMenuItemName, () => void>

export const tableMenuItems = (
  tableContext: TableContext,
  { labels, menu }: Pick<ResolvedTableKitOptions, 'labels' | 'menu'>,
  actions: TableMenuActions,
  onlyItems: readonly TableMenuItemName[] = MENU_ITEM_NAMES,
): MenuItem[][] => {
  const itemStates: Partial<Record<TableMenuItemName, Partial<MenuItem>>> = {
    mergeCells: { enabled: canMerge(tableContext) },
    splitCell: { enabled: canSplit(tableContext) },
    headerRow: { checked: tableContext.model.header },
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

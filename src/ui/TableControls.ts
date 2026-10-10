import type Quill from 'quill'
import type { Range } from 'quill'
import type { ResolvedTableKitOptions, TableMenuItemName } from '../config/options'
import type TableKit from '../TableKit'
import { ActionBar } from './ActionBar'
import { installContextMenu } from './contextMenu'
import { PropertiesPanel } from './PropertiesPanel'
import { cellPropertyFields, tablePropertyFields } from './propertyFields'
import { TableMenu } from './TableMenu'
import { tableMenuItems, type TableMenuActions } from './tableMenuItems'
import { TablePicker } from './TablePicker'
import { setupToolbarButton } from './toolbarButton'

interface MenuPosition {
  clientX: number
  clientY: number
  anchor: HTMLElement | null
}

export class TableControls {
  #quill: Quill
  #tableKit: TableKit
  #settings: ResolvedTableKitOptions
  #picker: TablePicker
  #menu: TableMenu
  #panel: PropertiesPanel
  #toolbarButton: HTMLButtonElement | null
  #actionBar: ActionBar | null = null
  #menuPosition: MenuPosition = { clientX: 0, clientY: 0, anchor: null }

  constructor(
    quill: Quill,
    container: HTMLElement,
    settings: ResolvedTableKitOptions,
    tableKit: TableKit,
    signal: AbortSignal,
  ) {
    this.#quill = quill
    this.#tableKit = tableKit
    this.#settings = settings
    this.#picker = new TablePicker(container, settings, (rowCount, columnCount) =>
      tableKit.insertTable(rowCount, columnCount),
    )
    this.#menu = new TableMenu(container)
    this.#panel = new PropertiesPanel(container)

    if (settings.contextMenu && settings.menu.length > 0) {
      installContextMenu(quill, (clientX, clientY) => this.openMenu({ clientX, clientY, anchor: null }), signal)
    }

    this.#toolbarButton = setupToolbarButton(
      quill,
      settings.labels.insertTable,
      () => this.#handleToolbarClick(),
      signal,
    )

    if (settings.actionBar && settings.menu.length > 0) {
      this.#actionBar = new ActionBar(
        quill,
        container,
        settings,
        {
          openItems: (itemNames, anchor) => this.openMenu(this.#positionBelow(anchor), itemNames),
          runItem: (itemName, anchor) => {
            this.closeAll()
            this.#menuPosition = this.#positionBelow(anchor)
            this.#menuActions()[itemName]()
          },
          isOpenFrom: (anchor) => this.isOpen && this.#menuPosition.anchor === anchor,
          isAnythingOpen: () => this.isOpen,
          closeAll: () => this.closeAll(),
          onMoved: () => this.#followAnchor(),
        },
        signal,
      )
    }
  }

  updateActionBar(range: Range | null): void {
    this.#actionBar?.update(range)
  }

  get isOpen(): boolean {
    return this.#picker.popover.isOpen || this.#menu.popover.isOpen || this.#panel.popover.isOpen
  }

  openMenu(menuPosition: MenuPosition, onlyItems?: TableMenuItemName[]): void {
    const tableContext = this.#tableKit.getContext()

    if (!tableContext) return

    this.#menuPosition = menuPosition

    const { clientX, clientY, anchor } = menuPosition
    const menuGroups = tableMenuItems(tableContext, this.#settings, this.#menuActions(), onlyItems)

    if (menuGroups.length === 0) return

    this.#menu.open(menuGroups, clientX, clientY, anchor)
  }

  closeAll(): void {
    this.#picker.close()
    this.#menu.close()
    this.#panel.close()
  }

  #followAnchor(): void {
    const { anchor } = this.#menuPosition

    if (!anchor || !this.isOpen) return

    this.#menuPosition = this.#positionBelow(anchor)

    const { clientX, clientY } = this.#menuPosition

    for (const popover of [this.#menu.popover, this.#panel.popover]) {
      if (popover.isOpen) popover.moveTo(clientX, clientY)
    }
  }

  #positionBelow(anchor: HTMLElement): MenuPosition {
    const { left, bottom } = anchor.getBoundingClientRect()

    return { clientX: left, clientY: bottom + 4, anchor }
  }

  #handleToolbarClick(): void {
    const toolbarButton = this.#toolbarButton

    if (!toolbarButton || !this.#quill.isEnabled()) return
    if (this.isOpen) {
      this.closeAll()
      return
    }

    if (this.#tableKit.isInTable()) {
      const { left, bottom } = toolbarButton.getBoundingClientRect()

      this.openMenu({ clientX: left, clientY: bottom + 4, anchor: toolbarButton })
    } else {
      this.#picker.open(toolbarButton)
    }
  }

  #menuActions(): TableMenuActions {
    const tableKit = this.#tableKit

    return {
      insertRowAbove: () => tableKit.insertRowAbove(),
      insertRowBelow: () => tableKit.insertRowBelow(),
      insertColumnLeft: () => tableKit.insertColumnLeft(),
      insertColumnRight: () => tableKit.insertColumnRight(),
      insertParagraphAbove: () => tableKit.insertParagraphAbove(),
      insertParagraphBelow: () => tableKit.insertParagraphBelow(),
      selectRow: () => tableKit.selectRow(),
      selectColumn: () => tableKit.selectColumn(),
      copyTable: () => void tableKit.copyTable(),
      mergeCells: () => tableKit.mergeCells(),
      splitCell: () => tableKit.splitCell(),
      headerRow: () => tableKit.setTableProperties({ header: !tableKit.getTableProperties()?.header }),
      cellProperties: () => this.#openCellProperties(),
      tableProperties: () => this.#openTableProperties(),
      deleteRow: () => tableKit.deleteRow(),
      deleteColumn: () => tableKit.deleteColumn(),
      deleteTable: () => tableKit.deleteTable(),
    }
  }

  #openCellProperties(): void {
    const cellProperties = this.#tableKit.getCellProperties()

    if (!cellProperties) return

    const fields = cellPropertyFields(cellProperties, this.#settings, (changes) =>
      this.#tableKit.setCellProperties(changes),
    )

    this.#openPanel(this.#settings.labels.cellProperties, fields)
  }

  #openTableProperties(): void {
    const tableProperties = this.#tableKit.getTableProperties()

    if (!tableProperties) return

    const fields = tablePropertyFields(tableProperties, this.#settings, (changes) =>
      this.#tableKit.setTableProperties(changes),
    )

    this.#openPanel(this.#settings.labels.tableProperties, fields)
  }

  #openPanel(title: string, fields: Parameters<PropertiesPanel['open']>[1]): void {
    const { clientX, clientY, anchor } = this.#menuPosition

    this.#panel.open(title, fields, clientX, clientY, anchor)
  }
}

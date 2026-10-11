export type VerticalAlign = 'top' | 'middle' | 'bottom'
export type TableAlign = 'left' | 'center' | 'right'
export type TextAlign = 'left' | 'center' | 'right' | 'justify'
export type BorderStyle = 'solid' | 'dashed' | 'none'
export type CellPadding = 'compact' | 'normal' | 'wide'
export type WidthUnit = 'px' | 'percent'
export type CaptionSide = 'top' | 'bottom'

export interface CellStyle {
  background?: string
  verticalAlign?: VerticalAlign
}

export interface CellProperties {
  background: string | null
  verticalAlign: VerticalAlign
  textAlign: TextAlign
}

export interface TableProperties {
  header: boolean
  headerColumn: boolean
  align: TableAlign
  borderColor: string | null
  borderStyle: BorderStyle
  cellPadding: CellPadding
  striped: boolean
  stripeColor: string | null
  background: string | null
  caption: string
  captionSide: CaptionSide
}

export const VERTICAL_ALIGNS: readonly VerticalAlign[] = ['top', 'middle', 'bottom']
export const TABLE_ALIGNS: readonly TableAlign[] = ['left', 'center', 'right']
export const TEXT_ALIGNS: readonly TextAlign[] = ['left', 'center', 'right', 'justify']
export const BORDER_STYLES: readonly BorderStyle[] = ['solid', 'dashed', 'none']
export const CELL_PADDINGS: readonly CellPadding[] = ['compact', 'normal', 'wide']

const MAX_CAPTION_LENGTH = 300

const COLOR_PATTERN = /^(#[\da-f]{3,8}|(rgb|hsl)a?\([\d\s.,%+-]+\)|[a-z]+)$/i
const NOT_A_COLOR = new Set(['transparent', 'inherit', 'initial', 'unset', 'revert', 'currentcolor', 'none'])

const rgbToHex = (rgbColor: string): string => {
  const channels = rgbColor
    .slice(rgbColor.indexOf('(') + 1, -1)
    .split(',')
    .map((channel) => Number.parseInt(channel, 10).toString(16).padStart(2, '0'))

  return `#${channels.join('')}`
}

const isColorTheBrowserKnows = (color: string): boolean =>
  typeof CSS === 'undefined' || typeof CSS.supports !== 'function' || CSS.supports('color', color)

export const normalizeColor = (colorInput: unknown): string | undefined => {
  if (typeof colorInput !== 'string') return undefined

  const color = colorInput.trim()

  if (!COLOR_PATTERN.test(color) || NOT_A_COLOR.has(color.toLowerCase())) return undefined
  if (!isColorTheBrowserKnows(color)) return undefined

  return color.startsWith('rgb(') ? rgbToHex(color) : color
}

const oneOf = <Value extends string>(allowedValues: readonly Value[], input: unknown): Value | undefined =>
  allowedValues.find((allowedValue) => allowedValue === input)

export const normalizeVerticalAlign = (input: unknown): VerticalAlign | undefined => {
  const verticalAlign = oneOf(VERTICAL_ALIGNS, input)

  return verticalAlign === 'top' ? undefined : verticalAlign
}

export const normalizeTableAlign = (input: unknown): TableAlign | undefined => {
  const tableAlign = oneOf(TABLE_ALIGNS, input)

  return tableAlign === 'left' ? undefined : tableAlign
}

export const normalizeTextAlign = (input: unknown): TextAlign | undefined => {
  const textAlign = oneOf(TEXT_ALIGNS, input)

  return textAlign === 'left' ? undefined : textAlign
}

export const normalizeBorderStyle = (input: unknown): BorderStyle | undefined => {
  const borderStyle = oneOf(BORDER_STYLES, input)

  return borderStyle === 'solid' ? undefined : borderStyle
}

export const normalizeCellPadding = (input: unknown): CellPadding | undefined => {
  const cellPadding = oneOf(CELL_PADDINGS, input)

  return cellPadding === 'normal' ? undefined : cellPadding
}

export const normalizeWidthUnit = (input: unknown): 'percent' | undefined =>
  input === 'percent' ? 'percent' : undefined

export const normalizeCaptionSide = (input: unknown): 'bottom' | undefined =>
  input === 'bottom' ? 'bottom' : undefined

export const normalizeCaption = (input: unknown): string | undefined => {
  if (typeof input !== 'string') return undefined

  const caption = input.replace(/\s+/g, ' ').trim().slice(0, MAX_CAPTION_LENGTH)

  return caption || undefined
}

type WithoutEmptyValues<Fields> = { [Field in keyof Fields]?: NonNullable<Fields[Field]> }

export const withoutEmptyValues = <Fields extends object>(fields: Fields): WithoutEmptyValues<Fields> =>
  Object.fromEntries(
    Object.entries(fields).filter(([, fieldValue]) => fieldValue != null),
  ) as WithoutEmptyValues<Fields>

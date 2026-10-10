export type VerticalAlign = 'top' | 'middle' | 'bottom'
export type TableAlign = 'left' | 'center' | 'right'
export type TextAlign = 'left' | 'center' | 'right' | 'justify'

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
  align: TableAlign
  borderColor: string | null
  background: string | null
}

export const VERTICAL_ALIGNS: readonly VerticalAlign[] = ['top', 'middle', 'bottom']
export const TABLE_ALIGNS: readonly TableAlign[] = ['left', 'center', 'right']
export const TEXT_ALIGNS: readonly TextAlign[] = ['left', 'center', 'right', 'justify']

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

type WithoutEmptyValues<Fields> = { [Field in keyof Fields]?: NonNullable<Fields[Field]> }

export const withoutEmptyValues = <Fields extends object>(fields: Fields): WithoutEmptyValues<Fields> =>
  Object.fromEntries(
    Object.entries(fields).filter(([, fieldValue]) => fieldValue != null),
  ) as WithoutEmptyValues<Fields>

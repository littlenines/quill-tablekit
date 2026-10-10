import { normalizeColor } from '../model/properties'

const browserStyleValue = (propertyName: string, propertyValue: string | undefined): string => {
  if (!propertyValue) return ''

  const scratchStyle = document.createElement('div').style

  scratchStyle.setProperty(propertyName, propertyValue)
  return scratchStyle.getPropertyValue(propertyName)
}

export const setStyle = (element: HTMLElement, propertyName: string, propertyValue: string | undefined): void => {
  const wantedValue = browserStyleValue(propertyName, propertyValue)

  if (element.style.getPropertyValue(propertyName) === wantedValue) return

  if (wantedValue) element.style.setProperty(propertyName, wantedValue)
  else element.style.removeProperty(propertyName)

  if (element.getAttribute('style') === '') element.removeAttribute('style')
}

const SIX_DIGIT_HEX = /^#[\da-f]{6}$/i

export const toSixDigitHex = (color: string | null | undefined): string | null => {
  if (!color) return null
  if (SIX_DIGIT_HEX.test(color)) return color.toLowerCase()

  const browserColor = normalizeColor(browserStyleValue('color', color))

  return browserColor && SIX_DIGIT_HEX.test(browserColor) ? browserColor.toLowerCase() : null
}

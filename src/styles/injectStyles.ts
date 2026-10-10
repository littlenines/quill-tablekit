import { CSS } from './css'

const STYLE_ELEMENT_ID = 'quill-tablekit-styles'

export const injectStyles = (): void => {
  if (typeof document === 'undefined') return

  const existingStyle = document.getElementById(STYLE_ELEMENT_ID)

  if (existingStyle) {
    if (existingStyle.textContent !== CSS) existingStyle.textContent = CSS
    return
  }

  const style = document.createElement('style')

  style.id = STYLE_ELEMENT_ID
  style.textContent = CSS
  document.head.appendChild(style)
}

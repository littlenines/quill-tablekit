type TagName = keyof HTMLElementTagNameMap

export const createElement = <Tag extends TagName>(
  tagName: Tag,
  properties: Partial<Omit<HTMLElementTagNameMap[Tag], 'style' | 'dataset'>> = {},
  attributes: Record<string, string> = {},
): HTMLElementTagNameMap[Tag] => {
  const element = Object.assign(document.createElement(tagName), properties)

  for (const [attributeName, attributeValue] of Object.entries(attributes)) {
    element.setAttribute(attributeName, attributeValue)
  }

  return element
}

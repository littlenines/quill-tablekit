export const sumOf = (numbers: number[]) => numbers.reduce((total, number) => total + number, 0)

export const scaleColumnWidths = (
  startWidths: number[],
  widthChange: number,
  minWidth: number,
  maxTableWidth = Infinity,
): number[] => {
  const startTotal = sumOf(startWidths)
  const widestTotal = Math.max(maxTableWidth, startTotal)
  const newTotal = Math.max(minWidth * startWidths.length, Math.min(widestTotal, startTotal + widthChange))

  const exactWidths = startWidths.map((width) => (width * newTotal) / startTotal)
  const roundedWidths = exactWidths.map(Math.floor)
  let pixelsLeft = Math.round(newTotal) - sumOf(roundedWidths)

  const columnsByRemainder = exactWidths
    .map((width, columnIndex) => ({ columnIndex, remainder: width - Math.floor(width) }))
    .sort((first, second) => second.remainder - first.remainder)

  for (const { columnIndex } of columnsByRemainder) {
    if (pixelsLeft <= 0) break

    roundedWidths[columnIndex] += 1
    pixelsLeft -= 1
  }

  return roundedWidths.map((width) => Math.max(minWidth, width))
}

export const fitColumnWidthsWithin = (columnWidths: number[], maxTableWidth: number, minWidth: number): number[] => {
  const atLeastMinimum = columnWidths.map((width) => Math.max(minWidth, Math.ceil(width)))
  const totalWidth = sumOf(atLeastMinimum)

  if (totalWidth <= maxTableWidth) return atLeastMinimum

  return scaleColumnWidths(atLeastMinimum, maxTableWidth - totalWidth, minWidth, maxTableWidth)
}

export const equalColumnWidths = (columnWidths: number[]): number[] => {
  const totalWidth = sumOf(columnWidths)
  const baseWidth = Math.floor(totalWidth / columnWidths.length)
  const pixelsLeft = totalWidth - baseWidth * columnWidths.length

  return columnWidths.map((_width, columnIndex) => baseWidth + (columnIndex < pixelsLeft ? 1 : 0))
}

const roundToHundredths = (number: number) => Math.round(number * 100) / 100

// Percent widths are shares of the editor, and each column becomes its share of the table
export const columnWidthStyles = (columnWidths: number[], isPercent: boolean): { columns: string[]; table: string } => {
  const totalWidth = sumOf(columnWidths)

  if (!isPercent) return { columns: columnWidths.map((width) => `${width}px`), table: `${totalWidth}px` }

  return {
    columns: columnWidths.map((width) => `${roundToHundredths((width / totalWidth) * 100)}%`),
    table: `${roundToHundredths(totalWidth)}%`,
  }
}

// Swaps the block start..middle with the block middle..end that follows it
export const swapNeighbors = <Item>(list: Item[], start: number, middle: number, end: number): void => {
  const bothBlocks = list.splice(start, end - start)
  const firstBlockLength = middle - start

  list.splice(start, 0, ...bothBlocks.slice(firstBlockLength), ...bothBlocks.slice(0, firstBlockLength))
}
